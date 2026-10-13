import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";
import { config } from "./config.js";

try {
  const c = config();
  const rest = new REST({ version: "10" }).setToken(c.token);
  // Upsert only our two commands; never bulk-replace unrelated guild commands.
  for (const command of commands)
    await rest.post(Routes.applicationGuildCommands(c.application, c.guild), { body: command });
  console.log("Commands registered in your server. / Komutlar sunucunuza kaydedildi.");
} catch {
  console.error(
    "Registration failed. Run setup and check application/server IDs, token and server installation. / Kurulumu ve kimlikleri kontrol edin.",
  );
  process.exitCode = 1;
}
