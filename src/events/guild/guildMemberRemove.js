const { EmbedBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');
const { replaceVariables } = require('../../utils/variables');

module.exports = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member, client) {
        const settings = client.db.settings.getSettings(member.guild.id);

        // Goodbye message
        if (settings.mod_goodbye && settings.goodbye_channel_id) {
            const channel = member.guild.channels.cache.get(settings.goodbye_channel_id);
            if (channel) {
                const data = { user: member.user, guild: member.guild, channel };
                const message = replaceVariables(settings.goodbye_message, data);

                if (settings.goodbye_embed) {
                    const embed = new EmbedBuilder()
                        .setColor(parseInt(settings.goodbye_embed_color.replace('#', ''), 16))
                        .setDescription(message)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                        .setTimestamp();

                    channel.send({ embeds: [embed] }).catch(() => {});
                } else {
                    channel.send(message).catch(() => {});
                }
            }
        }

        // Log member leave
        if (settings.mod_logging && settings.log_channel_id && settings.log_member_leave) {
            const logChannel = member.guild.channels.cache.get(settings.log_channel_id);
            if (logChannel) {
                const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => `${r}`).join(', ') || 'None';

                const embed = customEmbed(0xED4245)
                    .setTitle('Member Left')
                    .setDescription(`${member.user} (${member.user.tag})`)
                    .addFields(
                        { name: 'Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
                        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
                        { name: 'Roles', value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles },
                    )
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: `ID: ${member.id}` })
                    .setTimestamp();

                logChannel.send({ embeds: [embed] }).catch(() => {});
            }
        }
    },
};
