const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { runMigrations } = require('./migrations');

const dbPath = path.resolve(process.env.DB_PATH || './data/bot.db');
const dir = path.dirname(dbPath);

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

runMigrations(db);

db.settings = require('./repositories/guildSettingsRepo')(db);
db.warnings = require('./repositories/warningsRepo')(db);
db.modLogs = require('./repositories/modLogsRepo')(db);
db.leveling = require('./repositories/levelingRepo')(db);
db.economy = require('./repositories/economyRepo')(db);
db.shop = require('./repositories/shopRepo')(db);
db.tickets = require('./repositories/ticketsRepo')(db);
db.giveaways = require('./repositories/giveawaysRepo')(db);
db.customCommands = require('./repositories/customCommandsRepo')(db);
db.reminders = require('./repositories/remindersRepo')(db);
db.reactionRoles = require('./repositories/reactionRolesRepo')(db);

logger.success(`Database connected: ${dbPath}`);

module.exports = db;
