const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, infoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goodbye')
        .setDescription('Configure goodbye messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Set the goodbye channel')
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('The goodbye channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub =>
            sub.setName('message')
                .setDescription('Set the goodbye message')
                .addStringOption(opt =>
                    opt.setName('text').setDescription('The goodbye message. Use {user}, {server}, {memberCount}').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current goodbye settings')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            client.db.settings.updateSetting(interaction.guild.id, 'goodbye_channel_id', channel.id);
            return interaction.reply({ embeds: [successEmbed('Goodbye Channel Set', `Goodbye messages will be sent to ${channel}.`)] });
        }

        if (sub === 'message') {
            const text = interaction.options.getString('text');
            client.db.settings.updateSetting(interaction.guild.id, 'goodbye_message', text);
            return interaction.reply({ embeds: [successEmbed('Goodbye Message Set', `**Message:** ${text}`)] });
        }

        if (sub === 'view') {
            const settings = client.db.settings.getSettings(interaction.guild.id);
            const embed = infoEmbed('Goodbye Settings', [
                `**Module:** ${settings.mod_goodbye ? 'Enabled' : 'Disabled'}`,
                `**Channel:** ${settings.goodbye_channel_id ? `<#${settings.goodbye_channel_id}>` : 'Not set'}`,
                `**Message:** ${settings.goodbye_message}`,
                `**Embed:** ${settings.goodbye_embed ? 'Yes' : 'No'}`,
            ].join('\n'));

            return interaction.reply({ embeds: [embed] });
        }
    },
};
