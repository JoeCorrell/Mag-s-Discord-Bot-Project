module.exports = function (db) {
    const stmts = {
        get: db.prepare('SELECT * FROM economy_users WHERE guild_id = ? AND user_id = ?'),
        ensure: db.prepare('INSERT OR IGNORE INTO economy_users (guild_id, user_id) VALUES (?, ?)'),
        updateWallet: db.prepare('UPDATE economy_users SET wallet = wallet + ? WHERE guild_id = ? AND user_id = ?'),
        setWallet: db.prepare('UPDATE economy_users SET wallet = ? WHERE guild_id = ? AND user_id = ?'),
        updateBank: db.prepare('UPDATE economy_users SET bank = bank + ? WHERE guild_id = ? AND user_id = ?'),
        setBank: db.prepare('UPDATE economy_users SET bank = ? WHERE guild_id = ? AND user_id = ?'),
        setLastDaily: db.prepare("UPDATE economy_users SET last_daily = datetime('now') WHERE guild_id = ? AND user_id = ?"),
        setLastWork: db.prepare("UPDATE economy_users SET last_work = datetime('now') WHERE guild_id = ? AND user_id = ?"),
        setLastRob: db.prepare("UPDATE economy_users SET last_rob = datetime('now') WHERE guild_id = ? AND user_id = ?"),
        leaderboard: db.prepare('SELECT * FROM economy_users WHERE guild_id = ? ORDER BY (wallet + bank) DESC LIMIT ? OFFSET ?'),
    };

    const transfer = db.transaction((guildId, fromId, toId, amount) => {
        stmts.ensure.run(guildId, fromId);
        stmts.ensure.run(guildId, toId);
        stmts.updateWallet.run(-amount, guildId, fromId);
        stmts.updateWallet.run(amount, guildId, toId);
    });

    return {
        getAccount(guildId, userId) {
            stmts.ensure.run(guildId, userId);
            return stmts.get.get(guildId, userId);
        },

        addToWallet(guildId, userId, amount) {
            stmts.ensure.run(guildId, userId);
            return stmts.updateWallet.run(amount, guildId, userId);
        },

        setWallet(guildId, userId, amount) {
            stmts.ensure.run(guildId, userId);
            return stmts.setWallet.run(amount, guildId, userId);
        },

        addToBank(guildId, userId, amount) {
            stmts.ensure.run(guildId, userId);
            return stmts.updateBank.run(amount, guildId, userId);
        },

        setBank(guildId, userId, amount) {
            stmts.ensure.run(guildId, userId);
            return stmts.setBank.run(amount, guildId, userId);
        },

        deposit(guildId, userId, amount) {
            stmts.ensure.run(guildId, userId);
            const account = stmts.get.get(guildId, userId);
            const space = account.bank_capacity - account.bank;
            const depositAmount = Math.min(amount, account.wallet, space);
            if (depositAmount <= 0) return 0;
            stmts.updateWallet.run(-depositAmount, guildId, userId);
            stmts.updateBank.run(depositAmount, guildId, userId);
            return depositAmount;
        },

        withdraw(guildId, userId, amount) {
            stmts.ensure.run(guildId, userId);
            const account = stmts.get.get(guildId, userId);
            const withdrawAmount = Math.min(amount, account.bank);
            if (withdrawAmount <= 0) return 0;
            stmts.updateBank.run(-withdrawAmount, guildId, userId);
            stmts.updateWallet.run(withdrawAmount, guildId, userId);
            return withdrawAmount;
        },

        transfer(guildId, fromId, toId, amount) {
            return transfer(guildId, fromId, toId, amount);
        },

        setLastDaily(guildId, userId) {
            return stmts.setLastDaily.run(guildId, userId);
        },

        setLastWork(guildId, userId) {
            return stmts.setLastWork.run(guildId, userId);
        },

        setLastRob(guildId, userId) {
            return stmts.setLastRob.run(guildId, userId);
        },

        getLeaderboard(guildId, page = 1, limit = 10) {
            return stmts.leaderboard.all(guildId, limit, (page - 1) * limit);
        },
    };
};
