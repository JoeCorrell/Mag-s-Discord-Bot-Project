const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'channelDelete',
    once: false,
    async execute(channel, client) {
        if (!channel.guild) return;

        const settings = client.db.settings.getSettings(channel.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_channel_changes) return;

        const logChannel = channel.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        const embed = customEmbed(0xED4245)
            .setTitle('Channel Deleted')
            .addFields(
                { name: 'Channel', value: channel.name, inline: true },
                { name: 'Type', value: channel.type.toString(), inline: true },
            )
            .setFooter({ text: `ID: ${channel.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
