module.exports = function (db) {
    const stmts = {
        add: db.prepare('INSERT OR REPLACE INTO thunderstore_mods (guild_id, mod_name, channel_id, last_version, enabled) VALUES (?, ?, ?, ?, 1)'),
        remove: db.prepare('DELETE FROM thunderstore_mods WHERE guild_id = ? AND mod_name = ?'),
        getByGuild: db.prepare('SELECT * FROM thunderstore_mods WHERE guild_id = ?'),
        getActive: db.prepare('SELECT * FROM thunderstore_mods WHERE enabled = 1'),
        get: db.prepare('SELECT * FROM thunderstore_mods WHERE guild_id = ? AND mod_name = ?'),
        updateVersion: db.prepare('UPDATE thunderstore_mods SET last_version = ? WHERE id = ?'),
        updateChannel: db.prepare('UPDATE thunderstore_mods SET channel_id = ? WHERE guild_id = ? AND mod_name = ?'),
    };

    return {
        add(guildId, modName, channelId, currentVersion) {
            return stmts.add.run(guildId, modName, channelId, currentVersion);
        },

        remove(guildId, modName) {
            return stmts.remove.run(guildId, modName);
        },

        get(guildId, modName) {
            return stmts.get.get(guildId, modName);
        },

        getByGuild(guildId) {
            return stmts.getByGuild.all(guildId);
        },

        getActive() {
            return stmts.getActive.all();
        },

        updateVersion(id, version) {
            return stmts.updateVersion.run(version, id);
        },

        updateChannel(guildId, modName, channelId) {
            return stmts.updateChannel.run(channelId, guildId, modName);
        },
    };
};
