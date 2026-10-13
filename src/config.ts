export function config(env: NodeJS.ProcessEnv = process.env) {
  const token = env.DISCORD_TOKEN?.trim();
  const application = env.DISCORD_APPLICATION_ID?.trim();
  const guild = env.DISCORD_GUILD_ID?.trim();
  if (
    !token ||
    !/^[A-Za-z0-9._-]{30,200}$/.test(token) ||
    !application ||
    !/^\d{17,22}$/.test(application) ||
    !guild ||
    !/^\d{17,22}$/.test(guild)
  ) {
    throw Error("Setup required: run npm run setup. / Kurulum gerekli: npm run setup çalıştırın.");
  }
  return { token, application, guild };
}
