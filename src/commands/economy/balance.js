const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your or someone else\'s balance')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to check')),
    cooldown: 3,

    async execute(interaction, client) {
        const user = interaction.options.getUser('user') || interaction.user;
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const account = client.db.economy.getAccount(interaction.guild.id, user.id);
        const currency = settings.economy_currency_name;
        const emoji = settings.economy_currency_emoji;

        const embed = customEmbed()
            .setTitle(`${emoji} ${user.tag}'s Balance`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Wallet', value: `${account.wallet.toLocaleString()} ${currency}`, inline: true },
                { name: 'Bank', value: `${account.bank.toLocaleString()} / ${account.bank_capacity.toLocaleString()} ${currency}`, inline: true },
                { name: 'Net Worth', value: `${(account.wallet + account.bank).toLocaleString()} ${currency}`, inline: true },
            );

        return interaction.reply({ embeds: [embed] });
    },
};
