const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward')
        .setDMPermission(false),
    cooldown: 5,

    async execute(interaction, client) {
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);

        if (account.last_daily) {
            const lastDaily = new Date(account.last_daily + 'Z').getTime();
            const cooldown = 24 * 60 * 60 * 1000;
            const remaining = cooldown - (Date.now() - lastDaily);

            if (remaining > 0) {
                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor((remaining % 3600000) / 60000);
                return interaction.reply({
                    embeds: [errorEmbed('Daily Already Claimed', `Come back in **${hours}h ${minutes}m**.`)],
                    ephemeral: true,
                });
            }
        }

        const amount = settings.economy_daily_amount;
        client.db.economy.addToWallet(interaction.guild.id, interaction.user.id, amount);
        client.db.economy.setLastDaily(interaction.guild.id, interaction.user.id);

        return interaction.reply({
            embeds: [successEmbed('Daily Reward', `You claimed your daily reward of **${amount.toLocaleString()} ${settings.economy_currency_name}**! ${settings.economy_currency_emoji}`)],
        });
    },
};
