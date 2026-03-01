const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel (allow members to send messages)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel to unlock (defaults to current)')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageChannels],

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        await channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: null,
        });

        await channel.send({ embeds: [successEmbed('\uD83D\uDD13 Channel Unlocked', `This channel has been unlocked by ${interaction.user}.`)] });

        if (channel.id !== interaction.channel.id) {
            return interaction.reply({ embeds: [successEmbed('Channel Unlocked', `${channel} has been unlocked.`)] });
        }

        return interaction.reply({ content: 'Channel unlocked.', ephemeral: true });
    },
};
