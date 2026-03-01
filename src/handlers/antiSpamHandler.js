const { Collection } = require('discord.js');

const spamMap = new Collection();

function checkSpam(message, settings) {
    const { guild, author } = message;
    if (!guild || !settings.automod_anti_spam) return false;

    if (!spamMap.has(guild.id)) {
        spamMap.set(guild.id, new Collection());
    }

    const guildMap = spamMap.get(guild.id);

    if (!guildMap.has(author.id)) {
        guildMap.set(author.id, { timestamps: [], warned: false });
    }

    const userData = guildMap.get(author.id);
    const now = Date.now();
    const window = settings.automod_spam_window || 5000;

    userData.timestamps = userData.timestamps.filter(t => now - t < window);
    userData.timestamps.push(now);

    if (userData.timestamps.length >= (settings.automod_spam_threshold || 5)) {
        userData.timestamps = [];
        return true;
    }

    return false;
}

function checkLinks(message, settings) {
    if (!settings.automod_anti_link) return false;

    const urlRegex = /https?:\/\/[^\s]+/gi;
    const urls = message.content.match(urlRegex);

    if (!urls) return false;

    const whitelist = JSON.parse(settings.automod_link_whitelist || '[]');
    if (whitelist.length === 0) return true;

    return urls.some(url => {
        try {
            const hostname = new URL(url).hostname;
            return !whitelist.some(domain => hostname.includes(domain));
        } catch {
            return true;
        }
    });
}

function checkBadWords(message, settings) {
    const badWords = JSON.parse(settings.automod_bad_words || '[]');
    if (badWords.length === 0) return false;

    const content = message.content.toLowerCase();
    return badWords.some(word => content.includes(word.toLowerCase()));
}

function isExempt(message, settings) {
    const exemptRoles = JSON.parse(settings.automod_exempt_roles || '[]');
    const exemptChannels = JSON.parse(settings.automod_exempt_channels || '[]');

    if (exemptChannels.includes(message.channel.id)) return true;
    if (message.member && message.member.roles.cache.some(r => exemptRoles.includes(r.id))) return true;

    return false;
}

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [guildId, guildMap] of spamMap) {
        for (const [userId, data] of guildMap) {
            data.timestamps = data.timestamps.filter(t => now - t < 30000);
            if (data.timestamps.length === 0) {
                guildMap.delete(userId);
            }
        }
        if (guildMap.size === 0) {
            spamMap.delete(guildId);
        }
    }
}, 300000);

module.exports = { checkSpam, checkLinks, checkBadWords, isExempt };
