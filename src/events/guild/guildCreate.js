const logger = require('../../utils/logger');

module.exports = {
    name: 'guildCreate',
    once: false,
    execute(guild, client) {
        client.db.settings.ensureGuild(guild.id);
        logger.info(`Joined guild: ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
    },
};
