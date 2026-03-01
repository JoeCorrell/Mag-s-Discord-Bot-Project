const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a custom embed message')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addStringOption(opt => opt.setName('title').setDescription('Embed title'))
        .addStringOption(opt => opt.setName('description').setDescription('Embed description'))
        .addStringOption(opt => opt.setName('color').setDescription('Hex color (e.g., #FF0000)'))
        .addStringOption(opt => opt.setName('footer').setDescription('Footer text'))
        .addStringOption(opt => opt.setName('image').setDescription('Image URL'))
        .addStringOption(opt => opt.setName('thumbnail').setDescription('Thumbnail URL'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send to').addChannelTypes(ChannelType.GuildText)),
    cooldown: 10,
    permissions: [PermissionFlagsBits.ManageMessages],

    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');
        const footer = interaction.options.getString('footer');
        const image = interaction.options.getString('image');
        const thumbnail = interaction.options.getString('thumbnail');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        if (!title && !description) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You must provide at least a title or description.')], ephemeral: true });
        }

        const embed = new EmbedBuilder().setTimestamp();

        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter({ text: footer });
        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);

        if (color) {
            const hex = color.replace('#', '');
            embed.setColor(parseInt(hex, 16));
        } else {
            embed.setColor(0x5865F2);
        }

        await channel.send({ embeds: [embed] });

        if (channel.id !== interaction.channel.id) {
            return interaction.reply({ embeds: [successEmbed('Embed Sent', `Embed sent to ${channel}.`)], ephemeral: true });
        }

        return interaction.reply({ content: 'Embed sent!', ephemeral: true });
    },
};
