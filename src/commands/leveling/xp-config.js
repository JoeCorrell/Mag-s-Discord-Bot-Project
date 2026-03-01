const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, infoEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('Configure the leveling system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('notification-channel')
                .setDescription('Set the level-up notification channel')
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('Channel for level-up notifications (leave empty for same channel)').addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub =>
            sub.setName('add-role-reward')
                .setDescription('Add a role reward for reaching a level')
                .addIntegerOption(opt => opt.setName('level').setDescription('The level').setRequired(true).setMinValue(1))
                .addRoleOption(opt => opt.setName('role').setDescription('The role to give').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove-role-reward')
                .setDescription('Remove a role reward')
                .addIntegerOption(opt => opt.setName('level').setDescription('The level').setRequired(true).setMinValue(1)))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View leveling settings and role rewards')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'notification-channel') {
            const channel = interaction.options.getChannel('channel');
            client.db.settings.updateSetting(interaction.guild.id, 'xp_notification_channel', channel?.id || null);

            if (channel) {
                return interaction.reply({ embeds: [successEmbed('Notification Channel Set', `Level-up notifications will be sent to ${channel}.`)] });
            }
            return interaction.reply({ embeds: [successEmbed('Notification Channel Reset', 'Level-up notifications will be sent in the same channel.')] });
        }

        if (sub === 'add-role-reward') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');

            client.db.leveling.addReward(interaction.guild.id, level, role.id);
            return interaction.reply({ embeds: [successEmbed('Role Reward Added', `${role} will be given at **Level ${level}**.`)] });
        }

        if (sub === 'remove-role-reward') {
            const level = interaction.options.getInteger('level');
            client.db.leveling.removeReward(interaction.guild.id, level);
            return interaction.reply({ embeds: [successEmbed('Role Reward Removed', `Removed reward for **Level ${level}**.`)] });
        }

        if (sub === 'view') {
            const settings = client.db.settings.getSettings(interaction.guild.id);
            const rewards = client.db.leveling.getRewards(interaction.guild.id);

            const rewardList = rewards.length > 0
                ? rewards.map(r => `Level ${r.level} \u2192 <@&${r.role_id}>`).join('\n')
                : 'No role rewards set';

            const embed = infoEmbed('Leveling Settings', [
                `**Module:** ${settings.mod_leveling ? 'Enabled' : 'Disabled'}`,
                `**XP Range:** ${settings.xp_min} - ${settings.xp_max}`,
                `**Cooldown:** ${settings.xp_cooldown / 1000}s`,
                `**Notification Channel:** ${settings.xp_notification_channel ? `<#${settings.xp_notification_channel}>` : 'Same channel'}`,
                `\n**Role Rewards:**`,
                rewardList,
            ].join('\n'));

            return interaction.reply({ embeds: [embed] });
        }
    },
};
