const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'guildBanAdd',
    once: false,
    async execute(ban, client) {
        const settings = client.db.settings.getSettings(ban.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_mod_actions) return;

        const logChannel = ban.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        const embed = customEmbed(0xED4245)
            .setTitle('Member Banned')
            .setDescription(`${ban.user} (${ban.user.tag})`)
            .addFields({ name: 'Reason', value: ban.reason || 'No reason provided' })
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `ID: ${ban.user.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
