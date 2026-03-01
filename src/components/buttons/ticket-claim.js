const { EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    customId: 'ticket-claim',

    async execute(interaction, client) {
        const ticket = client.db.tickets.getByChannel(interaction.channel.id);

        if (!ticket) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'This is not a ticket channel.')], ephemeral: true });
        }

        if (ticket.claimed_by) {
            return interaction.reply({ embeds: [errorEmbed('Already Claimed', `This ticket is already claimed by <@${ticket.claimed_by}>.`)], ephemeral: true });
        }

        client.db.tickets.claim(interaction.channel.id, interaction.user.id);

        return interaction.reply({
            embeds: [successEmbed('Ticket Claimed', `${interaction.user} has claimed this ticket and will be assisting you.`)],
        });
    },
};
