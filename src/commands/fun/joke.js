const { SlashCommandBuilder } = require('discord.js');
const { customEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Get a random joke'),
    cooldown: 3,

    async execute(interaction) {
        try {
            const response = await fetch('https://official-joke-api.appspot.com/random_joke');
            const data = await response.json();

            const embed = customEmbed()
                .setTitle('\uD83D\uDE02 Joke')
                .setDescription(`${data.setup}\n\n||${data.punchline}||`);

            return interaction.reply({ embeds: [embed] });
        } catch {
            return interaction.reply({ embeds: [errorEmbed('Error', 'Failed to fetch a joke.')], ephemeral: true });
        }
    },
};
