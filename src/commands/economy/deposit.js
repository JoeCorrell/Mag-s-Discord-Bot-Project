const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription('Deposit money into your bank')
        .setDMPermission(false)
        .addStringOption(opt =>
            opt.setName('amount').setDescription('Amount to deposit (or "all")').setRequired(true)),
    cooldown: 3,

    async execute(interaction, client) {
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);
        const input = interaction.options.getString('amount');

        let amount;
        if (input.toLowerCase() === 'all') {
            amount = account.wallet;
        } else {
            amount = parseInt(input);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Please enter a valid amount.')], ephemeral: true });
            }
        }

        if (amount > account.wallet) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You don\'t have enough in your wallet.')], ephemeral: true });
        }

        const deposited = client.db.economy.deposit(interaction.guild.id, interaction.user.id, amount);

        if (deposited === 0) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'Your bank is full!')], ephemeral: true });
        }

        return interaction.reply({
            embeds: [successEmbed('Deposit', `Deposited **${deposited.toLocaleString()} ${settings.economy_currency_name}** into your bank.`)],
        });
    },
};
