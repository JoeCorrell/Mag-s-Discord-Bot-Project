const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'guildMemberUpdate',
    once: false,
    async execute(oldMember, newMember, client) {
        const settings = client.db.settings.getSettings(newMember.guild.id);
        if (!settings.mod_logging || !settings.log_channel_id || !settings.log_role_changes) return;

        const logChannel = newMember.guild.channels.cache.get(settings.log_channel_id);
        if (!logChannel) return;

        // Role changes
        const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

        if (addedRoles.size > 0) {
            const embed = customEmbed(0x57F287)
                .setTitle('Role Added')
                .setDescription(`${newMember} (${newMember.user.tag})`)
                .addFields({ name: 'Added Roles', value: addedRoles.map(r => `${r}`).join(', ') })
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `ID: ${newMember.id}` })
                .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(() => {});
        }

        if (removedRoles.size > 0) {
            const embed = customEmbed(0xED4245)
                .setTitle('Role Removed')
                .setDescription(`${newMember} (${newMember.user.tag})`)
                .addFields({ name: 'Removed Roles', value: removedRoles.map(r => `${r}`).join(', ') })
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `ID: ${newMember.id}` })
                .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(() => {});
        }

        // Nickname change
        if (oldMember.nickname !== newMember.nickname) {
            const embed = customEmbed(0xFEE75C)
                .setTitle('Nickname Changed')
                .setDescription(`${newMember} (${newMember.user.tag})`)
                .addFields(
                    { name: 'Before', value: oldMember.nickname || 'None', inline: true },
                    { name: 'After', value: newMember.nickname || 'None', inline: true },
                )
                .setFooter({ text: `ID: ${newMember.id}` })
                .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    },
};
