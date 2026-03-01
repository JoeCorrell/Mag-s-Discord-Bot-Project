const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'messageUpdate',
    once: false,
    async execute(oldMessage, newMessage, client) {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.partial) return;
        if (oldMessage.content === newMessage.content) return;

        const settings = client.db.settings.getSettings(newMessage.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_message_edits) return;

        const logChannel = newMessage.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        const oldContent = oldMessage.content || '*Empty*';
        const newContent = newMessage.content || '*Empty*';

        const embed = customEmbed(0xFEE75C)
            .setTitle('Message Edited')
            .setDescription(`**Author:** ${newMessage.author} (${newMessage.author.tag})\n**Channel:** ${newMessage.channel}\n[Jump to Message](${newMessage.url})`)
            .addFields(
                { name: 'Before', value: oldContent.length > 1024 ? oldContent.substring(0, 1021) + '...' : oldContent },
                { name: 'After', value: newContent.length > 1024 ? newContent.substring(0, 1021) + '...' : newContent },
            )
            .setFooter({ text: `User ID: ${newMessage.author.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
