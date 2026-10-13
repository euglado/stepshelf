import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Guide, Language } from "./guide.js";

export const copy = {
  en: {
    create: "Create a server guide",
    title: "Guide title",
    steps: "2–6 steps: separate with a blank line",
    placeholder:
      "Open the welcome channel.\n\nRead the community rules.\n\nAsk a moderator if you need help.",
    preview:
      "Private preview — publish makes all of this text visible in this channel. Never include secrets or personal data.",
    publish: "Publish guide",
    cancel: "Cancel",
    read: "Read one step at a time",
    back: "Previous",
    next: "Next",
    close: "Close reader",
    denied: "You need Manage Server to create or publish guides.",
    channel:
      "Use a normal server text or announcement channel. The bot needs View Channel and Send Messages here.",
    expired:
      "This preview or reader expired, was already used, or belongs to someone else. Start again from the command or guide.",
    invalid:
      "Use a title of 1–60 characters and 2–6 steps of at most 260 characters each, separated by blank lines. Shorten formatting-heavy text if needed (1,800 characters after escaping).",
    error:
      "The operation could not finish. Check this channel before trying again: a network failure can leave a published guide. Check permissions. No error details or tokens are logged.",
    published: "Guide published. Members can read privately using its button.",
    cancelled: "Preview cancelled. Nothing was published.",
    closed: "Reader closed. You can reopen the guide at any time.",
    busy: "Please wait a moment, then try again. The bot limits rapid clicks and publication.",
    invalidGuide: "This message is not a supported StepShelf guide. Ask a manager to recreate it.",
    help: "Managers: /stepshelf opens a form; separate 2–6 short steps with blank lines, review privately, then Publish. Members: use a guide’s Read button, then Previous/Next/Close. Readers expire after 10 minutes; reopen from the public guide. Public guides stay after restart. To change/remove one, ask staff to delete its message and create a new guide. No read receipts, DMs or automatic moderation. UI follows your Discord language (Turkish or English).",
  },
  tr: {
    create: "Sunucu rehberi oluştur",
    title: "Rehber başlığı",
    steps: "2–6 adım: araya boş satır bırakın",
    placeholder:
      "Karşılama kanalını açın.\n\nTopluluk kurallarını okuyun.\n\nYardım için bir moderatöre danışın.",
    preview:
      "Özel önizleme — yayımlayınca bu metnin tamamı bu kanalda görünür. Gizli veya kişisel bilgi eklemeyin.",
    publish: "Rehberi yayımla",
    cancel: "İptal",
    read: "Adım adım oku",
    back: "Önceki",
    next: "Sonraki",
    close: "Okuyucuyu kapat",
    denied: "Rehber oluşturmak veya yayımlamak için Sunucuyu Yönet izni gerekir.",
    channel:
      "Normal bir sunucu metin veya duyuru kanalı kullanın. Botun burada Kanalı Görüntüle ve Mesaj Gönder izinleri olmalı.",
    expired:
      "Bu önizleme veya okuyucunun süresi doldu, zaten kullanıldı ya da başka birine ait. Komuttan veya rehberden yeniden başlayın.",
    invalid:
      "1–60 karakterlik başlık ve boş satırlarla ayrılmış, her biri en fazla 260 karakter olan 2–6 adım girin. Gerekirse biçimlendirmeyi kısaltın (kaçışlardan sonra 1.800 karakter sınırı).",
    error:
      "İşlem tamamlanamadı. Yeniden denemeden kanalı kontrol edin: bağlantı hatasında rehber yayımlanmış olabilir. Kanal izinlerini kontrol edin. Hata ayrıntıları veya tokenlar loglanmaz.",
    published: "Rehber yayımlandı. Üyeler düğmeyle özel olarak okuyabilir.",
    cancelled: "Önizleme iptal edildi. Hiçbir şey yayımlanmadı.",
    closed: "Okuyucu kapatıldı. Rehberi istediğiniz zaman yeniden açabilirsiniz.",
    busy: "Biraz bekleyip yeniden deneyin. Hızlı tıklamalar ve yayınlar sınırlandırılır.",
    invalidGuide:
      "Bu mesaj desteklenen bir StepShelf rehberi değil. Bir yöneticiden yeniden oluşturmasını isteyin.",
    help: "Yöneticiler: /stepshelf formunu açın; 2–6 kısa adımı boş satırla ayırın, özel önizleyin ve Yayımla’ya basın. Üyeler: rehberdeki Oku düğmesiyle başlayıp Önceki/Sonraki/Kapat’ı kullanın. Okuyucu 10 dakikada sona erer; rehberden yeniden açılır. Yayımlanan rehberler yeniden başlatmada kalır. Değiştirmek/silmek için yetkililer mesajı silip yeni rehber oluşturabilir. Okundu takibi, DM veya otomatik moderasyon yoktur. Arayüz Discord dilinizi izler (Türkçe/İngilizce).",
  },
} as const;

function button(
  id: string,
  label: string,
  style = ButtonStyle.Secondary,
  disabled = false,
): ButtonBuilder {
  return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setDisabled(disabled);
}
export function modal(lang: Language): ModalBuilder {
  const t = copy[lang];
  return new ModalBuilder()
    .setCustomId(`ss:create:${lang}`)
    .setTitle(t.create)
    .addLabelComponents(
      new LabelBuilder()
        .setLabel(t.title)
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("title")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(60),
        ),
      new LabelBuilder()
        .setLabel(t.steps)
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("steps")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1600)
            .setPlaceholder(t.placeholder),
        ),
    );
}
export function previewButtons(id: string, lang: Language): ActionRowBuilder<ButtonBuilder>[] {
  const t = copy[lang];
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(`ss:publish:${id}`, t.publish, ButtonStyle.Primary),
      button(`ss:cancel:${id}`, t.cancel),
    ),
  ];
}
export function readButton(lang: Language): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button("ss:read", copy[lang].read, ButtonStyle.Primary),
    ),
  ];
}
export function reader(guide: Guide, id: string, page: number, lang: Language) {
  const t = copy[lang];
  return {
    content: `${guide.title}\n\n${page + 1} / ${guide.steps.length}\n\n${guide.steps[page]}`,
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        button(`ss:page:${id}:${page - 1}`, t.back, ButtonStyle.Secondary, page === 0),
        button(
          `ss:page:${id}:${page + 1}`,
          t.next,
          ButtonStyle.Primary,
          page === guide.steps.length - 1,
        ),
        button(`ss:close:${id}`, t.close),
      ),
    ],
    allowedMentions: { parse: [] as [] },
  };
}
