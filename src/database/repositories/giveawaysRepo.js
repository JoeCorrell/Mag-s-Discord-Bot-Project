module.exports = function (db) {
    const stmts = {
        create: db.prepare('INSERT INTO giveaways (guild_id, channel_id, message_id, host_id, prize, winners_count, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
        getById: db.prepare('SELECT * FROM giveaways WHERE id = ?'),
        getByMessage: db.prepare('SELECT * FROM giveaways WHERE message_id = ?'),
        getActive: db.prepare("SELECT * FROM giveaways WHERE ended = 0"),
        getExpired: db.prepare("SELECT * FROM giveaways WHERE ended = 0 AND ends_at <= datetime('now')"),
        getByGuild: db.prepare('SELECT * FROM giveaways WHERE guild_id = ? AND ended = 0 ORDER BY ends_at ASC'),
        end: db.prepare('UPDATE giveaways SET ended = 1 WHERE id = ?'),
        addEntry: db.prepare('UPDATE giveaways SET entries = ? WHERE id = ?'),
    };

    return {
        create(guildId, channelId, messageId, hostId, prize, winnersCount, endsAt) {
            return stmts.create.run(guildId, channelId, messageId, hostId, prize, winnersCount, endsAt);
        },

        getById(id) {
            return stmts.getById.get(id);
        },

        getByMessage(messageId) {
            return stmts.getByMessage.get(messageId);
        },

        getActive() {
            return stmts.getActive.all();
        },

        getExpired() {
            return stmts.getExpired.all();
        },

        getByGuild(guildId) {
            return stmts.getByGuild.all(guildId);
        },

        end(id) {
            return stmts.end.run(id);
        },

        addEntry(id, userId) {
            const giveaway = stmts.getById.get(id);
            if (!giveaway) return false;
            const entries = JSON.parse(giveaway.entries);
            if (entries.includes(userId)) return false;
            entries.push(userId);
            stmts.addEntry.run(JSON.stringify(entries), id);
            return true;
        },

        removeEntry(id, userId) {
            const giveaway = stmts.getById.get(id);
            if (!giveaway) return false;
            const entries = JSON.parse(giveaway.entries).filter(e => e !== userId);
            stmts.addEntry.run(JSON.stringify(entries), id);
            return true;
        },
    };
};
