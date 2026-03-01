const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed, modEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a warning to a user')
                .addUserOption(opt => opt.setName('user').setDescription('The user to warn').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning')))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List warnings for a user')
                .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a specific warning')
                .addIntegerOption(opt => opt.setName('id').setDescription('Warning ID to remove').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Clear all warnings for a user')
                .addUserOption(opt => opt.setName('user').setDescription('The user to clear warnings for').setRequired(true))),
    cooldown: 3,
    permissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'add') {
            const target = interaction.options.getMember('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (!target) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'User not found.')], ephemeral: true });
            }

            if (target.id === interaction.user.id) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'You cannot warn yourself.')], ephemeral: true });
            }

            client.db.warnings.add(interaction.guild.id, target.id, interaction.user.id, reason);
            client.db.modLogs.add(interaction.guild.id, target.id, interaction.user.id, 'warn', reason);

            const count = client.db.warnings.count(interaction.guild.id, target.id);

            await target.send({ embeds: [modEmbed('Warning', target.user, interaction.user, reason).setDescription(`You have been warned in **${interaction.guild.name}**\nYou now have **${count}** warning(s).`)] }).catch(() => {});

            const settings = client.db.settings.getSettings(interaction.guild.id);
            if (settings.mod_logging && settings.log_channel_id && settings.log_mod_actions) {
                const logChannel = interaction.guild.channels.cache.get(settings.log_channel_id);
                if (logChannel) {
                    logChannel.send({ embeds: [modEmbed('Warning', target.user, interaction.user, reason)] }).catch(() => {});
                }
            }

            let extra = '';
            if (count >= 7 && target.bannable) {
                await target.send({ embeds: [modEmbed('Banned', target.user, interaction.user, `Reached ${count} warnings`).setDescription(`You have been **banned** from **${interaction.guild.name}** for reaching **${count}** warnings.`)] }).catch(() => {});
                await target.ban({ reason: `Auto-ban: Reached ${count} warnings` });
                client.db.modLogs.add(interaction.guild.id, target.id, interaction.user.id, 'ban', `Auto-ban: Reached ${count} warnings`);
                extra = `\n\n\uD83D\uDD28 **Auto-banned** for reaching ${count} warnings.`;
            } else if (count >= 5 && target.kickable) {
                await target.send({ embeds: [modEmbed('Kicked', target.user, interaction.user, `Reached ${count} warnings`).setDescription(`You have been **kicked** from **${interaction.guild.name}** for reaching **${count}** warnings.`)] }).catch(() => {});
                await target.kick(`Auto-kick: Reached ${count} warnings`);
                client.db.modLogs.add(interaction.guild.id, target.id, interaction.user.id, 'kick', `Auto-kick: Reached ${count} warnings`);
                extra = `\n\n\uD83D\uDC62 **Auto-kicked** for reaching ${count} warnings.`;
            } else if (count >= 3 && target.moderatable) {
                await target.timeout(60 * 60 * 1000, `Reached ${count} warnings`);
                extra = `\n\n\u26A0\uFE0F **Auto-timed out** for 1 hour (${count} warnings).`;
            }

            return interaction.reply({ embeds: [successEmbed('User Warned', `**${target.user.tag}** has been warned. They now have **${count}** warning(s).\n**Reason:** ${reason}${extra}`)] });
        }

        if (sub === 'list') {
            const user = interaction.options.getUser('user');
            const warnings = client.db.warnings.getByUser(interaction.guild.id, user.id);

            if (warnings.length === 0) {
                return interaction.reply({ embeds: [infoEmbed('No Warnings', `**${user.tag}** has no warnings.`)] });
            }

            const list = warnings.map((w, i) => `**#${w.id}** - ${w.reason}\n  By <@${w.moderator_id}> \u2022 <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>`).join('\n\n');

            return interaction.reply({ embeds: [infoEmbed(`Warnings for ${user.tag}`, `**Total: ${warnings.length}**\n\n${list}`)] });
        }

        if (sub === 'remove') {
            const id = interaction.options.getInteger('id');
            const warning = client.db.warnings.getById(id, interaction.guild.id);

            if (!warning) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Warning not found.')], ephemeral: true });
            }

            client.db.warnings.delete(id, interaction.guild.id);
            return interaction.reply({ embeds: [successEmbed('Warning Removed', `Warning **#${id}** has been removed.`)] });
        }

        if (sub === 'clear') {
            const user = interaction.options.getUser('user');
            const count = client.db.warnings.count(interaction.guild.id, user.id);

            if (count === 0) {
                return interaction.reply({ embeds: [infoEmbed('No Warnings', `**${user.tag}** has no warnings to clear.`)] });
            }

            client.db.warnings.clearUser(interaction.guild.id, user.id);
            return interaction.reply({ embeds: [successEmbed('Warnings Cleared', `Cleared **${count}** warning(s) for **${user.tag}**.`)] });
        }
    },
};
