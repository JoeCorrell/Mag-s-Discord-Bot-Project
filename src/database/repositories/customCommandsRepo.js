module.exports = function (db) {
    const stmts = {
        create: db.prepare('INSERT INTO custom_commands (guild_id, name, response, description, created_by) VALUES (?, ?, ?, ?, ?)'),
        get: db.prepare('SELECT * FROM custom_commands WHERE guild_id = ? AND name = ?'),
        list: db.prepare('SELECT * FROM custom_commands WHERE guild_id = ? ORDER BY name ASC'),
        deleteCmd: db.prepare('DELETE FROM custom_commands WHERE guild_id = ? AND name = ?'),
        incrementUses: db.prepare('UPDATE custom_commands SET uses = uses + 1 WHERE id = ?'),
        count: db.prepare('SELECT COUNT(*) as count FROM custom_commands WHERE guild_id = ?'),
    };

    return {
        create(guildId, name, response, description, createdBy) {
            return stmts.create.run(guildId, name.toLowerCase(), response, description || 'A custom command', createdBy);
        },

        get(guildId, name) {
            return stmts.get.get(guildId, name.toLowerCase());
        },

        list(guildId) {
            return stmts.list.all(guildId);
        },

        delete(guildId, name) {
            return stmts.deleteCmd.run(guildId, name.toLowerCase());
        },

        incrementUses(id) {
            return stmts.incrementUses.run(id);
        },

        count(guildId) {
            return stmts.count.get(guildId).count;
        },
    };
};
