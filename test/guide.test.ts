import assert from "node:assert/strict";
import test from "node:test";
import { MessageFlags } from "discord.js";
import { commands } from "../src/commands.js";
import { config } from "../src/config.js";
import {
  ExpiringStore,
  language,
  MAX_CONTENT,
  makeGuide,
  parseGuide,
  renderGuide,
} from "../src/guide.js";
import { copy, modal, reader } from "../src/ui.js";

test("guides round-trip in both languages, including punctuation and mentions", () => {
  for (const lang of ["en", "tr"] as const) {
    const g = makeGuide(
      "Topluluk *rehberi*",
      "Visit <#123> and @everyone.\n\nRead **rules**.",
      lang,
    );
    assert.deepEqual(parseGuide(renderGuide(g)), g);
    assert.ok(!renderGuide(g).includes("@everyone"));
  }
});
test("normalizes controls, bidi characters, combining marks and single line breaks", () => {
  const g = makeGuide("Cafe\u0301\u202e", "First\u0000step\nmore\n\nSecond\u200b step", "en");
  assert.equal(g.title, "Café");
  assert.deepEqual(g.steps, ["First step more", "Second step"]);
});
test("Windows and Unix paragraph separators produce identical guides", () => {
  assert.deepEqual(
    makeGuide("Title", "One\r\n\r\nTwo", "en"),
    makeGuide("Title", "One\n\nTwo", "en"),
  );
});
for (const [name, title, body] of [
  ["empty title", " ", "one\n\ntwo"],
  ["multiline title", "a\nb", "one\n\ntwo"],
  ["long title", "t".repeat(61), "one\n\ntwo"],
  ["single step", "Title", "one"],
  ["seven steps", "Title", Array(7).fill("step").join("\n\n")],
  ["long step", "Title", `${"s".repeat(261)}\n\ntwo`],
  ["control-only step", "Title", "\u0000\n\ntwo"],
  ["escaping expansion", "Title", Array(6).fill("*".repeat(260)).join("\n\n")],
] as const)
  test(`rejects ${name}`, () => assert.throws(() => makeGuide(title, body, "en")));

test("maximum plain guide and private preview fit Discord content limit", () => {
  for (const lang of ["en", "tr"] as const) {
    const g = makeGuide("t".repeat(60), Array(6).fill("s".repeat(260)).join("\n\n"), lang);
    assert.ok(renderGuide(g).length <= MAX_CONTENT);
    assert.ok(`${copy[lang].preview}\n\n${renderGuide(g)}`.length <= 2000);
    for (let page = 0; page < 6; page++)
      assert.ok(reader(g, "id", page, lang).content.length <= 2000);
    assert.doesNotThrow(() => modal(lang).toJSON());
  }
});
test("parser rejects malformed or unsupported public messages", () => {
  for (const content of [
    "",
    "x".repeat(2000),
    "StepShelf / de\nT\n\n1. A\n\n2. B",
    "StepShelf / en\nT\n\n1. A",
    "StepShelf / en\nT\n\n1. A\n\n3. B",
    "StepShelf / en\nT\n\n1. A\nInjected\n\n2. B",
    "StepShelf / en\nT\n\n1. A\n\n2. ",
  ]) {
    assert.equal(parseGuide(content), undefined);
  }
});
test("stores expire at the boundary, prune and consume once", () => {
  let now = 0;
  const store = new ExpiringStore<string>(() => now, 1, 10);
  store.put("one", "a");
  assert.throws(() => store.put("two", "b"));
  store.put("one", "updated");
  assert.equal(store.take("one"), "updated");
  assert.equal(store.take("one"), undefined);
  store.put("two", "b");
  now = 10;
  assert.equal(store.get("two"), undefined);
  store.put("three", "c");
  store.delete("three");
  assert.equal(store.get("three"), undefined);
});
test("config rejects missing and malformed values without echoing them", () => {
  for (const env of [
    {},
    { DISCORD_TOKEN: "secret-value" },
    { DISCORD_TOKEN: "x".repeat(40), DISCORD_APPLICATION_ID: "abc", DISCORD_GUILD_ID: "123" },
  ]) {
    assert.throws(() => config(env), /Setup required/);
  }
  assert.equal(
    config({
      DISCORD_TOKEN: "x".repeat(40),
      DISCORD_APPLICATION_ID: "12345678901234567",
      DISCORD_GUILD_ID: "22345678901234567",
    }).guild,
    "22345678901234567",
  );
});
test("commands are serializable, guild-only and manager creation is restricted", () => {
  assert.equal(commands.length, 2);
  assert.equal(commands[0]?.default_member_permissions, "32");
  // Guild registration itself scopes commands; global-only fields must be omitted.
  assert.equal(commands[0]?.contexts, undefined);
  assert.equal(commands[0]?.integration_types, undefined);
  assert.equal(commands[1]?.default_member_permissions, undefined);
  assert.equal(language("tr-TR"), "tr");
  assert.equal(language("de"), "en");
  assert.equal(MessageFlags.Ephemeral, 64);
});
