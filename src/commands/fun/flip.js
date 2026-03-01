const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('Flip a coin'),
    cooldown: 2,

    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '\uD83E\uDE99' : '\uD83D\uDCB0';

        const embed = customEmbed()
            .setTitle(`${emoji} Coin Flip`)
            .setDescription(`The coin landed on **${result}**!`);

        return interaction.reply({ embeds: [embed] });
    },
};
