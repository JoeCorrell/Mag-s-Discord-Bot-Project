require('dotenv').config();

const ExtendedClient = require('./src/structures/ExtendedClient');
const db = require('./src/database/database');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');
const { loadComponents } = require('./src/handlers/componentHandler');
const logger = require('./src/utils/logger');

const client = new ExtendedClient();
client.db = db;

loadCommands(client);
loadEvents(client);
loadComponents(client);

// Reminder checker - runs every 15 seconds
setInterval(async () => {
    try {
        const pending = client.db.reminders.getPending();
        for (const reminder of pending) {
            try {
                const channel = await client.channels.fetch(reminder.channel_id).catch(() => null);
                if (channel) {
                    await channel.send(`<@${reminder.user_id}> **Reminder:** ${reminder.message}`);
                }
                client.db.reminders.markCompleted(reminder.id);
            } catch (err) {
                logger.error(`Failed to send reminder ${reminder.id}:`, err);
                client.db.reminders.markCompleted(reminder.id);
            }
        }
    } catch (err) {
        logger.error('Reminder check failed:', err);
    }
}, 15000);

// Giveaway checker - runs every 15 seconds
setInterval(async () => {
    try {
        const expired = client.db.giveaways.getExpired();
        for (const giveaway of expired) {
            try {
                const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
                if (!channel) {
                    client.db.giveaways.end(giveaway.id);
                    continue;
                }

                const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
                const entries = JSON.parse(giveaway.entries);
                const winners = [];

                const shuffled = entries.sort(() => Math.random() - 0.5);
                for (let i = 0; i < Math.min(giveaway.winners_count, shuffled.length); i++) {
                    winners.push(shuffled[i]);
                }

                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle('\uD83C\uDF89 Giveaway Ended!')
                    .setColor(0xED4245)
                    .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'No valid entries'}\n**Hosted by:** <@${giveaway.host_id}>`)
                    .setTimestamp();

                if (message) {
                    await message.edit({ embeds: [embed], components: [] }).catch(() => {});
                }

                if (winners.length > 0) {
                    await channel.send(`Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**! \uD83C\uDF89`);
                } else {
                    await channel.send(`No one entered the giveaway for **${giveaway.prize}**. \uD83D\uDE22`);
                }

                client.db.giveaways.end(giveaway.id);
            } catch (err) {
                logger.error(`Failed to end giveaway ${giveaway.id}:`, err);
                client.db.giveaways.end(giveaway.id);
            }
        }
    } catch (err) {
        logger.error('Giveaway check failed:', err);
    }
}, 15000);

// Global error handlers
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
});

client.login(process.env.BOT_TOKEN);
