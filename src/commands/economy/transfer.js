const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transfer')
        .setDescription('Transfer money to another user')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to send money to').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to send').setRequired(true).setMinValue(1)),
    cooldown: 5,

    async execute(interaction, client) {
        const target = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const settings = client.db.settings.getSettings(interaction.guild.id);

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You can\'t transfer money to yourself.')], ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You can\'t transfer money to a bot.')], ephemeral: true });
        }

        const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);

        if (account.wallet < amount) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You don\'t have enough in your wallet.')], ephemeral: true });
        }

        client.db.economy.transfer(interaction.guild.id, interaction.user.id, target.id, amount);

        return interaction.reply({
            embeds: [successEmbed('Transfer Complete', `You sent **${amount.toLocaleString()} ${settings.economy_currency_name}** to ${target}.`)],
        });
    },
};
