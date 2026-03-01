module.exports = function (db) {
    const stmts = {
        add: db.prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)'),
        getByUser: db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC'),
        getById: db.prepare('SELECT * FROM warnings WHERE id = ? AND guild_id = ?'),
        deleteOne: db.prepare('DELETE FROM warnings WHERE id = ? AND guild_id = ?'),
        clearUser: db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?'),
        count: db.prepare('SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?'),
    };

    return {
        add(guildId, userId, moderatorId, reason) {
            return stmts.add.run(guildId, userId, moderatorId, reason || 'No reason provided');
        },

        getByUser(guildId, userId) {
            return stmts.getByUser.all(guildId, userId);
        },

        getById(id, guildId) {
            return stmts.getById.get(id, guildId);
        },

        delete(id, guildId) {
            return stmts.deleteOne.run(id, guildId);
        },

        clearUser(guildId, userId) {
            return stmts.clearUser.run(guildId, userId);
        },

        count(guildId, userId) {
            return stmts.count.get(guildId, userId).count;
        },
    };
};
