module.exports = {
    colors: {
        primary: 0x5865F2,
        success: 0x57F287,
        warning: 0xFEE75C,
        error: 0xED4245,
        info: 0x5865F2,
        moderation: 0xE67E22,
    },

    emojis: {
        success: '\u2705',
        error: '\u274C',
        warn: '\u26A0\uFE0F',
        info: '\u2139\uFE0F',
        loading: '\u23F3',
        coin: '\uD83E\uDE99',
        trophy: '\uD83C\uDFC6',
        star: '\u2B50',
        lock: '\uD83D\uDD12',
        unlock: '\uD83D\uDD13',
        ticket: '\uD83C\uDFAB',
        music: '\uD83C\uDFB5',
        giveaway: '\uD83C\uDF89',
    },

    defaults: {
        cooldown: 3,
        embedColor: 0x5865F2,
        footerText: "Mag's Bot",
    },

    limits: {
        purgeMax: 100,
        warnsBeforeAction: 3,
        ticketsPerUser: 3,
        customCommandsPerGuild: 50,
        shopItemsPerGuild: 100,
        reminderMaxDuration: 30 * 24 * 60 * 60 * 1000,
        giveawayMaxDuration: 30 * 24 * 60 * 60 * 1000,
    },

    xp: {
        levelUpFormula: (level) => 5 * (level ** 2) + 50 * level + 100,
    },

    economy: {
        workResponses: [
            'You worked as a programmer and earned **{amount}** {currency}!',
            'You delivered pizzas and earned **{amount}** {currency}!',
            'You mowed lawns and earned **{amount}** {currency}!',
            'You walked dogs and earned **{amount}** {currency}!',
            'You worked at a coffee shop and earned **{amount}** {currency}!',
            'You drove a taxi and earned **{amount}** {currency}!',
            'You painted a house and earned **{amount}** {currency}!',
            'You fixed computers and earned **{amount}** {currency}!',
            'You tutored students and earned **{amount}** {currency}!',
            'You sold lemonade and earned **{amount}** {currency}!',
        ],
        slotsEmojis: ['\uD83C\uDF52', '\uD83C\uDF4B', '\uD83C\uDF47', '\uD83D\uDD25', '\uD83D\uDC8E'],
    },

    thunderstore: {
        author: 'ProfMags',
        community: 'valheim',
        checkInterval: 300000, // 5 minutes
        // Mods not yet indexed in the listing API (newly published)
        extraMods: ['Valkyrie'],
        // Channel name overrides when mod name doesn't auto-match
        channelOverrides: {
            'Valkyrie': 'valkyrie-mod-manager',
        },
    },

    modules: {
        moderation: 'mod_moderation',
        automod: 'mod_automod',
        logging: 'mod_logging',
        welcome: 'mod_welcome',
        goodbye: 'mod_goodbye',
        leveling: 'mod_leveling',
        economy: 'mod_economy',
        tickets: 'mod_tickets',
        'reaction-roles': 'mod_reaction_roles',
        fun: 'mod_fun',
        utility: 'mod_utility',
        music: 'mod_music',
        giveaways: 'mod_giveaways',
        'custom-commands': 'mod_custom_cmds',
        settings: null,
    },
};
