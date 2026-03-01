const { SlashCommandBuilder } = require('discord.js');
const { customEmbed, errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Play the slot machine')
        .setDMPermission(false)
        .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(1)),
    cooldown: 5,

    async execute(interaction, client) {
        const bet = interaction.options.getInteger('bet');
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const currency = settings.economy_currency_name;

        const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);

        if (account.wallet < bet) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You don\'t have enough in your wallet.')], ephemeral: true });
        }

        const emojis = config.economy.slotsEmojis;
        const slots = [
            emojis[Math.floor(Math.random() * emojis.length)],
            emojis[Math.floor(Math.random() * emojis.length)],
            emojis[Math.floor(Math.random() * emojis.length)],
        ];

        let multiplier = 0;
        if (slots[0] === slots[1] && slots[1] === slots[2]) {
            multiplier = 5; // Triple match
        } else if (slots[0] === slots[1] || slots[1] === slots[2] || slots[0] === slots[2]) {
            multiplier = 2; // Double match
        }

        const winnings = bet * multiplier;
        const net = winnings - bet;
        client.db.economy.addToWallet(interaction.guild.id, interaction.user.id, net);

        const display = `> \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n> | ${slots.join(' | ')} |\n> \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`;

        const embed = customEmbed(multiplier > 0 ? 0x57F287 : 0xED4245)
            .setTitle('\uD83C\uDFB0 Slot Machine')
            .setDescription(`${display}\n\n${multiplier > 0
                ? `\uD83C\uDF89 **You won ${winnings.toLocaleString()} ${currency}!** (${multiplier}x)`
                : `You lost **${bet.toLocaleString()} ${currency}**. Better luck next time!`
            }`);

        return interaction.reply({ embeds: [embed] });
    },
};
