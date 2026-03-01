const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, infoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Set the welcome channel')
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('The welcome channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub =>
            sub.setName('message')
                .setDescription('Set the welcome message')
                .addStringOption(opt =>
                    opt.setName('text').setDescription('The welcome message. Use {user}, {server}, {memberCount}').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('dm')
                .setDescription('Set a DM welcome message')
                .addStringOption(opt =>
                    opt.setName('text').setDescription('DM message. Use {user}, {server}. Leave empty to disable.')))
        .addSubcommand(sub =>
            sub.setName('test')
                .setDescription('Test the welcome message'))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current welcome settings')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            client.db.settings.updateSetting(interaction.guild.id, 'welcome_channel_id', channel.id);
            return interaction.reply({ embeds: [successEmbed('Welcome Channel Set', `Welcome messages will be sent to ${channel}.`)] });
        }

        if (sub === 'message') {
            const text = interaction.options.getString('text');
            client.db.settings.updateSetting(interaction.guild.id, 'welcome_message', text);
            return interaction.reply({ embeds: [successEmbed('Welcome Message Set', `**Message:** ${text}`)] });
        }

        if (sub === 'dm') {
            const text = interaction.options.getString('text');
            if (text) {
                client.db.settings.updateSettings(interaction.guild.id, { welcome_dm: 1, welcome_dm_message: text });
                return interaction.reply({ embeds: [successEmbed('Welcome DM Set', `**DM Message:** ${text}`)] });
            } else {
                client.db.settings.updateSetting(interaction.guild.id, 'welcome_dm', 0);
                return interaction.reply({ embeds: [successEmbed('Welcome DM Disabled', 'Welcome DMs have been disabled.')] });
            }
        }

        if (sub === 'test') {
            const { replaceVariables } = require('../../utils/variables');
            const settings = client.db.settings.getSettings(interaction.guild.id);
            const data = { user: interaction.user, guild: interaction.guild, channel: interaction.channel };
            const message = replaceVariables(settings.welcome_message, data);

            return interaction.reply({ content: `**Preview:**\n${message}`, ephemeral: true });
        }

        if (sub === 'view') {
            const settings = client.db.settings.getSettings(interaction.guild.id);
            const embed = infoEmbed('Welcome Settings', [
                `**Module:** ${settings.mod_welcome ? 'Enabled' : 'Disabled'}`,
                `**Channel:** ${settings.welcome_channel_id ? `<#${settings.welcome_channel_id}>` : 'Not set'}`,
                `**Message:** ${settings.welcome_message}`,
                `**Embed:** ${settings.welcome_embed ? 'Yes' : 'No'}`,
                `**DM:** ${settings.welcome_dm ? 'Enabled' : 'Disabled'}`,
                settings.welcome_dm_message ? `**DM Message:** ${settings.welcome_dm_message}` : '',
            ].filter(Boolean).join('\n'));

            return interaction.reply({ embeds: [embed] });
        }
    },
};
