const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

function timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
    info(message, ...args) {
        console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.blue}[INFO]${colors.reset} ${message}`, ...args);
    },

    success(message, ...args) {
        console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}[SUCCESS]${colors.reset} ${message}`, ...args);
    },

    warn(message, ...args) {
        console.warn(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
    },

    error(message, ...args) {
        console.error(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
    },

    debug(message, ...args) {
        if (process.env.DEBUG === 'true') {
            console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.magenta}[DEBUG]${colors.reset} ${message}`, ...args);
        }
    },

    command(commandName, user, guild) {
        console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}[CMD]${colors.reset} ${commandName} by ${user} in ${guild}`);
    },
};

module.exports = logger;
