module.exports = function (db) {
    const stmts = {
        getUser: db.prepare('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?'),
        upsertXP: db.prepare(`
            INSERT INTO user_levels (guild_id, user_id, xp, total_xp, messages, last_xp_at)
            VALUES (?, ?, ?, ?, 1, datetime('now'))
            ON CONFLICT(guild_id, user_id) DO UPDATE SET
                xp = xp + excluded.xp,
                total_xp = total_xp + excluded.xp,
                messages = messages + 1,
                last_xp_at = datetime('now')
        `),
        setLevel: db.prepare('UPDATE user_levels SET level = ?, xp = ? WHERE guild_id = ? AND user_id = ?'),
        getLeaderboard: db.prepare('SELECT * FROM user_levels WHERE guild_id = ? ORDER BY total_xp DESC LIMIT ? OFFSET ?'),
        getRank: db.prepare(`
            SELECT COUNT(*) + 1 as rank FROM user_levels
            WHERE guild_id = ? AND total_xp > (
                SELECT COALESCE(total_xp, 0) FROM user_levels WHERE guild_id = ? AND user_id = ?
            )
        `),
        getRewards: db.prepare('SELECT * FROM level_rewards WHERE guild_id = ? ORDER BY level ASC'),
        addReward: db.prepare('INSERT OR REPLACE INTO level_rewards (guild_id, level, role_id) VALUES (?, ?, ?)'),
        removeReward: db.prepare('DELETE FROM level_rewards WHERE guild_id = ? AND level = ?'),
        getRewardForLevel: db.prepare('SELECT * FROM level_rewards WHERE guild_id = ? AND level = ?'),
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM user_levels WHERE guild_id = ?'),
    };

    return {
        getUser(guildId, userId) {
            return stmts.getUser.get(guildId, userId);
        },

        addXP(guildId, userId, amount) {
            return stmts.upsertXP.run(guildId, userId, amount, amount);
        },

        setLevel(guildId, userId, level, remainingXP) {
            return stmts.setLevel.run(level, remainingXP, guildId, userId);
        },

        getLeaderboard(guildId, page = 1, limit = 10) {
            return stmts.getLeaderboard.all(guildId, limit, (page - 1) * limit);
        },

        getRank(guildId, userId) {
            return stmts.getRank.get(guildId, guildId, userId)?.rank || 0;
        },

        getRewards(guildId) {
            return stmts.getRewards.all(guildId);
        },

        addReward(guildId, level, roleId) {
            return stmts.addReward.run(guildId, level, roleId);
        },

        removeReward(guildId, level) {
            return stmts.removeReward.run(guildId, level);
        },

        getRewardForLevel(guildId, level) {
            return stmts.getRewardForLevel.get(guildId, level);
        },

        totalUsers(guildId) {
            return stmts.totalUsers.get(guildId).count;
        },
    };
};
