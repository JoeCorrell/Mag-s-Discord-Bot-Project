const logger = require('../../utils/logger');

module.exports = {
    name: 'warn',
    once: false,
    execute(info) {
        logger.warn('Client warning:', info);
    },
};
