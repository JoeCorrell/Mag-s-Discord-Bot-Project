const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, infoEmbed, errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current server settings'))
        .addSubcommand(sub =>
            sub.setName('module')
                .setDescription('Enable or disable a module')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('The module to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Moderation', value: 'moderation' },
                            { name: 'Auto-Mod', value: 'automod' },
                            { name: 'Logging', value: 'logging' },
                            { name: 'Welcome', value: 'welcome' },
                            { name: 'Goodbye', value: 'goodbye' },
                            { name: 'Leveling', value: 'leveling' },
                            { name: 'Economy', value: 'economy' },
                            { name: 'Tickets', value: 'tickets' },
                            { name: 'Reaction Roles', value: 'reaction-roles' },
                            { name: 'Fun', value: 'fun' },
                            { name: 'Utility', value: 'utility' },
                            { name: 'Music', value: 'music' },
                            { name: 'Giveaways', value: 'giveaways' },
                            { name: 'Custom Commands', value: 'custom-commands' },
                        ))
                .addStringOption(opt =>
                    opt.setName('action')
                        .setDescription('Enable or disable')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' },
                        ))),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'view') {
            const settings = client.db.settings.getSettings(interaction.guild.id);

            const moduleStatus = Object.entries(config.modules)
                .filter(([, col]) => col !== null)
                .map(([name, col]) => {
                    const enabled = settings[col];
                    const icon = enabled ? '\u2705' : '\u274C';
                    return `${icon} **${name.charAt(0).toUpperCase() + name.slice(1)}**`;
                })
                .join('\n');

            const embed = infoEmbed('Server Settings', `**Modules:**\n${moduleStatus}`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'module') {
            const moduleName = interaction.options.getString('name');
            const action = interaction.options.getString('action');
            const column = config.modules[moduleName];

            if (!column) {
                return interaction.reply({ embeds: [errorEmbed('Invalid Module', 'That module does not exist.')], ephemeral: true });
            }

            const value = action === 'enable' ? 1 : 0;
            client.db.settings.updateSetting(interaction.guild.id, column, value);

            const icon = action === 'enable' ? '\u2705' : '\u274C';
            return interaction.reply({
                embeds: [successEmbed('Module Updated', `${icon} **${moduleName}** has been **${action}d**.`)],
            });
        }
    },
};
