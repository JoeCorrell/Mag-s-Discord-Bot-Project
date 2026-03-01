const { EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    customId: 'ticket-close',

    async execute(interaction, client) {
        const ticket = client.db.tickets.getByChannel(interaction.channel.id);

        if (!ticket) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'This is not a ticket channel.')], ephemeral: true });
        }

        client.db.tickets.close(interaction.channel.id);

        const settings = client.db.settings.getSettings(interaction.guild.id);

        // Log to ticket log channel
        if (settings.ticket_log_channel_id) {
            const logChannel = interaction.guild.channels.cache.get(settings.ticket_log_channel_id);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle(`Ticket #${ticket.ticket_number} Closed`)
                    .addFields(
                        { name: 'Opened By', value: `<@${ticket.user_id}>`, inline: true },
                        { name: 'Closed By', value: `${interaction.user}`, inline: true },
                        { name: 'Claimed By', value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : 'Unclaimed', inline: true },
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [embed] }).catch(() => {});
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('Ticket Closed')
            .setDescription(`Ticket closed by ${interaction.user}.\nThis channel will be deleted in 5 seconds.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    },
};
