module.exports = {
    customId: 'giveaway-enter',

    async execute(interaction, client) {
        const giveaway = client.db.giveaways.getByMessage(interaction.message.id);

        if (!giveaway) {
            return interaction.reply({ content: 'This giveaway no longer exists.', ephemeral: true });
        }

        if (giveaway.ended) {
            return interaction.reply({ content: 'This giveaway has already ended.', ephemeral: true });
        }

        const entries = JSON.parse(giveaway.entries);

        if (entries.includes(interaction.user.id)) {
            // Remove entry
            client.db.giveaways.removeEntry(giveaway.id, interaction.user.id);
            return interaction.reply({ content: 'You have left the giveaway.', ephemeral: true });
        }

        // Add entry
        client.db.giveaways.addEntry(giveaway.id, interaction.user.id);

        const newEntries = JSON.parse(client.db.giveaways.getById(giveaway.id).entries);
        return interaction.reply({ content: `You have entered the giveaway! (${newEntries.length} total entries)`, ephemeral: true });
    },
};
