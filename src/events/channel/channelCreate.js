const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'channelCreate',
    once: false,
    async execute(channel, client) {
        if (!channel.guild) return;

        const settings = client.db.settings.getSettings(channel.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_channel_changes) return;

        const logChannel = channel.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        const embed = customEmbed(0x57F287)
            .setTitle('Channel Created')
            .addFields(
                { name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
                { name: 'Type', value: channel.type.toString(), inline: true },
            )
            .setFooter({ text: `ID: ${channel.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
