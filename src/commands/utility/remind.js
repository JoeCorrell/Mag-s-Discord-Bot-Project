const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { parseDuration, formatDuration } = require('../../utils/time');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Create a new reminder')
                .addStringOption(opt => opt.setName('time').setDescription('When to remind you (e.g., 10m, 1h, 2d)').setRequired(true))
                .addStringOption(opt => opt.setName('message').setDescription('What to remind you about').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('View your active reminders')),
    cooldown: 5,

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'set') {
            const timeStr = interaction.options.getString('time');
            const message = interaction.options.getString('message');
            const duration = parseDuration(timeStr);

            if (!duration || duration < 60000) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Please provide a valid duration (minimum 1 minute).')], ephemeral: true });
            }

            if (duration > config.limits.reminderMaxDuration) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Reminder duration cannot exceed 30 days.')], ephemeral: true });
            }

            const remindAt = new Date(Date.now() + duration).toISOString().replace('T', ' ').substring(0, 19);

            client.db.reminders.create(
                interaction.guild.id,
                interaction.channel.id,
                interaction.user.id,
                message,
                remindAt,
            );

            return interaction.reply({
                embeds: [successEmbed('Reminder Set', `I'll remind you in **${formatDuration(duration)}**.\n**Message:** ${message}`)],
            });
        }

        if (sub === 'list') {
            const reminders = client.db.reminders.getByUser(interaction.guild.id, interaction.user.id);

            if (reminders.length === 0) {
                return interaction.reply({ embeds: [infoEmbed('No Reminders', 'You have no active reminders.')], ephemeral: true });
            }

            const list = reminders.map((r, i) => {
                const time = Math.floor(new Date(r.remind_at + 'Z').getTime() / 1000);
                return `**${i + 1}.** ${r.message}\n  Fires <t:${time}:R>`;
            }).join('\n\n');

            return interaction.reply({
                embeds: [infoEmbed('Your Reminders', list)],
                ephemeral: true,
            });
        }
    },
};
