module.exports = function (db) {
    const stmts = {
        add: db.prepare('INSERT INTO mod_logs (guild_id, user_id, moderator_id, action, reason, duration) VALUES (?, ?, ?, ?, ?, ?)'),
        getByUser: db.prepare('SELECT * FROM mod_logs WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC'),
        getByGuild: db.prepare('SELECT * FROM mod_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'),
        getById: db.prepare('SELECT * FROM mod_logs WHERE id = ? AND guild_id = ?'),
        count: db.prepare('SELECT COUNT(*) as count FROM mod_logs WHERE guild_id = ?'),
    };

    return {
        add(guildId, userId, moderatorId, action, reason, duration) {
            return stmts.add.run(guildId, userId, moderatorId, action, reason || 'No reason provided', duration || null);
        },

        getByUser(guildId, userId) {
            return stmts.getByUser.all(guildId, userId);
        },

        getByGuild(guildId, page = 1, limit = 10) {
            return stmts.getByGuild.all(guildId, limit, (page - 1) * limit);
        },

        getById(id, guildId) {
            return stmts.getById.get(id, guildId);
        },

        count(guildId) {
            return stmts.count.get(guildId).count;
        },
    };
};
