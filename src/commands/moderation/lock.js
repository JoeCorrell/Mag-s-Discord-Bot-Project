const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel (prevent members from sending messages)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel to lock (defaults to current)'))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for locking')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageChannels],

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        await channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: false,
        }, { reason });

        await channel.send({ embeds: [errorEmbed('\uD83D\uDD12 Channel Locked', `This channel has been locked by ${interaction.user}.\n**Reason:** ${reason}`)] });

        if (channel.id !== interaction.channel.id) {
            return interaction.reply({ embeds: [successEmbed('Channel Locked', `${channel} has been locked.`)] });
        }

        return interaction.reply({ content: 'Channel locked.', ephemeral: true });
    },
};
