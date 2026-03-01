const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rate something out of 10')
        .addStringOption(opt => opt.setName('thing').setDescription('What to rate').setRequired(true)),
    cooldown: 3,

    async execute(interaction) {
        const thing = interaction.options.getString('thing');
        const rating = Math.floor(Math.random() * 11);
        const stars = '\u2B50'.repeat(Math.ceil(rating / 2)) + '\u2606'.repeat(5 - Math.ceil(rating / 2));

        const embed = customEmbed()
            .setTitle('\uD83D\uDCCA Rating')
            .setDescription(`I'd rate **${thing}** a **${rating}/10**!\n${stars}`);

        return interaction.reply({ embeds: [embed] });
    },
};
