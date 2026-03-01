require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

const categoryFolders = fs.readdirSync(commandsPath).filter(f =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
);

for (const folder of categoryFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(folderPath, file));
        if (command.data) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        logger.info(`Deploying ${commands.length} commands...`);

        const isGlobal = process.argv.includes('--global');

        if (isGlobal) {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            logger.success(`Deployed ${commands.length} commands globally`);
        } else {
            if (!process.env.GUILD_ID) {
                logger.error('GUILD_ID is required for guild deployment. Use --global for global deployment.');
                process.exit(1);
            }
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            logger.success(`Deployed ${commands.length} commands to guild ${process.env.GUILD_ID}`);
        }
    } catch (error) {
        logger.error('Failed to deploy commands:', error);
    }
})();
