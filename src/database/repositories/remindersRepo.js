module.exports = function (db) {
    const stmts = {
        create: db.prepare('INSERT INTO reminders (guild_id, channel_id, user_id, message, remind_at) VALUES (?, ?, ?, ?, ?)'),
        getPending: db.prepare("SELECT * FROM reminders WHERE completed = 0 AND remind_at <= datetime('now')"),
        markCompleted: db.prepare('UPDATE reminders SET completed = 1 WHERE id = ?'),
        getByUser: db.prepare("SELECT * FROM reminders WHERE guild_id = ? AND user_id = ? AND completed = 0 ORDER BY remind_at ASC"),
        deleteReminder: db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?'),
    };

    return {
        create(guildId, channelId, userId, message, remindAt) {
            return stmts.create.run(guildId, channelId, userId, message, remindAt);
        },

        getPending() {
            return stmts.getPending.all();
        },

        markCompleted(id) {
            return stmts.markCompleted.run(id);
        },

        getByUser(guildId, userId) {
            return stmts.getByUser.all(guildId, userId);
        },

        delete(id, userId) {
            return stmts.deleteReminder.run(id, userId);
        },
    };
};
