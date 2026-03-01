module.exports = function (db) {
    const stmts = {
        get: db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?'),
        insert: db.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)'),
        update: db.prepare('UPDATE guild_settings SET updated_at = datetime(\'now\') WHERE guild_id = ?'),
    };

    return {
        ensureGuild(guildId) {
            stmts.insert.run(guildId);
        },

        getSettings(guildId) {
            this.ensureGuild(guildId);
            return stmts.get.get(guildId);
        },

        updateSetting(guildId, key, value) {
            this.ensureGuild(guildId);
            const stmt = db.prepare(`UPDATE guild_settings SET ${key} = ?, updated_at = datetime('now') WHERE guild_id = ?`);
            return stmt.run(value, guildId);
        },

        updateSettings(guildId, settings) {
            this.ensureGuild(guildId);
            const keys = Object.keys(settings);
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = keys.map(k => settings[k]);
            const stmt = db.prepare(`UPDATE guild_settings SET ${setClause}, updated_at = datetime('now') WHERE guild_id = ?`);
            return stmt.run(...values, guildId);
        },

        deleteGuild(guildId) {
            db.prepare('DELETE FROM guild_settings WHERE guild_id = ?').run(guildId);
        },
    };
};
