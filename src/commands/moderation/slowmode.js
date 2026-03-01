const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addIntegerOption(opt =>
            opt.setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600)),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageChannels],

    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');

        await interaction.channel.setRateLimitPerUser(seconds);

        if (seconds === 0) {
            return interaction.reply({ embeds: [successEmbed('Slowmode Disabled', `Slowmode has been disabled in ${interaction.channel}.`)] });
        }

        return interaction.reply({ embeds: [successEmbed('Slowmode Set', `Slowmode set to **${seconds} seconds** in ${interaction.channel}.`)] });
    },
};
