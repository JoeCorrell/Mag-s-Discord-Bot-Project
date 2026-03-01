const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'messageDelete',
    once: false,
    async execute(message, client) {
        if (!message.guild || message.partial || message.author?.bot) return;

        const settings = client.db.settings.getSettings(message.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_message_deletes) return;

        const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        const content = message.content || '*No text content*';
        const truncated = content.length > 1024 ? content.substring(0, 1021) + '...' : content;

        const embed = customEmbed(0xED4245)
            .setTitle('Message Deleted')
            .setDescription(`**Author:** ${message.author} (${message.author.tag})\n**Channel:** ${message.channel}`)
            .addFields({ name: 'Content', value: truncated })
            .setFooter({ text: `User ID: ${message.author.id}` })
            .setTimestamp();

        if (message.attachments.size > 0) {
            embed.addFields({ name: 'Attachments', value: message.attachments.map(a => a.url).join('\n') });
        }

        logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
