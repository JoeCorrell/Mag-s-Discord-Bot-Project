const { Client, Collection } = require('discord.js');
const { intents, partials } = require('../../config/intents');

class ExtendedClient extends Client {
    constructor() {
        super({ intents, partials });

        this.commands = new Collection();
        this.cooldowns = new Collection();
        this.buttons = new Collection();
        this.selectMenus = new Collection();
        this.modals = new Collection();
        this.db = null;
    }
}

module.exports = ExtendedClient;
