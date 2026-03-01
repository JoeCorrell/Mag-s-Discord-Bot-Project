module.exports = function (db) {
    const stmts = {
        create: db.prepare('INSERT INTO tickets (guild_id, channel_id, user_id, ticket_number, category, reason) VALUES (?, ?, ?, ?, ?, ?)'),
        getByChannel: db.prepare('SELECT * FROM tickets WHERE channel_id = ?'),
        getOpenByUser: db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status != 'closed'"),
        close: db.prepare("UPDATE tickets SET status = 'closed', closed_at = datetime('now') WHERE channel_id = ?"),
        claim: db.prepare("UPDATE tickets SET status = 'claimed', claimed_by = ? WHERE channel_id = ?"),
        incrementCounter: db.prepare('UPDATE guild_settings SET ticket_counter = ticket_counter + 1 WHERE guild_id = ?'),
        getCounter: db.prepare('SELECT ticket_counter FROM guild_settings WHERE guild_id = ?'),
        createPanel: db.prepare('INSERT INTO ticket_panels (guild_id, channel_id, message_id, title, description, categories) VALUES (?, ?, ?, ?, ?, ?)'),
        getPanel: db.prepare('SELECT * FROM ticket_panels WHERE message_id = ?'),
    };

    return {
        create(guildId, channelId, userId, ticketNumber, category, reason) {
            return stmts.create.run(guildId, channelId, userId, ticketNumber, category || 'general', reason || null);
        },

        getByChannel(channelId) {
            return stmts.getByChannel.get(channelId);
        },

        getOpenByUser(guildId, userId) {
            return stmts.getOpenByUser.all(guildId, userId);
        },

        close(channelId) {
            return stmts.close.run(channelId);
        },

        claim(channelId, moderatorId) {
            return stmts.claim.run(moderatorId, channelId);
        },

        getNextNumber(guildId) {
            stmts.incrementCounter.run(guildId);
            return stmts.getCounter.get(guildId).ticket_counter;
        },

        createPanel(guildId, channelId, messageId, title, description, categories) {
            return stmts.createPanel.run(guildId, channelId, messageId, title, description, JSON.stringify(categories));
        },

        getPanel(messageId) {
            return stmts.getPanel.get(messageId);
        },
    };
};
