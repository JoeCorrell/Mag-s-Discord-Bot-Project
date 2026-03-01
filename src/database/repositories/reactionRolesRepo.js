module.exports = function (db) {
    const stmts = {
        add: db.prepare('INSERT OR REPLACE INTO reaction_roles (guild_id, channel_id, message_id, role_id, emoji, button_label, button_style, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
        remove: db.prepare('DELETE FROM reaction_roles WHERE message_id = ? AND role_id = ?'),
        getForMessage: db.prepare('SELECT * FROM reaction_roles WHERE message_id = ?'),
        getByGuild: db.prepare('SELECT * FROM reaction_roles WHERE guild_id = ?'),
        deleteMessage: db.prepare('DELETE FROM reaction_roles WHERE message_id = ?'),
    };

    return {
        add(guildId, channelId, messageId, roleId, options = {}) {
            return stmts.add.run(
                guildId, channelId, messageId, roleId,
                options.emoji || null,
                options.buttonLabel || null,
                options.buttonStyle || 'Primary',
                options.type || 'button'
            );
        },

        remove(messageId, roleId) {
            return stmts.remove.run(messageId, roleId);
        },

        getForMessage(messageId) {
            return stmts.getForMessage.all(messageId);
        },

        getByGuild(guildId) {
            return stmts.getByGuild.all(guildId);
        },

        deleteMessage(messageId) {
            return stmts.deleteMessage.run(messageId);
        },
    };
};
