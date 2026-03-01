const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, infoEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logging')
        .setDescription('Configure the logging system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Set the log channel')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('The channel for logs')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription('Toggle a log type')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('The log type to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Message Edits', value: 'log_message_edits' },
                            { name: 'Message Deletes', value: 'log_message_deletes' },
                            { name: 'Member Join', value: 'log_member_join' },
                            { name: 'Member Leave', value: 'log_member_leave' },
                            { name: 'Role Changes', value: 'log_role_changes' },
                            { name: 'Channel Changes', value: 'log_channel_changes' },
                            { name: 'Mod Actions', value: 'log_mod_actions' },
                        )))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current logging settings')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            client.db.settings.updateSetting(interaction.guild.id, 'log_channel_id', channel.id);
            return interaction.reply({ embeds: [successEmbed('Log Channel Set', `Logs will be sent to ${channel}.`)] });
        }

        if (sub === 'toggle') {
            const type = interaction.options.getString('type');
            const settings = client.db.settings.getSettings(interaction.guild.id);
            const newValue = settings[type] ? 0 : 1;
            client.db.settings.updateSetting(interaction.guild.id, type, newValue);

            const name = type.replace('log_', '').replace(/_/g, ' ');
            return interaction.reply({
                embeds: [successEmbed('Log Type Updated', `**${name}** logging has been **${newValue ? 'enabled' : 'disabled'}**.`)],
            });
        }

        if (sub === 'view') {
            const settings = client.db.settings.getSettings(interaction.guild.id);
            const logTypes = [
                ['Message Edits', settings.log_message_edits],
                ['Message Deletes', settings.log_message_deletes],
                ['Member Join', settings.log_member_join],
                ['Member Leave', settings.log_member_leave],
                ['Role Changes', settings.log_role_changes],
                ['Channel Changes', settings.log_channel_changes],
                ['Mod Actions', settings.log_mod_actions],
            ];

            const list = logTypes.map(([name, enabled]) => `${enabled ? '\u2705' : '\u274C'} ${name}`).join('\n');
            const channel = settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Not set';

            return interaction.reply({
                embeds: [infoEmbed('Logging Settings', `**Channel:** ${channel}\n**Module:** ${settings.mod_logging ? 'Enabled' : 'Disabled'}\n\n${list}`)],
            });
        }
    },
};
