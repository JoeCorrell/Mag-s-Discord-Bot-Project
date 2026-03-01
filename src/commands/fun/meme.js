const { SlashCommandBuilder } = require('discord.js');
const { customEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme from Reddit'),
    cooldown: 5,

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch('https://meme-api.com/gimme');
            const data = await response.json();

            if (!data || !data.url) {
                return interaction.editReply({ embeds: [errorEmbed('Error', 'Failed to fetch a meme. Try again!')] });
            }

            const embed = customEmbed()
                .setTitle(data.title || 'Meme')
                .setImage(data.url)
                .setFooter({ text: `\uD83D\uDC4D ${data.ups || 0} | r/${data.subreddit || 'memes'}` });

            return interaction.editReply({ embeds: [embed] });
        } catch {
            return interaction.editReply({ embeds: [errorEmbed('Error', 'Failed to fetch a meme. Try again!')] });
        }
    },
};
