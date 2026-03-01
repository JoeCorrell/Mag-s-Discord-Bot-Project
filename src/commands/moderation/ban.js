const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for banning'))
        .addIntegerOption(opt => opt.setName('days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7)),
    cooldown: 5,
    permissions: [PermissionFlagsBits.BanMembers],

    async execute(interaction, client) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;
        const target = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (user.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You cannot ban yourself.')], ephemeral: true });
        }

        if (target) {
            if (!target.bannable) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'I cannot ban this user. They may have a higher role than me.')], ephemeral: true });
            }

            if (interaction.member.roles.highest.position <= target.roles.highest.position) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'You cannot ban someone with an equal or higher role.')], ephemeral: true });
            }

            await target.send({ embeds: [modEmbed('Banned', user, interaction.user, reason).setDescription(`You have been banned from **${interaction.guild.name}**`)] }).catch(() => {});
        }

        await interaction.guild.members.ban(user.id, { reason, deleteMessageSeconds: days * 86400 });

        client.db.modLogs.add(interaction.guild.id, user.id, interaction.user.id, 'ban', reason);

        const settings = client.db.settings.getSettings(interaction.guild.id);
        if (settings.mod_logging && settings.log_channel_id && settings.log_mod_actions) {
            const logChannel = interaction.guild.channels.cache.get(settings.log_channel_id);
            if (logChannel) {
                logChannel.send({ embeds: [modEmbed('Ban', user, interaction.user, reason)] }).catch(() => {});
            }
        }

        return interaction.reply({ embeds: [successEmbed('User Banned', `**${user.tag}** has been banned.\n**Reason:** ${reason}`)] });
    },
};
