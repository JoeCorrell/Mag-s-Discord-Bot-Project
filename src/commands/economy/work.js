const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work to earn some money')
        .setDMPermission(false),
    cooldown: 5,

    async execute(interaction, client) {
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);

        if (account.last_work) {
            const lastWork = new Date(account.last_work + 'Z').getTime();
            const cooldown = 30 * 60 * 1000; // 30 minutes
            const remaining = cooldown - (Date.now() - lastWork);

            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                return interaction.reply({
                    embeds: [errorEmbed('Too Tired', `You can work again in **${minutes}m ${seconds}s**.`)],
                    ephemeral: true,
                });
            }
        }

        const min = settings.economy_work_min;
        const max = settings.economy_work_max;
        const amount = Math.floor(Math.random() * (max - min + 1)) + min;

        client.db.economy.addToWallet(interaction.guild.id, interaction.user.id, amount);
        client.db.economy.setLastWork(interaction.guild.id, interaction.user.id);

        const responses = config.economy.workResponses;
        const response = responses[Math.floor(Math.random() * responses.length)]
            .replace('{amount}', amount.toLocaleString())
            .replace('{currency}', settings.economy_currency_name);

        return interaction.reply({ embeds: [successEmbed('Work Complete', response)] });
    },
};
