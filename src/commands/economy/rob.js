const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rob')
        .setDescription('Attempt to rob another user')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to rob').setRequired(true)),
    cooldown: 5,

    async execute(interaction, client) {
        const target = interaction.options.getUser('user');
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const currency = settings.economy_currency_name;

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You can\'t rob yourself.')], ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You can\'t rob a bot.')], ephemeral: true });
        }

        const robberAccount = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);

        if (robberAccount.last_rob) {
            const lastRob = new Date(robberAccount.last_rob + 'Z').getTime();
            const cooldown = 60 * 60 * 1000; // 1 hour
            const remaining = cooldown - (Date.now() - lastRob);

            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                return interaction.reply({
                    embeds: [errorEmbed('Cooldown', `You can rob again in **${minutes}m**.`)],
                    ephemeral: true,
                });
            }
        }

        const targetAccount = client.db.economy.getAccount(interaction.guild.id, target.id);

        if (targetAccount.wallet < 100) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'That user doesn\'t have enough to rob.')], ephemeral: true });
        }

        client.db.economy.setLastRob(interaction.guild.id, interaction.user.id);

        const chance = settings.economy_rob_chance || 40;
        const success = Math.random() * 100 < chance;

        if (success) {
            const maxSteal = Math.floor(targetAccount.wallet * 0.5);
            const stolen = Math.floor(Math.random() * maxSteal) + 1;

            client.db.economy.transfer(interaction.guild.id, target.id, interaction.user.id, stolen);

            return interaction.reply({
                embeds: [successEmbed('Rob Successful!', `You stole **${stolen.toLocaleString()} ${currency}** from ${target}! \uD83D\uDCB0`)],
            });
        } else {
            const fine = settings.economy_rob_fine || 200;
            const actualFine = Math.min(fine, robberAccount.wallet);
            client.db.economy.addToWallet(interaction.guild.id, interaction.user.id, -actualFine);

            return interaction.reply({
                embeds: [errorEmbed('Rob Failed!', `You got caught and paid a fine of **${actualFine.toLocaleString()} ${currency}**. \uD83D\uDC6E`)],
            });
        }
    },
};
