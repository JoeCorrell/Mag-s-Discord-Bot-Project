const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { customEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse and manage the server shop')
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('view').setDescription('View available items'))
        .addSubcommand(sub =>
            sub.setName('buy')
                .setDescription('Buy an item')
                .addStringOption(opt => opt.setName('item').setDescription('The item name').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add an item to the shop (Admin)')
                .addStringOption(opt => opt.setName('name').setDescription('Item name').setRequired(true))
                .addIntegerOption(opt => opt.setName('price').setDescription('Item price').setRequired(true).setMinValue(1))
                .addStringOption(opt => opt.setName('description').setDescription('Item description'))
                .addRoleOption(opt => opt.setName('role').setDescription('Role to give on purchase'))
                .addStringOption(opt => opt.setName('emoji').setDescription('Item emoji')))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove an item from the shop (Admin)')
                .addStringOption(opt => opt.setName('name').setDescription('Item name').setRequired(true))),
    cooldown: 3,

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const settings = client.db.settings.getSettings(interaction.guild.id);
        const currency = settings.economy_currency_name;

        if (sub === 'view') {
            const items = client.db.shop.getItems(interaction.guild.id);

            if (items.length === 0) {
                return interaction.reply({ embeds: [customEmbed().setTitle('\uD83D\uDED2 Shop').setDescription('The shop is empty! An admin can add items with `/shop add`.')] });
            }

            const list = items.map(item => {
                const role = item.role_id ? ` \u2192 <@&${item.role_id}>` : '';
                return `${item.emoji} **${item.name}** - ${item.price.toLocaleString()} ${currency}${role}\n> ${item.description || 'No description'}`;
            }).join('\n\n');

            const embed = customEmbed()
                .setTitle('\uD83D\uDED2 Shop')
                .setDescription(list);

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'buy') {
            const itemName = interaction.options.getString('item');
            const item = client.db.shop.getItemByName(interaction.guild.id, itemName);

            if (!item) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Item not found. Check `/shop view` for available items.')], ephemeral: true });
            }

            const account = client.db.economy.getAccount(interaction.guild.id, interaction.user.id);

            if (account.wallet < item.price) {
                return interaction.reply({ embeds: [errorEmbed('Error', `You need **${item.price.toLocaleString()} ${currency}** but only have **${account.wallet.toLocaleString()}**.`)], ephemeral: true });
            }

            client.db.economy.addToWallet(interaction.guild.id, interaction.user.id, -item.price);
            client.db.shop.addToInventory(interaction.guild.id, interaction.user.id, item.id);

            if (item.role_id && interaction.member) {
                const role = interaction.guild.roles.cache.get(item.role_id);
                if (role) {
                    await interaction.member.roles.add(role, 'Shop purchase').catch(() => {});
                }
            }

            return interaction.reply({
                embeds: [successEmbed('Purchase Complete', `You bought ${item.emoji} **${item.name}** for **${item.price.toLocaleString()} ${currency}**.`)],
            });
        }

        if (sub === 'add') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'You need `Manage Server` permission.')], ephemeral: true });
            }

            const name = interaction.options.getString('name');
            const price = interaction.options.getInteger('price');
            const description = interaction.options.getString('description');
            const role = interaction.options.getRole('role');
            const emoji = interaction.options.getString('emoji') || ':package:';

            const existing = client.db.shop.getItemByName(interaction.guild.id, name);
            if (existing) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'An item with that name already exists.')], ephemeral: true });
            }

            client.db.shop.addItem(interaction.guild.id, name, description, price, role?.id, emoji);
            return interaction.reply({ embeds: [successEmbed('Item Added', `${emoji} **${name}** has been added to the shop for **${price.toLocaleString()} ${currency}**.`)] });
        }

        if (sub === 'remove') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'You need `Manage Server` permission.')], ephemeral: true });
            }

            const name = interaction.options.getString('name');
            const item = client.db.shop.getItemByName(interaction.guild.id, name);

            if (!item) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Item not found.')], ephemeral: true });
            }

            client.db.shop.removeItem(item.id, interaction.guild.id);
            return interaction.reply({ embeds: [successEmbed('Item Removed', `**${name}** has been removed from the shop.`)] });
        }
    },
};
