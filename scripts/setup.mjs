import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
if (
  Number(process.versions.node.split(".")[0]) !== 24 ||
  !process.stdin.isTTY ||
  !process.stdout.isTTY
) {
  console.error(
    "Use Node.js 24 in an interactive terminal. / Etkileşimli terminalde Node.js 24 kullanın.",
  );
  process.exit(1);
}
function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return rl.question(question).finally(() => rl.close());
}
function hiddenToken() {
  process.stdout.write("Bot token (hidden / gizli): ");
  return new Promise((resolveToken, reject) => {
    let value = "";
    const input = process.stdin;
    input.setRawMode(true);
    input.setEncoding("utf8");
    input.resume();
    function finish(error) {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolveToken(value);
    }
    function onData(chunk) {
      for (const char of chunk) {
        if (char === "\u0003") {
          finish(Error("cancelled"));
          return;
        }
        if (char === "\r" || char === "\n") {
          finish();
          return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (/^[A-Za-z0-9._-]$/.test(char) && value.length < 201) value += char;
      }
    }
    input.on("data", onData);
  });
}
function npm(args) {
  // All arguments below are fixed by this script; no prompt value reaches a shell.
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error || result.status !== 0) throw Error("command failed");
}
try {
  console.log("StepShelf setup / kurulum. Never share your token. / Tokenınızı paylaşmayın.");
  if (existsSync(".env")) {
    const answer = await ask("Keep existing .env? [Y/n] / Mevcut .env korunsun mu? [E/h]: ");
    if (["n", "h"].includes(answer.trim().toLowerCase())) {
      console.log(
        "For safe replacement, remove .env privately and restart setup. / .env dosyasını gizlice silip kurulumu yeniden başlatın.",
      );
      process.exit(1);
    }
  } else {
    const application = (await ask("Application ID / Uygulama kimliği: ")).trim();
    const guild = (await ask("Server ID / Sunucu kimliği: ")).trim();
    if (![application, guild].every((id) => /^\d{17,22}$/.test(id))) throw Error("invalid IDs");
    const token = await hiddenToken();
    if (!/^[A-Za-z0-9._-]{30,200}$/.test(token)) throw Error("invalid token format");
    writeFileSync(
      ".env",
      `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
      { flag: "wx", mode: 0o600 },
    );
    console.log("Saved .env locally. / .env yalnızca bu bilgisayara kaydedildi.");
  }
  npm(["ci", "--ignore-scripts"]);
  npm(["run", "build"]);
  const register = (await ask("Register commands now? [Y/n] / Komutlar kaydedilsin mi? [E/h]: "))
    .trim()
    .toLowerCase();
  if (!["n", "h"].includes(register)) npm(["run", "register"]);
  console.log(
    "Ready: use start.cmd or bash start.sh. / Hazır: start.cmd veya bash start.sh kullanın.",
  );
} catch {
  console.error(
    "Setup stopped. Check Node 24, IDs, token format, internet and bot installation. Existing .env is preserved. / Kurulum durdu. Node 24, kimlikleri, token biçimini, interneti ve bot kurulumunu kontrol edin. Mevcut .env korunur.",
  );
  process.exitCode = 1;
}
