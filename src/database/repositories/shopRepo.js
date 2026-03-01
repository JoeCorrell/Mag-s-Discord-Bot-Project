module.exports = function (db) {
    const stmts = {
        getItems: db.prepare('SELECT * FROM shop_items WHERE guild_id = ? ORDER BY price ASC'),
        getItem: db.prepare('SELECT * FROM shop_items WHERE id = ? AND guild_id = ?'),
        getItemByName: db.prepare('SELECT * FROM shop_items WHERE guild_id = ? AND name = ?'),
        addItem: db.prepare('INSERT INTO shop_items (guild_id, name, description, price, role_id, emoji) VALUES (?, ?, ?, ?, ?, ?)'),
        removeItem: db.prepare('DELETE FROM shop_items WHERE id = ? AND guild_id = ?'),
        getInventory: db.prepare(`
            SELECT ui.*, si.name, si.description, si.emoji, si.role_id
            FROM user_inventory ui
            JOIN shop_items si ON ui.item_id = si.id
            WHERE ui.guild_id = ? AND ui.user_id = ?
        `),
        addToInventory: db.prepare(`
            INSERT INTO user_inventory (guild_id, user_id, item_id, quantity)
            VALUES (?, ?, ?, 1)
            ON CONFLICT(guild_id, user_id, item_id) DO UPDATE SET quantity = quantity + 1
        `),
        countItems: db.prepare('SELECT COUNT(*) as count FROM shop_items WHERE guild_id = ?'),
    };

    return {
        getItems(guildId) {
            return stmts.getItems.all(guildId);
        },

        getItem(id, guildId) {
            return stmts.getItem.get(id, guildId);
        },

        getItemByName(guildId, name) {
            return stmts.getItemByName.get(guildId, name);
        },

        addItem(guildId, name, description, price, roleId, emoji) {
            return stmts.addItem.run(guildId, name, description, price, roleId || null, emoji || ':package:');
        },

        removeItem(id, guildId) {
            return stmts.removeItem.run(id, guildId);
        },

        getInventory(guildId, userId) {
            return stmts.getInventory.all(guildId, userId);
        },

        addToInventory(guildId, userId, itemId) {
            return stmts.addToInventory.run(guildId, userId, itemId);
        },

        countItems(guildId) {
            return stmts.countItems.get(guildId).count;
        },
    };
};
