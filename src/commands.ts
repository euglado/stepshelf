import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
export const commands = [
  new SlashCommandBuilder()
    .setName("stepshelf")
    .setDescription("Preview and publish a short server guide")
    .setDescriptionLocalizations({ tr: "Kısa bir sunucu rehberini önizleyip yayımlayın" })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("shelfhelp")
    .setDescription("Learn how StepShelf guides and private readers work")
    .setDescriptionLocalizations({
      tr: "StepShelf rehberlerinin ve özel okuyucunun kullanımını öğrenin",
    }),
].map((c) => c.toJSON());
