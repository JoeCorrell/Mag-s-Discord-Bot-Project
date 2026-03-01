const logger = require('../../utils/logger');

module.exports = {
    name: 'guildDelete',
    once: false,
    execute(guild, client) {
        logger.info(`Left guild: ${guild.name} (${guild.id})`);
    },
};
