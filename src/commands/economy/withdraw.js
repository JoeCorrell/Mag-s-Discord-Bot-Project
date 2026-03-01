const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw money from your bank')
        .setDMPermission(false)
        .addStringOption(opt =>
            opt.setName('amount').setDescription('Amount to withdraw (or "all")').setRequired(true)),
    cooldown: 3,

    async execute(interaction, client) {
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);
        const input = interaction.options.getString('amount');

        let amount;
        if (input.toLowerCase() === 'all') {
            amount = account.bank;
        } else {
            amount = parseInt(input);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Please enter a valid amount.')], ephemeral: true });
            }
        }

        const withdrawn = client.db.economy.withdraw(interaction.guild.id, interaction.user.id, amount);

        if (withdrawn === 0) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'Your bank is empty!')], ephemeral: true });
        }

        return interaction.reply({
            embeds: [successEmbed('Withdraw', `Withdrew **${withdrawn.toLocaleString()} ${settings.economy_currency_name}** from your bank.`)],
        });
    },
};
