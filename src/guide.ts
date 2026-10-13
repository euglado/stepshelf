import { escapeMarkdown } from "discord.js";

export type Language = "en" | "tr";
export interface Guide {
  language: Language;
  title: string;
  steps: string[];
}
export const MAX_CONTENT = 1800;

export function language(locale: string): Language {
  return locale.startsWith("tr") ? "tr" : "en";
}
function clean(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function safe(text: string): string {
  return escapeMarkdown(clean(text)).replace(/@/g, "@\u200b");
}

export function makeGuide(title: string, paragraphs: string, lang: Language): Guide {
  const raw = paragraphs
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n\s*\n/);
  if (!clean(title) || clean(title).length > 60 || /[\r\n]/.test(title)) throw Error("title");
  if (raw.length < 2 || raw.length > 6 || raw.some((s) => !clean(s) || clean(s).length > 260))
    throw Error("steps");
  const guide = { language: lang, title: safe(title), steps: raw.map(safe) };
  if (renderGuide(guide).length > MAX_CONTENT) throw Error("length");
  return guide;
}

export function renderGuide(guide: Guide): string {
  return `StepShelf / ${guide.language}\n${guide.title}\n\n${guide.steps.map((s, i) => `${i + 1}. ${s}`).join("\n\n")}`;
}

// Read only canonical content attached to an interaction on our own message.
// No message-history request or member-message listener is used.
export function parseGuide(content: string): Guide | undefined {
  if (content.length > MAX_CONTENT) return;
  const parts = content.split("\n\n");
  const header = parts.shift()?.match(/^StepShelf \/ (en|tr)\n([^\n]{1,180})$/);
  if (!header || parts.length < 2 || parts.length > 6) return;
  const steps: string[] = [];
  for (const [i, part] of parts.entries()) {
    const prefix = `${i + 1}. `;
    if (!part.startsWith(prefix) || part.length > 600 || /[\r\n]/.test(part)) return;
    const body = part.slice(prefix.length);
    if (!body.trim()) return;
    steps.push(body);
  }
  return { language: header[1] as Language, title: header[2] as string, steps };
}

export class ExpiringStore<T> {
  private readonly entries = new Map<string, { value: T; expires: number }>();
  constructor(
    private readonly now: () => number = Date.now,
    private readonly capacity = 500,
    private readonly ttl = 600_000,
  ) {}
  prune(): void {
    for (const [key, item] of this.entries)
      if (item.expires <= this.now()) this.entries.delete(key);
  }
  put(key: string, value: T): void {
    this.prune();
    if (!this.entries.has(key) && this.entries.size >= this.capacity) throw Error("capacity");
    this.entries.set(key, { value, expires: this.now() + this.ttl });
  }
  get(key: string): T | undefined {
    this.prune();
    return this.entries.get(key)?.value;
  }
  take(key: string): T | undefined {
    const value = this.get(key);
    this.entries.delete(key);
    return value;
  }
  delete(key: string): void {
    this.entries.delete(key);
  }
}
