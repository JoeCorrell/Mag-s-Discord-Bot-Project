const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Ship two users together')
        .addUserOption(opt => opt.setName('user1').setDescription('First user').setRequired(true))
        .addUserOption(opt => opt.setName('user2').setDescription('Second user').setRequired(true)),
    cooldown: 3,

    async execute(interaction) {
        const user1 = interaction.options.getUser('user1');
        const user2 = interaction.options.getUser('user2');

        // Generate deterministic percentage based on user IDs
        const combined = BigInt(user1.id) + BigInt(user2.id);
        const percentage = Number(combined % 101n);

        let comment;
        if (percentage >= 90) comment = 'Soulmates! \uD83D\uDC98';
        else if (percentage >= 70) comment = 'Great match! \uD83D\uDE0D';
        else if (percentage >= 50) comment = 'Could work! \uD83D\uDE0A';
        else if (percentage >= 30) comment = 'Maybe... \uD83E\uDD14';
        else if (percentage >= 10) comment = 'Probably not. \uD83D\uDE15';
        else comment = 'Not happening. \uD83D\uDC94';

        const barLength = 20;
        const filled = Math.floor((percentage / 100) * barLength);
        const bar = '\u2764\uFE0F'.repeat(Math.ceil(filled / 2)) + '\uD83D\uDDA4'.repeat(Math.ceil((barLength - filled) / 2));

        const embed = customEmbed(percentage >= 50 ? 0xFF69B4 : 0x808080)
            .setTitle('\uD83D\uDC98 Ship')
            .setDescription(`**${user1.username}** x **${user2.username}**\n\n${bar}\n\n**${percentage}%** - ${comment}`);

        return interaction.reply({ embeds: [embed] });
    },
};
