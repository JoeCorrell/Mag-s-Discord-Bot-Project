const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .setDMPermission(false)
        .addStringOption(opt => opt.setName('question').setDescription('The poll question').setRequired(true))
        .addStringOption(opt => opt.setName('options').setDescription('Options separated by | (leave empty for yes/no)')),
    cooldown: 10,

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const optionsStr = interaction.options.getString('options');

        if (!optionsStr) {
            const embed = customEmbed()
                .setTitle('\uD83D\uDCCA Poll')
                .setDescription(`**${question}**\n\n\uD83D\uDC4D Yes | \uD83D\uDC4E No`)
                .setFooter({ text: `Poll by ${interaction.user.tag}` });

            const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
            await msg.react('\uD83D\uDC4D');
            await msg.react('\uD83D\uDC4E');
            return;
        }

        const options = optionsStr.split('|').map(o => o.trim()).filter(o => o.length > 0);
        if (options.length < 2 || options.length > 10) {
            return interaction.reply({ content: 'Please provide 2-10 options separated by `|`.', ephemeral: true });
        }

        const numberEmojis = ['1\uFE0F\u20E3', '2\uFE0F\u20E3', '3\uFE0F\u20E3', '4\uFE0F\u20E3', '5\uFE0F\u20E3', '6\uFE0F\u20E3', '7\uFE0F\u20E3', '8\uFE0F\u20E3', '9\uFE0F\u20E3', '\uD83D\uDD1F'];

        const optionsList = options.map((o, i) => `${numberEmojis[i]} ${o}`).join('\n');

        const embed = customEmbed()
            .setTitle('\uD83D\uDCCA Poll')
            .setDescription(`**${question}**\n\n${optionsList}`)
            .setFooter({ text: `Poll by ${interaction.user.tag}` });

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

        for (let i = 0; i < options.length; i++) {
            await msg.react(numberEmojis[i]);
        }
    },
};
