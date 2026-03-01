const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin and bet on the outcome')
        .setDMPermission(false)
        .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(1))
        .addStringOption(opt =>
            opt.setName('choice')
                .setDescription('Heads or tails')
                .setRequired(true)
                .addChoices(
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' },
                )),
    cooldown: 5,

    async execute(interaction, client) {
        const bet = interaction.options.getInteger('bet');
        const choice = interaction.options.getString('choice');
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const currency = settings.economy_currency_name;

        const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);

        if (account.wallet < bet) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You don\'t have enough in your wallet.')], ephemeral: true });
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = choice === result;

        if (won) {
            client.db.economy.addToWallet(interaction.guild.id, interaction.user.id, bet);
            return interaction.reply({
                embeds: [successEmbed(`\uD83E\uDE99 Coinflip - ${result.toUpperCase()}!`, `You won **${bet.toLocaleString()} ${currency}**! \uD83C\uDF89`)],
            });
        } else {
            client.db.economy.addToWallet(interaction.guild.id, interaction.user.id, -bet);
            return interaction.reply({
                embeds: [errorEmbed(`\uD83E\uDE99 Coinflip - ${result.toUpperCase()}!`, `You lost **${bet.toLocaleString()} ${currency}**. Better luck next time!`)],
            });
        }
    },
};
