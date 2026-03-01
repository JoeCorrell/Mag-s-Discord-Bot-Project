const config = require('../../../config/config');
const { customEmbed } = require('../../utils/embedBuilder');
const { checkSpam, checkLinks, checkBadWords, isExempt } = require('../../handlers/antiSpamHandler');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const settings = client.db.settings.getSettings(message.guild.id);

        // Auto-moderation checks
        if (settings.mod_automod && !isExempt(message, settings)) {
            const violated = checkSpam(message, settings) || checkLinks(message, settings) || checkBadWords(message, settings);

            if (violated) {
                await message.delete().catch(() => {});

                const action = settings.automod_action || 'timeout';
                const member = message.member;

                if (member && member.moderatable) {
                    switch (action) {
                        case 'timeout':
                            await member.timeout(5 * 60 * 1000, 'Auto-moderation').catch(() => {});
                            break;
                        case 'kick':
                            await member.kick('Auto-moderation').catch(() => {});
                            break;
                        case 'ban':
                            await member.ban({ reason: 'Auto-moderation' }).catch(() => {});
                            break;
                        case 'warn':
                            client.db.warnings.add(message.guild.id, message.author.id, client.user.id, 'Auto-moderation violation');
                            break;
                    }
                }

                if (settings.mod_logging && settings.log_channel_id) {
                    const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
                    if (logChannel) {
                        const embed = customEmbed(0xE67E22)
                            .setTitle('Auto-Moderation')
                            .setDescription(`**User:** ${message.author} (${message.author.tag})\n**Channel:** <#${message.channel.id}>\n**Action:** ${action}`)
                            .addFields({ name: 'Message Content', value: message.content?.substring(0, 1024) || '*Empty*' })
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] }).catch(() => {});
                    }
                }

                return;
            }
        }

        // Custom commands check
        if (settings.mod_custom_cmds) {
            const content = message.content.toLowerCase().trim();
            const customCmd = client.db.customCommands.get(message.guild.id, content);
            if (customCmd) {
                client.db.customCommands.incrementUses(customCmd.id);
                await message.reply(customCmd.response).catch(() => {});
                return;
            }
        }

        // XP / Leveling system
        if (settings.mod_leveling) {
            const ignoredChannels = JSON.parse(settings.xp_ignored_channels || '[]');
            const ignoredRoles = JSON.parse(settings.xp_ignored_roles || '[]');

            if (ignoredChannels.includes(message.channel.id)) return;
            if (message.member && message.member.roles.cache.some(r => ignoredRoles.includes(r.id))) return;

            const userData = client.db.leveling.getUser(message.guild.id, message.author.id);

            if (userData && userData.last_xp_at) {
                const lastXP = new Date(userData.last_xp_at + 'Z').getTime();
                const cooldown = settings.xp_cooldown || 60000;
                if (Date.now() - lastXP < cooldown) return;
            }

            const xpMin = settings.xp_min || 15;
            const xpMax = settings.xp_max || 25;
            const xpAmount = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

            client.db.leveling.addXP(message.guild.id, message.author.id, xpAmount);

            const updatedUser = client.db.leveling.getUser(message.guild.id, message.author.id);
            const xpNeeded = config.xp.levelUpFormula(updatedUser.level);

            if (updatedUser.xp >= xpNeeded) {
                const newLevel = updatedUser.level + 1;
                const remainingXP = updatedUser.xp - xpNeeded;
                client.db.leveling.setLevel(message.guild.id, message.author.id, newLevel, remainingXP);

                // Send level-up notification
                const notifChannel = settings.xp_notification_channel
                    ? message.guild.channels.cache.get(settings.xp_notification_channel)
                    : message.channel;

                if (notifChannel) {
                    const embed = customEmbed(0x57F287)
                        .setTitle('\u2B50 Level Up!')
                        .setDescription(`Congratulations ${message.author}! You reached **Level ${newLevel}**!`)
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

                    notifChannel.send({ embeds: [embed] }).catch(() => {});
                }

                // Check for role rewards
                const reward = client.db.leveling.getRewardForLevel(message.guild.id, newLevel);
                if (reward && message.member) {
                    const role = message.guild.roles.cache.get(reward.role_id);
                    if (role && !message.member.roles.cache.has(role.id)) {
                        await message.member.roles.add(role, `Level ${newLevel} reward`).catch(() => {});
                    }
                }
            }
        }
    },
};
