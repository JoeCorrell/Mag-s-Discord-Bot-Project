function runMigrations(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS guild_settings (
            guild_id TEXT PRIMARY KEY,

            -- Module toggles
            mod_moderation     INTEGER DEFAULT 1,
            mod_automod        INTEGER DEFAULT 0,
            mod_logging        INTEGER DEFAULT 0,
            mod_welcome        INTEGER DEFAULT 0,
            mod_goodbye        INTEGER DEFAULT 0,
            mod_leveling       INTEGER DEFAULT 0,
            mod_economy        INTEGER DEFAULT 0,
            mod_tickets        INTEGER DEFAULT 0,
            mod_reaction_roles INTEGER DEFAULT 1,
            mod_fun            INTEGER DEFAULT 1,
            mod_utility        INTEGER DEFAULT 1,
            mod_music          INTEGER DEFAULT 0,
            mod_giveaways      INTEGER DEFAULT 1,
            mod_custom_cmds    INTEGER DEFAULT 1,

            -- Logging
            log_channel_id         TEXT,
            log_message_edits      INTEGER DEFAULT 1,
            log_message_deletes    INTEGER DEFAULT 1,
            log_member_join        INTEGER DEFAULT 1,
            log_member_leave       INTEGER DEFAULT 1,
            log_role_changes       INTEGER DEFAULT 1,
            log_channel_changes    INTEGER DEFAULT 1,
            log_mod_actions        INTEGER DEFAULT 1,

            -- Welcome / Goodbye
            welcome_channel_id     TEXT,
            welcome_message        TEXT DEFAULT 'Welcome to {server}, {user}! You are member #{memberCount}.',
            welcome_embed          INTEGER DEFAULT 1,
            welcome_embed_color    TEXT DEFAULT '#5865F2',
            welcome_dm             INTEGER DEFAULT 0,
            welcome_dm_message     TEXT,
            goodbye_channel_id     TEXT,
            goodbye_message        TEXT DEFAULT 'Goodbye {user}. We now have {memberCount} members.',
            goodbye_embed          INTEGER DEFAULT 1,
            goodbye_embed_color    TEXT DEFAULT '#ED4245',

            -- Auto-Moderation
            automod_anti_spam       INTEGER DEFAULT 0,
            automod_spam_threshold  INTEGER DEFAULT 5,
            automod_spam_window     INTEGER DEFAULT 5000,
            automod_anti_link       INTEGER DEFAULT 0,
            automod_link_whitelist  TEXT DEFAULT '[]',
            automod_bad_words       TEXT DEFAULT '["nigger","nigga","nigg3r","n1gger","n1gga","faggot","fag","f4g","f4ggot","retard","retarded","r3tard","kys","kill yourself","tranny","tr4nny","coon","spic","sp1c","chink","ch1nk","wetback","beaner","gook","kike","k1ke","dyke","negro","negr0","whore","wh0re","slut","sl0t","cum","cvm","porn","p0rn","hentai","cock","c0ck","dick","d1ck","pussy","pvssy","asshole","a$$hole","assh0le","motherfucker","m0therfucker","stfu","gtfo","bitch","b1tch","b!tch","bastard","basstard","twat","tw4t","wanker","w4nker","cunt","cvnt","c0nt","skank","sk4nk","jackass","j4ckass","dumbass","dipshit","d1pshit","bullshit","bullsh1t","piss","p1ss","fck","fuk","fuq","phuck","phuk","sh1t","sht","a55","a55hole","b1tches","h0e","hoe","thot","th0t","sugma","ligma","deez nuts","anal","an4l","rape","r4pe","molest","pedo","p3do","pedophile"]',
            automod_anti_raid       INTEGER DEFAULT 0,
            automod_raid_threshold  INTEGER DEFAULT 10,
            automod_raid_window     INTEGER DEFAULT 10000,
            automod_action          TEXT DEFAULT 'timeout',
            automod_exempt_roles    TEXT DEFAULT '[]',
            automod_exempt_channels TEXT DEFAULT '[]',

            -- Leveling
            xp_notification_channel TEXT,
            xp_min                  INTEGER DEFAULT 15,
            xp_max                  INTEGER DEFAULT 25,
            xp_cooldown             INTEGER DEFAULT 60000,
            xp_ignored_channels     TEXT DEFAULT '[]',
            xp_ignored_roles        TEXT DEFAULT '[]',

            -- Economy
            economy_currency_name   TEXT DEFAULT 'coins',
            economy_currency_emoji  TEXT DEFAULT ':coin:',
            economy_daily_amount    INTEGER DEFAULT 500,
            economy_work_min        INTEGER DEFAULT 100,
            economy_work_max        INTEGER DEFAULT 500,
            economy_rob_chance      INTEGER DEFAULT 40,
            economy_rob_fine        INTEGER DEFAULT 200,

            -- Tickets
            ticket_category_id      TEXT,
            ticket_log_channel_id   TEXT,
            ticket_support_role_id  TEXT,
            ticket_counter          INTEGER DEFAULT 0,
            ticket_transcript       INTEGER DEFAULT 1,

            -- Embed branding
            embed_color             TEXT DEFAULT '#5865F2',
            embed_footer_text       TEXT DEFAULT 'Mag''s Bot',
            embed_footer_icon       TEXT,
            embed_thumbnail         TEXT,

            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS warnings (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            moderator_id  TEXT NOT NULL,
            reason        TEXT DEFAULT 'No reason provided',
            created_at    TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guild_id, user_id);

        CREATE TABLE IF NOT EXISTS mod_logs (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            moderator_id  TEXT NOT NULL,
            action        TEXT NOT NULL,
            reason        TEXT DEFAULT 'No reason provided',
            duration      TEXT,
            created_at    TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_modlogs_guild ON mod_logs(guild_id);

        CREATE TABLE IF NOT EXISTS user_levels (
            guild_id      TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            xp            INTEGER DEFAULT 0,
            level         INTEGER DEFAULT 0,
            total_xp      INTEGER DEFAULT 0,
            messages      INTEGER DEFAULT 0,
            last_xp_at    TEXT,
            PRIMARY KEY (guild_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS level_rewards (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            level         INTEGER NOT NULL,
            role_id       TEXT NOT NULL,
            UNIQUE(guild_id, level)
        );

        CREATE TABLE IF NOT EXISTS economy_users (
            guild_id      TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            wallet        INTEGER DEFAULT 0,
            bank          INTEGER DEFAULT 0,
            bank_capacity INTEGER DEFAULT 10000,
            last_daily    TEXT,
            last_work     TEXT,
            last_rob      TEXT,
            PRIMARY KEY (guild_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS shop_items (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            name          TEXT NOT NULL,
            description   TEXT,
            price         INTEGER NOT NULL,
            role_id       TEXT,
            emoji         TEXT DEFAULT ':package:',
            max_stock     INTEGER DEFAULT -1,
            current_stock INTEGER DEFAULT -1,
            created_at    TEXT DEFAULT (datetime('now')),
            UNIQUE(guild_id, name)
        );

        CREATE TABLE IF NOT EXISTS user_inventory (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            item_id       INTEGER NOT NULL,
            quantity      INTEGER DEFAULT 1,
            purchased_at  TEXT DEFAULT (datetime('now')),
            UNIQUE(guild_id, user_id, item_id),
            FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id         TEXT NOT NULL,
            channel_id       TEXT NOT NULL UNIQUE,
            user_id          TEXT NOT NULL,
            claimed_by       TEXT,
            ticket_number    INTEGER NOT NULL,
            category         TEXT DEFAULT 'general',
            status           TEXT DEFAULT 'open',
            reason           TEXT,
            created_at       TEXT DEFAULT (datetime('now')),
            closed_at        TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);

        CREATE TABLE IF NOT EXISTS ticket_panels (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id         TEXT NOT NULL,
            channel_id       TEXT NOT NULL,
            message_id       TEXT NOT NULL UNIQUE,
            title            TEXT DEFAULT 'Support Tickets',
            description      TEXT DEFAULT 'Click the button below to create a ticket.',
            categories       TEXT DEFAULT '["general"]',
            created_at       TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS reaction_roles (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            channel_id    TEXT NOT NULL,
            message_id    TEXT NOT NULL,
            role_id       TEXT NOT NULL,
            emoji         TEXT,
            button_label  TEXT,
            button_style  TEXT DEFAULT 'Primary',
            type          TEXT DEFAULT 'button',
            UNIQUE(message_id, role_id)
        );

        CREATE TABLE IF NOT EXISTS giveaways (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            channel_id    TEXT NOT NULL,
            message_id    TEXT,
            host_id       TEXT NOT NULL,
            prize         TEXT NOT NULL,
            winners_count INTEGER DEFAULT 1,
            entries       TEXT DEFAULT '[]',
            ends_at       TEXT NOT NULL,
            ended         INTEGER DEFAULT 0,
            created_at    TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_giveaways_active ON giveaways(ended, ends_at);

        CREATE TABLE IF NOT EXISTS custom_commands (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            name          TEXT NOT NULL,
            response      TEXT NOT NULL,
            description   TEXT DEFAULT 'A custom command',
            created_by    TEXT NOT NULL,
            uses          INTEGER DEFAULT 0,
            created_at    TEXT DEFAULT (datetime('now')),
            UNIQUE(guild_id, name)
        );

        CREATE TABLE IF NOT EXISTS reminders (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            channel_id    TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            message       TEXT NOT NULL,
            remind_at     TEXT NOT NULL,
            completed     INTEGER DEFAULT 0,
            created_at    TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(completed, remind_at);
    `);
}

module.exports = { runMigrations };
