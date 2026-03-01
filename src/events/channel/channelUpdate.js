const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'channelUpdate',
    once: false,
    async execute(oldChannel, newChannel, client) {
        if (!newChannel.guild) return;

        const settings = client.db.settings.getSettings(newChannel.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_channel_changes) return;

        const logChannel = newChannel.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        const changes = [];
        if (oldChannel.name !== newChannel.name) {
            changes.push(`**Name:** ${oldChannel.name} \u2192 ${newChannel.name}`);
        }
        if (oldChannel.topic !== newChannel.topic) {
            changes.push(`**Topic:** ${oldChannel.topic || 'None'} \u2192 ${newChannel.topic || 'None'}`);
        }
        if (oldChannel.nsfw !== newChannel.nsfw) {
            changes.push(`**NSFW:** ${oldChannel.nsfw} \u2192 ${newChannel.nsfw}`);
        }
        if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
            changes.push(`**Slowmode:** ${oldChannel.rateLimitPerUser}s \u2192 ${newChannel.rateLimitPerUser}s`);
        }

        if (changes.length === 0) return;

        const embed = customEmbed(0xFEE75C)
            .setTitle('Channel Updated')
            .setDescription(`**Channel:** ${newChannel}\n\n${changes.join('\n')}`)
            .setFooter({ text: `ID: ${newChannel.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
