import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { config } from "./config.js";
import { createHandler } from "./handler.js";

async function main() {
  let settings: ReturnType<typeof config>;
  try {
    settings = config();
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({ MessageManager: 0 }),
    allowedMentions: { parse: [] },
  });
  const { handle, prune } = createHandler();
  client.on(Events.InteractionCreate, (i) => {
    void handle(i);
  });
  client.once(Events.ClientReady, () => console.log("StepShelf ready. / StepShelf hazır."));
  client.on(Events.Error, () =>
    console.error("Discord connection error; check connectivity. / Bağlantıyı kontrol edin."),
  );
  const timer = setInterval(prune, 60_000);
  timer.unref();
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => {
      clearInterval(timer);
      client.destroy();
    });
  try {
    await client.login(settings.token);
  } catch {
    clearInterval(timer);
    client.destroy();
    console.error(
      "Login failed. Check the bot token privately and reset it if exposed. / Bot tokenını gizlice kontrol edin.",
    );
    process.exitCode = 1;
  }
}
await main();
