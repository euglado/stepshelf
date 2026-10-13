import { randomBytes } from "node:crypto";
import { ChannelType, type Interaction, MessageFlags, PermissionFlagsBits } from "discord.js";
import {
  ExpiringStore,
  type Guide,
  type Language,
  language,
  makeGuide,
  parseGuide,
  renderGuide,
} from "./guide.js";
import { copy, modal, previewButtons, readButton, reader } from "./ui.js";

interface Bound {
  user: string;
  guild: string;
  channel: string;
  guide: Guide;
  lang: Language;
}
export function createHandler(now: () => number = Date.now) {
  const drafts = new ExpiringStore<Bound>(now);
  const sessions = new ExpiringStore<Bound>(now);
  const clicks = new ExpiringStore<number>(now, 2000, 2000);
  const publications = new ExpiringStore<boolean>(now, 500, 60_000);
  const prune = () => {
    drafts.prune();
    sessions.prune();
    clicks.prune();
    publications.prune();
  };
  async function handle(i: Interaction): Promise<void> {
    if (!i.isChatInputCommand() && !i.isModalSubmit() && !i.isButton()) return;
    if (
      i.isChatInputCommand()
        ? !["stepshelf", "shelfhelp"].includes(i.commandName)
        : !i.customId.startsWith("ss:")
    )
      return;
    const lang = language(i.locale);
    const t = copy[lang];
    const reply = (content: string) =>
      i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
    const manager = () => i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) === true;
    const matches = (b: Bound | undefined): b is Bound =>
      !!b && b.user === i.user.id && b.guild === i.guildId && b.channel === i.channelId;
    try {
      if (!i.inGuild() || !i.channelId) {
        await reply(t.channel);
        return;
      }
      const clickKey = `${i.guildId}:${i.user.id}`;
      if (clicks.get(clickKey) !== undefined) {
        await reply(t.busy);
        return;
      }
      clicks.put(clickKey, now());
      if (i.isChatInputCommand() && i.commandName === "shelfhelp") {
        await reply(t.help);
        return;
      }
      if (i.isChatInputCommand()) {
        if (!manager()) {
          await reply(t.denied);
          return;
        }
        if (
          ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
            i.channel?.type as ChannelType,
          ) ||
          !i.appPermissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ])
        ) {
          await reply(t.channel);
          return;
        }
        await i.showModal(modal(lang));
        return;
      }
      if (i.isModalSubmit()) {
        if (!manager()) {
          await reply(t.denied);
          return;
        }
        if (
          i.customId !== `ss:create:${lang}` &&
          !["ss:create:en", "ss:create:tr"].includes(i.customId)
        ) {
          await reply(t.expired);
          return;
        }
        let guide: Guide;
        try {
          guide = makeGuide(
            i.fields.getTextInputValue("title"),
            i.fields.getTextInputValue("steps"),
            lang,
          );
        } catch {
          await reply(t.invalid);
          return;
        }
        const id = randomBytes(12).toString("hex");
        drafts.put(id, { user: i.user.id, guild: i.guildId, channel: i.channelId, guide, lang });
        await i.reply({
          content: `${t.preview}\n\n${renderGuide(guide)}`,
          components: previewButtons(id, lang),
          flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
          allowedMentions: { parse: [] },
        });
        return;
      }
      const bits = i.customId.split(":");
      const action = bits[1];
      const id = bits[2] ?? "";
      if (action === "publish" || action === "cancel") {
        const draft = drafts.get(id);
        if (!matches(draft)) {
          await reply(t.expired);
          return;
        }
        if (action === "cancel") {
          drafts.take(id);
          await i.update({ content: t.cancelled, components: [], allowedMentions: { parse: [] } });
          return;
        }
        if (!manager()) {
          await reply(t.denied);
          return;
        }
        const channel = i.channel;
        if (
          !channel ||
          ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type) ||
          !("send" in channel) ||
          !i.appPermissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ])
        ) {
          await reply(t.channel);
          return;
        }
        if (publications.get(i.guildId)) {
          await reply(t.busy);
          return;
        }
        // Reserve synchronously before the first await: parallel confirms cannot publish twice.
        drafts.take(id);
        publications.put(i.guildId, true);
        await i.deferUpdate();
        try {
          await channel.send({
            content: renderGuide(draft.guide),
            components: readButton(draft.lang),
            flags: MessageFlags.SuppressEmbeds,
            allowedMentions: { parse: [] },
          });
        } catch {
          // An ambiguous network failure may have sent the message. Never auto-retry.
          await i.editReply({ content: t.error, components: [], allowedMentions: { parse: [] } });
          return;
        }
        await i.editReply({ content: t.published, components: [], allowedMentions: { parse: [] } });
        return;
      }
      if (i.customId === "ss:read") {
        const guide =
          i.message.author.id === i.client.user?.id ? parseGuide(i.message.content) : undefined;
        if (!guide) {
          await reply(t.invalidGuide);
          return;
        }
        const key = randomBytes(12).toString("hex");
        sessions.put(key, { user: i.user.id, guild: i.guildId, channel: i.channelId, guide, lang });
        await i.reply({
          ...reader(guide, key, 0, lang),
          flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
        });
        return;
      }
      if (action === "page" || action === "close") {
        const session = sessions.get(id);
        if (!matches(session)) {
          await reply(t.expired);
          return;
        }
        if (action === "close") {
          sessions.take(id);
          await i.update({ content: t.closed, components: [], allowedMentions: { parse: [] } });
          return;
        }
        const value = bits[3] ?? "";
        const page = Number(value);
        if (
          bits.length !== 4 ||
          !/^\d+$/.test(value) ||
          !Number.isSafeInteger(page) ||
          page < 0 ||
          page >= session.guide.steps.length
        ) {
          await reply(t.expired);
          return;
        }
        await i.update(reader(session.guide, id, page, session.lang));
        return;
      }
      await reply(t.expired);
    } catch {
      // Never log interaction objects, request URLs, tokens, or user content.
      try {
        if (i.deferred)
          await i.editReply({ content: t.error, components: [], allowedMentions: { parse: [] } });
        else if (i.replied)
          await i.followUp({
            content: t.error,
            flags: MessageFlags.Ephemeral,
            allowedMentions: { parse: [] },
          });
        else await reply(t.error);
      } catch {
        console.error("Discord response failed; inspect bot connectivity and channel permissions.");
      }
    }
  }
  return { handle, prune };
}
