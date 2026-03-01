const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your or someone else\'s inventory')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to check')),
    cooldown: 3,

    async execute(interaction, client) {
        const user = interaction.options.getUser('user') || interaction.user;
        const items = client.db.shop.getInventory(interaction.guild.id, user.id);

        if (items.length === 0) {
            return interaction.reply({
                embeds: [customEmbed().setTitle(`\uD83C\uDF92 ${user.tag}'s Inventory`).setDescription('Empty! Buy items from `/shop view`.')],
            });
        }

        const list = items.map(item =>
            `${item.emoji} **${item.name}** x${item.quantity}`
        ).join('\n');

        const embed = customEmbed()
            .setTitle(`\uD83C\uDF92 ${user.tag}'s Inventory`)
            .setDescription(list)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }));

        return interaction.reply({ embeds: [embed] });
    },
};
