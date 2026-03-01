const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll dice')
        .addIntegerOption(opt => opt.setName('sides').setDescription('Number of sides (default 6)').setMinValue(2).setMaxValue(100))
        .addIntegerOption(opt => opt.setName('count').setDescription('Number of dice (default 1)').setMinValue(1).setMaxValue(20)),
    cooldown: 2,

    async execute(interaction) {
        const sides = interaction.options.getInteger('sides') || 6;
        const count = interaction.options.getInteger('count') || 1;

        const rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * sides) + 1);
        }

        const total = rolls.reduce((a, b) => a + b, 0);

        const embed = customEmbed()
            .setTitle('\uD83C\uDFB2 Dice Roll')
            .setDescription(`Rolling **${count}d${sides}**\n\nResults: ${rolls.map(r => `\`${r}\``).join(' + ')}${count > 1 ? `\n**Total: ${total}**` : ''}`);

        return interaction.reply({ embeds: [embed] });
    },
};
