const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const { evaluate } = require('mathjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculate')
        .setDescription('Evaluate a math expression')
        .addStringOption(opt =>
            opt.setName('expression')
                .setDescription('The math expression to evaluate (e.g., 2 + 2, sqrt(16))')
                .setRequired(true)),
    cooldown: 3,

    async execute(interaction) {
        const expression = interaction.options.getString('expression');

        try {
            const result = evaluate(expression);
            return interaction.reply({
                embeds: [successEmbed('Calculator', `**Expression:** \`${expression}\`\n**Result:** \`${result}\``)],
            });
        } catch (error) {
            return interaction.reply({
                embeds: [errorEmbed('Calculator Error', `Could not evaluate: \`${expression}\`\n${error.message}`)],
                ephemeral: true,
            });
        }
    },
};
