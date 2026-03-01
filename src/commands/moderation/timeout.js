const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed } = require('../../utils/embedBuilder');
const { parseDuration, formatDuration } = require('../../utils/time');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to timeout').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 10m, 1h, 1d)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for timeout')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction, client) {
        const target = interaction.options.getMember('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'User not found in this server.')], ephemeral: true });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You cannot timeout yourself.')], ephemeral: true });
        }

        if (!target.moderatable) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'I cannot timeout this user.')], ephemeral: true });
        }

        if (interaction.member.roles.highest.position <= target.roles.highest.position) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You cannot timeout someone with an equal or higher role.')], ephemeral: true });
        }

        const duration = parseDuration(durationStr);
        if (!duration || duration < 5000 || duration > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'Invalid duration. Must be between 5 seconds and 28 days.')], ephemeral: true });
        }

        await target.timeout(duration, reason);

        client.db.modLogs.add(interaction.guild.id, target.id, interaction.user.id, 'timeout', reason, durationStr);

        await target.send({ embeds: [modEmbed('Timed Out', target.user, interaction.user, reason, { duration: formatDuration(duration) }).setDescription(`You have been timed out in **${interaction.guild.name}**`)] }).catch(() => {});

        const settings = client.db.settings.getSettings(interaction.guild.id);
        if (settings.mod_logging && settings.log_channel_id && settings.log_mod_actions) {
            const logChannel = interaction.guild.channels.cache.get(settings.log_channel_id);
            if (logChannel) {
                logChannel.send({ embeds: [modEmbed('Timeout', target.user, interaction.user, reason, { duration: formatDuration(duration) })] }).catch(() => {});
            }
        }

        return interaction.reply({ embeds: [successEmbed('User Timed Out', `**${target.user.tag}** has been timed out for **${formatDuration(duration)}**.\n**Reason:** ${reason}`)] });
    },
};
