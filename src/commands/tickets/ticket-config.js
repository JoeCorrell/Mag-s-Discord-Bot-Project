const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Configure and manage the ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Create a ticket panel in a channel')
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('Channel for the ticket panel').setRequired(true).addChannelTypes(ChannelType.GuildText))
                .addStringOption(opt => opt.setName('title').setDescription('Panel title'))
                .addStringOption(opt => opt.setName('description').setDescription('Panel description')))
        .addSubcommand(sub =>
            sub.setName('category')
                .setDescription('Set the category for new ticket channels')
                .addChannelOption(opt =>
                    opt.setName('category').setDescription('The category').setRequired(true).addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(sub =>
            sub.setName('support-role')
                .setDescription('Set the support team role')
                .addRoleOption(opt => opt.setName('role').setDescription('The support role').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('log-channel')
                .setDescription('Set the ticket log channel')
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('The log channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub =>
            sub.setName('close')
                .setDescription('Close the current ticket'))
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a user to the current ticket')
                .addUserOption(opt => opt.setName('user').setDescription('The user to add').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a user from the current ticket')
                .addUserOption(opt => opt.setName('user').setDescription('The user to remove').setRequired(true))),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'setup') {
            const channel = interaction.options.getChannel('channel');
            const title = interaction.options.getString('title') || '\uD83C\uDFAB Support Tickets';
            const description = interaction.options.getString('description') || 'Click the button below to create a support ticket.\nOur team will respond as soon as possible.';

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(title)
                .setDescription(description)
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket-create')
                    .setLabel('Create Ticket')
                    .setEmoji('\uD83C\uDFAB')
                    .setStyle(ButtonStyle.Primary),
            );

            const msg = await channel.send({ embeds: [embed], components: [row] });
            client.db.tickets.createPanel(interaction.guild.id, channel.id, msg.id, title, description, ['general']);

            return interaction.reply({ embeds: [successEmbed('Ticket Panel Created', `Panel created in ${channel}.`)] });
        }

        if (sub === 'category') {
            const category = interaction.options.getChannel('category');
            client.db.settings.updateSetting(interaction.guild.id, 'ticket_category_id', category.id);
            return interaction.reply({ embeds: [successEmbed('Ticket Category Set', `Tickets will be created under **${category.name}**.`)] });
        }

        if (sub === 'support-role') {
            const role = interaction.options.getRole('role');
            client.db.settings.updateSetting(interaction.guild.id, 'ticket_support_role_id', role.id);
            return interaction.reply({ embeds: [successEmbed('Support Role Set', `${role} will be pinged in new tickets.`)] });
        }

        if (sub === 'log-channel') {
            const channel = interaction.options.getChannel('channel');
            client.db.settings.updateSetting(interaction.guild.id, 'ticket_log_channel_id', channel.id);
            return interaction.reply({ embeds: [successEmbed('Ticket Log Channel Set', `Ticket logs will be sent to ${channel}.`)] });
        }

        if (sub === 'close') {
            const ticket = client.db.tickets.getByChannel(interaction.channel.id);
            if (!ticket) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'This is not a ticket channel.')], ephemeral: true });
            }

            client.db.tickets.close(interaction.channel.id);

            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('Ticket Closed')
                .setDescription(`Ticket closed by ${interaction.user}.\nThis channel will be deleted in 5 seconds.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }

        if (sub === 'add') {
            const ticket = client.db.tickets.getByChannel(interaction.channel.id);
            if (!ticket) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'This is not a ticket channel.')], ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            });

            return interaction.reply({ embeds: [successEmbed('User Added', `${user} has been added to this ticket.`)] });
        }

        if (sub === 'remove') {
            const ticket = client.db.tickets.getByChannel(interaction.channel.id);
            if (!ticket) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'This is not a ticket channel.')], ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            await interaction.channel.permissionOverwrites.delete(user.id);

            return interaction.reply({ embeds: [successEmbed('User Removed', `${user} has been removed from this ticket.`)] });
        }
    },
};
