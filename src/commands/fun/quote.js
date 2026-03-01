const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

const quotes = [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
    { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
    { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
    { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
    { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
    { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein' },
    { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
    { text: 'Your time is limited, don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
    { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
    { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Get an inspirational quote'),
    cooldown: 3,

    async execute(interaction) {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        const embed = customEmbed()
            .setTitle('\uD83D\uDCDC Quote')
            .setDescription(`*"${quote.text}"*\n\n\u2014 **${quote.author}**`);

        return interaction.reply({ embeds: [embed] });
    },
};
