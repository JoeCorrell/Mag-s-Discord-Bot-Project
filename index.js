require('dotenv').config();

const ExtendedClient = require('./src/structures/ExtendedClient');
const db = require('./src/database/database');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');
const { loadComponents } = require('./src/handlers/componentHandler');
const logger = require('./src/utils/logger');

const client = new ExtendedClient();
client.db = db;

loadCommands(client);
loadEvents(client);
loadComponents(client);

// Reminder checker - runs every 15 seconds
setInterval(async () => {
    try {
        const pending = client.db.reminders.getPending();
        for (const reminder of pending) {
            try {
                const channel = await client.channels.fetch(reminder.channel_id).catch(() => null);
                if (channel) {
                    await channel.send(`<@${reminder.user_id}> **Reminder:** ${reminder.message}`);
                }
                client.db.reminders.markCompleted(reminder.id);
            } catch (err) {
                logger.error(`Failed to send reminder ${reminder.id}:`, err);
                client.db.reminders.markCompleted(reminder.id);
            }
        }
    } catch (err) {
        logger.error('Reminder check failed:', err);
    }
}, 15000);

// Giveaway checker - runs every 15 seconds
setInterval(async () => {
    try {
        const expired = client.db.giveaways.getExpired();
        for (const giveaway of expired) {
            try {
                const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
                if (!channel) {
                    client.db.giveaways.end(giveaway.id);
                    continue;
                }

                const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
                const entries = JSON.parse(giveaway.entries);
                const winners = [];

                const shuffled = entries.sort(() => Math.random() - 0.5);
                for (let i = 0; i < Math.min(giveaway.winners_count, shuffled.length); i++) {
                    winners.push(shuffled[i]);
                }

                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle('\uD83C\uDF89 Giveaway Ended!')
                    .setColor(0xED4245)
                    .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'No valid entries'}\n**Hosted by:** <@${giveaway.host_id}>`)
                    .setTimestamp();

                if (message) {
                    await message.edit({ embeds: [embed], components: [] }).catch(() => {});
                }

                if (winners.length > 0) {
                    await channel.send(`Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**! \uD83C\uDF89`);
                } else {
                    await channel.send(`No one entered the giveaway for **${giveaway.prize}**. \uD83D\uDE22`);
                }

                client.db.giveaways.end(giveaway.id);
            } catch (err) {
                logger.error(`Failed to end giveaway ${giveaway.id}:`, err);
                client.db.giveaways.end(giveaway.id);
            }
        }
    } catch (err) {
        logger.error('Giveaway check failed:', err);
    }
}, 15000);

// Thunderstore mod update checker - runs every 5 minutes
const https = require('https');
const config = require('./config/config');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function fetchJSON(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
            if (res.statusCode !== 200) { resolve(null); res.resume(); return; }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function fetchHTML(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) { resolve(null); res.resume(); return; }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(null));
    });
}

function parseLatestChangelog(html, version) {
    if (!html) return null;

    // Find the section for this version (between its <h2> and the next <h2>)
    const versionTag = `<h2>${version}</h2>`;
    const start = html.indexOf(versionTag);
    if (start === -1) return null;

    const contentStart = start + versionTag.length;
    const nextH2 = html.indexOf('<h2>', contentStart);
    const section = nextH2 > -1 ? html.substring(contentStart, nextH2) : html.substring(contentStart, contentStart + 2000);

    // Convert HTML to readable text
    let text = section
        .replace(/<h3>(.*?)<\/h3>/g, '**$1**\n')
        .replace(/<li>(.*?)<\/li>/g, '- $1\n')
        .replace(/<ul>|<\/ul>/g, '')
        .replace(/<\/?p>/g, '\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Truncate to fit Discord embed description (4096 total, leave room for mod description)
    if (text.length > 3500) {
        text = text.substring(0, 3497) + '...';
    }

    return text || null;
}

function modNameToChannelName(modName) {
    // Converts PascalCase or Underscore_Case to kebab-case
    // "HaldorOverhaul" -> "haldor-overhaul"
    // "Offline_Companions" -> "offline-companions"
    return modName
        .replace(/_/g, '-')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
}

function buildModEmbed(mod, newVersion, oldVersion) {
    let description = mod.description || 'No description available.';
    if (mod.changelog) {
        description += `\n\n**Changelog**\n${mod.changelog}`;
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(oldVersion
            ? `\uD83D\uDD14 ${mod.name} Updated to v${newVersion}`
            : `\uD83D\uDCE6 ${mod.name} v${newVersion}`)
        .setDescription(description)
        .setFooter({ text: "Mag's Bot" })
        .setTimestamp();

    if (oldVersion) {
        embed.addFields(
            { name: 'Previous Version', value: `v${oldVersion}`, inline: true },
            { name: 'New Version', value: `v${newVersion}`, inline: true },
        );
    } else {
        embed.addFields(
            { name: 'Version', value: `v${newVersion}`, inline: true },
        );
    }

    embed.addFields(
        { name: 'Total Downloads', value: `${mod.downloadCount.toLocaleString()}`, inline: true },
    );

    if (mod.icon) {
        embed.setThumbnail(mod.icon);
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('View on Thunderstore')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://thunderstore.io/c/${config.thunderstore.community}/p/${config.thunderstore.author}/${mod.name}/`)
    );

    return { content: '@everyone', embeds: [embed], components: [row] };
}

function findModChannel(guild, modName) {
    // Check config overrides first
    const override = config.thunderstore.channelOverrides?.[modName];
    if (override) {
        return guild.channels.cache.find(c => c.name.endsWith(override));
    }
    // Auto-match by converting mod name to kebab-case
    const channelName = modNameToChannelName(modName);
    return guild.channels.cache.find(c => c.name.endsWith(channelName));
}

async function processModUpdate(modInfo, guild) {
    const tracked = client.db.thunderstore.get(guild.id, modInfo.name);

    if (!tracked) {
        // First time — find channel, save version, post current info
        const channel = findModChannel(guild, modInfo.name);
        if (channel) {
            client.db.thunderstore.add(guild.id, modInfo.name, channel.id, modInfo.version);
            await channel.send(buildModEmbed(modInfo, modInfo.version, null));
            logger.info(`Auto-tracked ${modInfo.name} v${modInfo.version} → #${channel.name}`);
        }
        return;
    }

    if (modInfo.version === tracked.last_version) return;

    // Version changed — post update notification
    const channel = await client.channels.fetch(tracked.channel_id).catch(() => null);
    if (channel) {
        await channel.send(buildModEmbed(modInfo, modInfo.version, tracked.last_version));
    }

    client.db.thunderstore.updateVersion(tracked.id, modInfo.version);
    logger.info(`Thunderstore update: ${modInfo.name} v${tracked.last_version} → v${modInfo.version}`);
}

async function checkThunderstoreMods() {
    try {
        const { author, community, extraMods } = config.thunderstore;
        const processedMods = new Set();

        // Fetch mods from listing API (has correct download counts)
        const listing = await fetchJSON(`https://thunderstore.io/api/cyberstorm/listing/${community}/?q=${author}&page=1`);
        const listedMods = listing?.results?.filter(m => m.namespace === author) || [];

        // Build mod info from listing + experimental API
        for (const listingMod of listedMods) {
            const detail = await fetchJSON(`https://thunderstore.io/api/experimental/package/${author}/${listingMod.name}/`);
            if (!detail?.latest?.version_number) continue;

            const changelogHTML = await fetchHTML(`https://thunderstore.io/c/${community}/p/${author}/${listingMod.name}/changelog/`);
            const changelog = parseLatestChangelog(changelogHTML, detail.latest.version_number);

            const modInfo = {
                name: listingMod.name,
                description: listingMod.description,
                downloadCount: listingMod.download_count,
                icon: listingMod.icon_url,
                version: detail.latest.version_number,
                changelog,
            };

            processedMods.add(modInfo.name);

            for (const guild of client.guilds.cache.values()) {
                try { await processModUpdate(modInfo, guild); }
                catch (err) { logger.error(`Failed to process ${modInfo.name} for guild ${guild.id}:`, err); }
            }
        }

        // Handle extra mods not yet in listing API (newly published)
        for (const modName of (extraMods || [])) {
            if (processedMods.has(modName)) continue;

            const detail = await fetchJSON(`https://thunderstore.io/api/experimental/package/${author}/${modName}/`);
            if (!detail?.latest?.version_number) continue;

            const changelogHTML = await fetchHTML(`https://thunderstore.io/c/${community}/p/${author}/${modName}/changelog/`);
            const changelog = parseLatestChangelog(changelogHTML, detail.latest.version_number);

            const modInfo = {
                name: detail.name,
                description: detail.latest.description,
                downloadCount: detail.latest.downloads || 0,
                icon: detail.latest.icon,
                version: detail.latest.version_number,
                changelog,
            };

            for (const guild of client.guilds.cache.values()) {
                try { await processModUpdate(modInfo, guild); }
                catch (err) { logger.error(`Failed to process ${modInfo.name} for guild ${guild.id}:`, err); }
            }
        }
    } catch (err) {
        logger.error('Thunderstore check failed:', err);
    }
}

// Run first check 15 seconds after startup, then every 5 minutes
setTimeout(() => {
    checkThunderstoreMods();
    setInterval(checkThunderstoreMods, config.thunderstore.checkInterval);
}, 15000);

// Global error handlers
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
});

client.login(process.env.BOT_TOKEN);
