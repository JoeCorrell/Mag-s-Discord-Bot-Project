const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

const TICKET_TYPES = {
    support: { label: 'Support', prefix: 'support', color: 0x5865F2, description: 'Please describe what you need help with.' },
    bug: { label: 'Bug Report', prefix: 'bug', color: 0xED4245, description: 'Please describe the bug in detail.\nInclude steps to reproduce if possible.' },
    suggestion: { label: 'Suggestion', prefix: 'suggestion', color: 0x57F287, description: 'Share your idea or suggestion with us!' },
    modidea: { label: 'Mod Idea', prefix: 'mod-idea', color: 0x9B59B6, description: 'Suggest a mod you\'d like to see added to the server!' },
};

module.exports = {
    customId: 'ticket-type',

    async execute(interaction, client) {
        const type = interaction.values[0];
        const ticketType = TICKET_TYPES[type];
        if (!ticketType) return;

        const settings = client.db.settings.getSettings(interaction.guild.id);
        const openTickets = client.db.tickets.getOpenByUser(interaction.guild.id, interaction.user.id);

        if (openTickets.length >= config.limits.ticketsPerUser) {
            return interaction.reply({
                embeds: [errorEmbed('Limit Reached', `You can only have ${config.limits.ticketsPerUser} open ticket(s) at a time.`)],
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const ticketNumber = client.db.tickets.getNextNumber(interaction.guild.id);

        const channelOptions = {
            name: `${ticketType.prefix}-${ticketNumber}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
            ],
        };

        if (settings.ticket_category_id) {
            channelOptions.parent = settings.ticket_category_id;
        }

        if (settings.ticket_support_role_id) {
            channelOptions.permissionOverwrites.push({
                id: settings.ticket_support_role_id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            });
        }

        const channel = await interaction.guild.channels.create(channelOptions);

        client.db.tickets.create(interaction.guild.id, channel.id, interaction.user.id, ticketNumber, type);

        const embed = new EmbedBuilder()
            .setColor(ticketType.color)
            .setTitle(`${ticketType.label} #${ticketNumber}`)
            .setDescription(`Welcome ${interaction.user}!\n${ticketType.description}`)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket-close').setLabel('Close Ticket').setEmoji('\uD83D\uDD12').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket-claim').setLabel('Claim Ticket').setEmoji('\u2705').setStyle(ButtonStyle.Success),
        );

        const supportPing = settings.ticket_support_role_id ? `<@&${settings.ticket_support_role_id}>` : '';
        await channel.send({ content: `${interaction.user} ${supportPing}`, embeds: [embed], components: [row] });

        await interaction.editReply({ content: `Your ${ticketType.label.toLowerCase()} ticket has been created: ${channel}` });
    },
};
