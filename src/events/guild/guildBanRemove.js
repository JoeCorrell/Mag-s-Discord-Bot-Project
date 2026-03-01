const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'guildBanRemove',
    once: false,
    async execute(ban, client) {
        const settings = client.db.settings.getSettings(ban.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_mod_actions) return;

        const logChannel = ban.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        const embed = customEmbed(0x57F287)
            .setTitle('Member Unbanned')
            .setDescription(`${ban.user} (${ban.user.tag})`)
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `ID: ${ban.user.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
