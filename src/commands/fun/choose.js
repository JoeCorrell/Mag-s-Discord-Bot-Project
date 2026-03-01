const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Choose between multiple options')
        .addStringOption(opt => opt.setName('options').setDescription('Options separated by | (e.g., pizza | burger | tacos)').setRequired(true)),
    cooldown: 2,

    async execute(interaction) {
        const input = interaction.options.getString('options');
        const options = input.split('|').map(o => o.trim()).filter(o => o.length > 0);

        if (options.length < 2) {
            return interaction.reply({ content: 'Please provide at least 2 options separated by `|`.', ephemeral: true });
        }

        const choice = options[Math.floor(Math.random() * options.length)];

        const embed = customEmbed()
            .setTitle('\uD83E\uDD14 I Choose...')
            .setDescription(`Out of ${options.map(o => `\`${o}\``).join(', ')}...\n\nI choose **${choice}**!`);

        return interaction.reply({ embeds: [embed] });
    },
};
