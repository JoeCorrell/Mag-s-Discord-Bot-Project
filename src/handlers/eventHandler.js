const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadEvents(client) {
    const eventsPath = path.join(__dirname, '..', 'events');

    if (!fs.existsSync(eventsPath)) return;

    let count = 0;
    const categoryFolders = fs.readdirSync(eventsPath).filter(f =>
        fs.statSync(path.join(eventsPath, f)).isDirectory()
    );

    for (const folder of categoryFolders) {
        const folderPath = path.join(eventsPath, folder);
        const eventFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(folderPath, file);
            const event = require(filePath);

            if (!event.name || !event.execute) {
                logger.warn(`Skipping event ${file}: missing "name" or "execute" export`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            count++;
        }
    }

    logger.success(`Loaded ${count} events`);
}

module.exports = { loadEvents };
