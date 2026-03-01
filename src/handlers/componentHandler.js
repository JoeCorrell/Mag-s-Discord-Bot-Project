const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadComponents(client) {
    const componentsPath = path.join(__dirname, '..', 'components');

    if (!fs.existsSync(componentsPath)) return;

    const types = [
        { folder: 'buttons', collection: 'buttons' },
        { folder: 'selectMenus', collection: 'selectMenus' },
        { folder: 'modals', collection: 'modals' },
    ];

    let count = 0;

    for (const type of types) {
        const typePath = path.join(componentsPath, type.folder);
        if (!fs.existsSync(typePath)) continue;

        const files = fs.readdirSync(typePath).filter(f => f.endsWith('.js'));

        for (const file of files) {
            const component = require(path.join(typePath, file));

            if (!component.customId || !component.execute) {
                logger.warn(`Skipping component ${file}: missing "customId" or "execute"`);
                continue;
            }

            client[type.collection].set(component.customId, component);
            count++;
        }
    }

    logger.success(`Loaded ${count} components`);
}

module.exports = { loadComponents };
