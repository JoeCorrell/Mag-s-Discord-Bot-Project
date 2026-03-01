const { EmbedBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');
const { replaceVariables } = require('../../utils/variables');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member, client) {
        const settings = client.db.settings.getSettings(member.guild.id);

        // Welcome message
        if (settings.mod_welcome && settings.welcome_channel_id) {
            const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
            if (channel) {
                const data = { user: member.user, guild: member.guild, channel };
                const message = replaceVariables(settings.welcome_message, data);

                if (settings.welcome_embed) {
                    const embed = new EmbedBuilder()
                        .setColor(parseInt(settings.welcome_embed_color.replace('#', ''), 16))
                        .setDescription(message)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                        .setTimestamp();

                    channel.send({ embeds: [embed] }).catch(() => {});
                } else {
                    channel.send(message).catch(() => {});
                }
            }
        }

        // Welcome DM
        if (settings.mod_welcome && settings.welcome_dm && settings.welcome_dm_message) {
            const data = { user: member.user, guild: member.guild };
            const dmMessage = replaceVariables(settings.welcome_dm_message, data);
            member.send(dmMessage).catch(() => {});
        }

        // Log member join
        if (settings.mod_logging && settings.log_channel_id && settings.log_member_join) {
            const logChannel = member.guild.channels.cache.get(settings.log_channel_id);
            if (logChannel) {
                const embed = customEmbed(0x57F287)
                    .setTitle('Member Joined')
                    .setDescription(`${member} (${member.user.tag})`)
                    .addFields(
                        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
                    )
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: `ID: ${member.id}` })
                    .setTimestamp();

                logChannel.send({ embeds: [embed] }).catch(() => {});
            }
        }
    },
};
