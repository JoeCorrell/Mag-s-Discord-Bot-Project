const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for kicking')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.KickMembers],

    async execute(interaction, client) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'User not found in this server.')], ephemeral: true });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You cannot kick yourself.')], ephemeral: true });
        }

        if (!target.kickable) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'I cannot kick this user. They may have a higher role than me.')], ephemeral: true });
        }

        if (interaction.member.roles.highest.position <= target.roles.highest.position) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You cannot kick someone with an equal or higher role.')], ephemeral: true });
        }

        await target.send({ embeds: [modEmbed('Kicked', target.user, interaction.user, reason).setDescription(`You have been kicked from **${interaction.guild.name}**`)] }).catch(() => {});

        await target.kick(reason);

        client.db.modLogs.add(interaction.guild.id, target.id, interaction.user.id, 'kick', reason);

        const settings = client.db.settings.getSettings(interaction.guild.id);
        if (settings.mod_logging && settings.log_channel_id && settings.log_mod_actions) {
            const logChannel = interaction.guild.channels.cache.get(settings.log_channel_id);
            if (logChannel) {
                logChannel.send({ embeds: [modEmbed('Kick', target.user, interaction.user, reason)] }).catch(() => {});
            }
        }

        return interaction.reply({ embeds: [successEmbed('User Kicked', `**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`)] });
    },
};
