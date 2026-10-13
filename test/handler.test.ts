import assert from "node:assert/strict";
import test from "node:test";
import {
  ChannelType,
  type Interaction,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { makeGuide, renderGuide } from "../src/guide.js";
import { createHandler } from "../src/handler.js";
import { copy } from "../src/ui.js";

type Payload = {
  content?: string;
  flags?: number;
  components?: { toJSON(): { components: { custom_id?: string }[] } }[];
  allowedMentions?: { parse: unknown[] };
};
function interaction(
  kind: "command" | "modal" | "button",
  customId = "",
  options: {
    user?: string;
    guild?: string;
    channel?: string;
    manager?: boolean;
    permissions?: bigint;
    type?: ChannelType;
    locale?: string;
    content?: string;
    author?: string;
    command?: string;
  } = {},
) {
  const calls: { name: string; payload: Payload }[] = [];
  const i = {
    customId,
    commandName: options.command ?? "stepshelf",
    locale: options.locale ?? "en-US",
    user: { id: options.user ?? "owner" },
    guildId: options.guild ?? "guild",
    channelId: options.channel ?? "channel",
    memberPermissions: new PermissionsBitField(
      options.manager === false ? 0n : PermissionFlagsBits.ManageGuild,
    ),
    appPermissions: new PermissionsBitField(
      options.permissions ?? PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages,
    ),
    client: { user: { id: "bot" } },
    message: { author: { id: options.author ?? "bot" }, content: options.content ?? "" },
    fields: {
      getTextInputValue: (id: string): string =>
        id === "title" ? "Community guide" : "Visit welcome.\n\nRead rules.",
    },
    deferred: false,
    replied: false,
    inGuild: () => true,
    isChatInputCommand: () => kind === "command",
    isModalSubmit: () => kind === "modal",
    isButton: () => kind === "button",
    channel: {
      type: options.type ?? ChannelType.GuildText,
      send: async (payload: Payload) => {
        calls.push({ name: "send", payload });
      },
    },
    reply: async (payload: Payload) => {
      i.replied = true;
      calls.push({ name: "reply", payload });
    },
    followUp: async (payload: Payload) => {
      calls.push({ name: "followUp", payload });
    },
    update: async (payload: Payload) => {
      i.replied = true;
      calls.push({ name: "update", payload });
    },
    editReply: async (payload: Payload) => {
      calls.push({ name: "editReply", payload });
    },
    showModal: async (payload: unknown) => {
      i.replied = true;
      calls.push({ name: "modal", payload: payload as Payload });
    },
    deferUpdate: async () => {
      i.deferred = true;
      calls.push({ name: "defer", payload: {} });
    },
  };
  return { i, calls, asInteraction: () => i as unknown as Interaction };
}
function harness() {
  let time = 10000;
  const handler = createHandler(() => time);
  return {
    handler,
    tick: (ms = 2001) => {
      time += ms;
    },
    async run(item: ReturnType<typeof interaction>) {
      await handler.handle(item.asInteraction());
      return item.calls;
    },
  };
}
function buttonId(calls: { name: string; payload: Payload }[], index = 0) {
  const id = calls.find((c) => c.name === "reply")?.payload.components?.[0]?.toJSON().components[
    index
  ]?.custom_id;
  assert.ok(id);
  return id;
}
async function draft(h: ReturnType<typeof harness>) {
  const item = interaction("modal", "ss:create:en");
  await h.run(item);
  h.tick();
  return buttonId(item.calls);
}
const guideContent = renderGuide(makeGuide("Welcome", "First\n\nSecond\n\nThird", "en"));

test("manager command opens a valid bilingual modal without publishing", async () => {
  for (const locale of ["en-US", "tr"]) {
    const h = harness();
    const item = interaction("command", "", { locale });
    await h.run(item);
    assert.equal(item.calls[0]?.name, "modal");
    const shown = item.calls[0];
    assert.ok(shown);
    assert.doesNotThrow(() => (shown.payload as unknown as { toJSON(): unknown }).toJSON());
    assert.equal(item.calls.length, 1);
  }
});
test("help is private and available to ordinary members", async () => {
  const h = harness();
  const item = interaction("command", "", { manager: false, command: "shelfhelp", locale: "tr" });
  await h.run(item);
  assert.equal(item.calls[0]?.payload.content, copy.tr.help);
  assert.equal(item.calls[0]?.payload.flags, MessageFlags.Ephemeral);
});
test("creation fails closed for ordinary members and disallowed channels", async () => {
  for (const options of [
    { manager: false },
    { permissions: 0n },
    { type: ChannelType.PublicThread },
    { type: ChannelType.GuildVoice },
  ]) {
    const h = harness();
    const item = interaction("command", "", options);
    await h.run(item);
    assert.equal(item.calls[0]?.name, "reply");
    assert.equal(item.calls.length, 1);
  }
});
test("DM and missing-channel interactions cannot create drafts", async () => {
  for (const item of [interaction("command"), interaction("command", "", { channel: "" })]) {
    const h = harness();
    if (item.i.channelId) item.i.inGuild = () => false;
    await h.run(item);
    assert.equal(item.calls[0]?.payload.content, copy.en.channel);
  }
});
test("unrelated commands and components are ignored", async () => {
  const h = harness();
  for (const item of [
    interaction("command", "", { command: "other" }),
    interaction("button", "other:button"),
  ]) {
    await h.run(item);
    assert.equal(item.calls.length, 0);
  }
});
test("modal creates only an ephemeral preview with disabled mentions and embeds", async () => {
  const h = harness();
  const item = interaction("modal", "ss:create:en");
  await h.run(item);
  const payload = item.calls[0]?.payload;
  assert.equal(payload?.flags, MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds);
  assert.deepEqual(payload?.allowedMentions, { parse: [] });
  assert.match(payload?.content ?? "", /Private preview/);
  assert.equal(item.calls.length, 1);
});
test("malformed forms and unauthorized modal IDs are rejected", async () => {
  for (const id of ["ss:create:en", "ss:fake"]) {
    const h = harness();
    const item = interaction("modal", id);
    item.i.fields.getTextInputValue = () => "";
    await h.run(item);
    assert.equal(item.calls[0]?.payload.components, undefined);
    assert.equal(item.calls.length, 1);
  }
});
test("confirm publishes once; a concurrent confirm cannot duplicate the guide", async () => {
  const h = harness();
  const id = await draft(h);
  const first = interaction("button", id);
  const second = interaction("button", id);
  await Promise.all([h.run(first), h.run(second)]);
  assert.equal([...first.calls, ...second.calls].filter((c) => c.name === "send").length, 1);
  const send = first.calls.find((c) => c.name === "send");
  assert.deepEqual(send?.payload.allowedMentions, { parse: [] });
  assert.equal(send?.payload.flags, MessageFlags.SuppressEmbeds);
  assert.equal(first.calls.at(-1)?.payload.content, copy.en.published);
  h.tick();
  const replay = interaction("button", id);
  await h.run(replay);
  assert.equal(replay.calls[0]?.payload.content, copy.en.expired);
});
test("permissions are checked again after preview", async () => {
  for (const options of [
    { manager: false },
    { permissions: PermissionFlagsBits.ViewChannel },
    { type: ChannelType.PublicThread },
  ]) {
    const h = harness();
    const id = await draft(h);
    const item = interaction("button", id, options);
    await h.run(item);
    assert.ok(!item.calls.some((c) => c.name === "send"));
  }
});
test("preview is bound to the original user, guild and channel", async () => {
  for (const options of [{ user: "stranger" }, { guild: "other" }, { channel: "other" }]) {
    const h = harness();
    const id = await draft(h);
    const item = interaction("button", id, options);
    await h.run(item);
    assert.equal(item.calls[0]?.payload.content, copy.en.expired);
    h.tick();
    const owner = interaction("button", id);
    await h.run(owner);
    assert.equal(owner.calls.filter((c) => c.name === "send").length, 1);
  }
});
test("cancel consumes preview without publication", async () => {
  const h = harness();
  const id = await draft(h);
  const item = interaction("button", id.replace(":publish:", ":cancel:"));
  await h.run(item);
  assert.equal(item.calls[0]?.payload.content, copy.en.cancelled);
  h.tick();
  const retry = interaction("button", id);
  await h.run(retry);
  assert.equal(retry.calls[0]?.payload.content, copy.en.expired);
});
test("expired drafts cannot be published", async () => {
  const h = harness();
  const id = await draft(h);
  h.tick(600000);
  h.handler.prune();
  const item = interaction("button", id);
  await h.run(item);
  assert.equal(item.calls[0]?.payload.content, copy.en.expired);
});
test("ambiguous send failure is consumed without automatic retries", async () => {
  const h = harness();
  const id = await draft(h);
  const item = interaction("button", id);
  let attempts = 0;
  item.i.channel.send = async () => {
    attempts++;
    throw Error("private backend detail");
  };
  await h.run(item);
  assert.equal(attempts, 1);
  assert.equal(item.calls.at(-1)?.payload.content, copy.en.error);
  assert.ok(!JSON.stringify(item.calls).includes("private backend detail"));
  h.tick();
  const retry = interaction("button", id);
  await h.run(retry);
  assert.equal(retry.calls[0]?.payload.content, copy.en.expired);
});
test("server publication cooldown also limits different managers", async () => {
  const h = harness();
  const first = await draft(h);
  await h.run(interaction("button", first));
  h.tick();
  const otherDraft = interaction("modal", "ss:create:en", { user: "other" });
  await h.run(otherDraft);
  h.tick();
  const publish = interaction("button", buttonId(otherDraft.calls), { user: "other" });
  await h.run(publish);
  assert.equal(publish.calls[0]?.payload.content, copy.en.busy);
  h.tick(60000);
  const retry = interaction("button", buttonId(otherDraft.calls), { user: "other" });
  await h.run(retry);
  assert.equal(retry.calls.filter((c) => c.name === "send").length, 1);
});
test("public own-message guides work in a fresh handler after restart", async () => {
  const h = harness();
  const item = interaction("button", "ss:read", { content: guideContent, manager: false });
  await h.run(item);
  assert.match(item.calls[0]?.payload.content ?? "", /1 \/ 3/);
  assert.equal(item.calls[0]?.payload.flags, MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds);
  assert.deepEqual(item.calls[0]?.payload.allowedMentions, { parse: [] });
});
test("foreign or corrupted messages cannot open readers", async () => {
  for (const options of [{ content: guideContent, author: "other-bot" }, { content: "corrupt" }]) {
    const h = harness();
    const item = interaction("button", "ss:read", options);
    await h.run(item);
    assert.equal(item.calls[0]?.payload.content, copy.en.invalidGuide);
  }
});
test("reader navigates, closes, and cannot be reused", async () => {
  const h = harness();
  const item = interaction("button", "ss:read", { content: guideContent });
  await h.run(item);
  h.tick();
  const nextId = buttonId(item.calls, 1);
  const next = interaction("button", nextId);
  await h.run(next);
  assert.match(next.calls[0]?.payload.content ?? "", /2 \/ 3/);
  const key = nextId.split(":")[2];
  h.tick();
  const close = interaction("button", `ss:close:${key}`);
  await h.run(close);
  assert.equal(close.calls[0]?.payload.content, copy.en.closed);
  h.tick();
  const replay = interaction("button", nextId);
  await h.run(replay);
  assert.equal(replay.calls[0]?.payload.content, copy.en.expired);
});
test("reader navigation rejects invalid indexes, extra fields and other users", async () => {
  for (const suffix of ["-1", "3", "NaN", "1.1", "1:extra", "999999999999999999999"]) {
    const h = harness();
    const open = interaction("button", "ss:read", { content: guideContent });
    await h.run(open);
    h.tick();
    const key = buttonId(open.calls, 1).split(":")[2];
    const page = interaction("button", `ss:page:${key}:${suffix}`);
    await h.run(page);
    assert.equal(page.calls[0]?.payload.content, copy.en.expired);
  }
  for (const options of [{ user: "other" }, { guild: "other" }, { channel: "other" }]) {
    const h = harness();
    const open = interaction("button", "ss:read", { content: guideContent });
    await h.run(open);
    h.tick();
    const page = interaction("button", buttonId(open.calls, 1), options);
    await h.run(page);
    assert.equal(page.calls[0]?.payload.content, copy.en.expired);
  }
});
test("reader expires after ten minutes without extending on navigation", async () => {
  const h = harness();
  const open = interaction("button", "ss:read", { content: guideContent });
  await h.run(open);
  const nextId = buttonId(open.calls, 1);
  h.tick(590000);
  await h.run(interaction("button", nextId));
  h.tick(10000);
  const expired = interaction("button", nextId);
  await h.run(expired);
  assert.equal(expired.calls[0]?.payload.content, copy.en.expired);
});
test("rapid clicks are rejected with private guidance", async () => {
  const h = harness();
  await h.run(interaction("command"));
  const repeat = interaction("command");
  await h.run(repeat);
  assert.equal(repeat.calls[0]?.payload.content, copy.en.busy);
  assert.equal(repeat.calls[0]?.payload.flags, MessageFlags.Ephemeral);
});
