const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');

    if (!fs.existsSync(commandsPath)) return;

    const categoryFolders = fs.readdirSync(commandsPath).filter(f =>
        fs.statSync(path.join(commandsPath, f)).isDirectory()
    );

    for (const folder of categoryFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);

            if (!command.data || !command.execute) {
                logger.warn(`Skipping ${file}: missing "data" or "execute" export`);
                continue;
            }

            command.category = folder;
            client.commands.set(command.data.name, command);
        }
    }

    logger.success(`Loaded ${client.commands.size} commands`);
}

module.exports = { loadCommands };
