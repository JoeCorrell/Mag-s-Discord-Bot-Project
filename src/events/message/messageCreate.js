const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config/config');
const { customEmbed } = require('../../utils/embedBuilder');
const { checkSpam, checkLinks, checkBadWords, isExempt } = require('../../handlers/antiSpamHandler');

const MOD_CHECK_CHANNEL = '1479563524731572354';

function getCompatibleMods() {
    const filePath = path.join(__dirname, '..', '..', '..', 'data', 'compatible-mods.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.mods.map(m => m.toLowerCase());
}

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

        // Bug/issue report detection (skip ticket channels)
        const isTicketChannel = settings.ticket_category_id && message.channel.parentId === settings.ticket_category_id;
        if (settings.mod_automod && !isExempt(message, settings) && !isTicketChannel) {
            const bugPattern = /\b(bug|issue)\b/i;
            if (bugPattern.test(message.content)) {
                const originalContent = message.content;
                await message.delete().catch(() => {});

                // Check ticket limit
                const openTickets = client.db.tickets.getOpenByUser(message.guild.id, message.author.id);
                if (openTickets.length >= config.limits.ticketsPerUser) {
                    await message.channel.send(`${message.author}, you already have an open ticket. Please use it to report your bug/issue.`).then(msg => {
                        setTimeout(() => msg.delete().catch(() => {}), 10000);
                    }).catch(() => {});
                    return;
                }

                // Create ticket channel under [TICKETS] category
                const ticketNumber = client.db.tickets.getNextNumber(message.guild.id);
                const channelOptions = {
                    name: `bug-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: message.author.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
                    ],
                };

                if (settings.ticket_category_id) {
                    channelOptions.parent = settings.ticket_category_id;
                }

                if (settings.ticket_support_role_id) {
                    channelOptions.permissionOverwrites.push({
                        id: settings.ticket_support_role_id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    });
                }

                const channel = await message.guild.channels.create(channelOptions).catch(() => null);
                if (!channel) return;

                client.db.tickets.create(message.guild.id, channel.id, message.author.id, ticketNumber, 'bug');

                // Send welcome embed in the ticket
                const ticketEmbed = customEmbed(0xED4245)
                    .setTitle(`Bug Report #${ticketNumber}`)
                    .setDescription(`${message.author}, your message was moved here.\nPlease describe your bug or issue in detail so our team can help.`)
                    .addFields({ name: 'Original Message', value: originalContent.substring(0, 1024) })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket-close').setLabel('Close Ticket').setEmoji('\uD83D\uDD12').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('ticket-claim').setLabel('Claim Ticket').setEmoji('\u2705').setStyle(ButtonStyle.Success),
                );

                const supportPing = settings.ticket_support_role_id ? `<@&${settings.ticket_support_role_id}>` : '';
                await channel.send({ content: `${message.author} ${supportPing}`, embeds: [ticketEmbed], components: [row] });

                // Notify in original channel
                await message.channel.send(`${message.author}, a bug report ticket has been opened for you: ${channel}`).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 10000);
                }).catch(() => {});
                return;
            }
        }

        // Mod compatibility check
        if (message.channel.id === MOD_CHECK_CHANNEL) {
            const query = message.content.trim();
            if (query.length > 0) {
                const compatibleMods = getCompatibleMods();
                const searchTerm = query.toLowerCase().replace(/[_\s-]/g, '');
                const match = compatibleMods.find(m => m.replace(/[_\s-]/g, '') === searchTerm);
                const partialMatches = compatibleMods.filter(m => m.replace(/[_\s-]/g, '').includes(searchTerm) || searchTerm.includes(m.replace(/[_\s-]/g, '')));

                let embed;
                if (match) {
                    embed = customEmbed(0x57F287)
                        .setTitle('Mod Compatible')
                        .setDescription(`**${query}** has been tested and is compatible with our mods.`);
                } else if (partialMatches.length > 0) {
                    const matchList = partialMatches.map(m => `\`${m}\``).join(', ');
                    embed = customEmbed(0xFEE75C)
                        .setTitle('Possible Match')
                        .setDescription(`**${query}** wasn't an exact match, but we found similar mods:\n${matchList}\n\nThese are confirmed compatible.`);
                } else {
                    embed = customEmbed(0xED4245)
                        .setTitle('Not Tested')
                        .setDescription(`**${query}** has not been tested for compatibility with our mods.\nIt may still work, but use at your own risk.`);
                }

                await message.reply({ embeds: [embed] }).then(msg => {
                    setTimeout(() => {
                        msg.delete().catch(() => {});
                        message.delete().catch(() => {});
                    }, 10000);
                }).catch(() => {});
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

                // Built-in role rewards by name
                const autoRoles = {
                    5: 'Apprentice',
                    10: 'Executor',
                    20: 'Strategist',
                    30: 'Mentor',
                };

                if (autoRoles[newLevel] && message.member) {
                    const role = message.guild.roles.cache.find(r => r.name === autoRoles[newLevel]);
                    if (role && !message.member.roles.cache.has(role.id)) {
                        await message.member.roles.add(role, `Reached Level ${newLevel}`).catch(() => {});
                    }
                }

                // Check for custom role rewards
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
