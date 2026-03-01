const logger = require('../../utils/logger');
const { checkCooldown } = require('../../utils/cooldowns');
const { errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        // Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            // Check if module is enabled
            const moduleColumn = config.modules[command.category];
            if (moduleColumn) {
                const settings = client.db.settings.getSettings(interaction.guild.id);
                if (!settings[moduleColumn]) {
                    return interaction.reply({
                        embeds: [errorEmbed('Module Disabled', `The **${command.category}** module is disabled on this server.\nAn admin can enable it with \`/settings module\`.`)],
                        ephemeral: true,
                    });
                }
            }

            // Check cooldown
            const cooldownMessage = checkCooldown(client, interaction, command);
            if (cooldownMessage) {
                return interaction.reply({ content: cooldownMessage, ephemeral: true });
            }

            // Check permissions
            if (command.permissions && interaction.guild) {
                const missing = command.permissions.filter(p => !interaction.member.permissions.has(p));
                if (missing.length > 0) {
                    return interaction.reply({
                        embeds: [errorEmbed('Missing Permissions', 'You do not have the required permissions to use this command.')],
                        ephemeral: true,
                    });
                }
            }

            try {
                logger.command(interaction.commandName, interaction.user.tag, interaction.guild?.name || 'DM');
                await command.execute(interaction, client);
            } catch (error) {
                logger.error(`Command ${interaction.commandName} failed:`, error);
                const reply = {
                    embeds: [errorEmbed('Error', 'An error occurred while executing this command.')],
                    ephemeral: true,
                };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply).catch(() => {});
                } else {
                    await interaction.reply(reply).catch(() => {});
                }
            }
        }

        // Autocomplete
        else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (command?.autocomplete) {
                try {
                    await command.autocomplete(interaction, client);
                } catch (error) {
                    logger.error(`Autocomplete ${interaction.commandName} failed:`, error);
                }
            }
        }

        // Buttons
        else if (interaction.isButton()) {
            const button = client.buttons.get(interaction.customId);
            if (button) {
                try {
                    await button.execute(interaction, client);
                } catch (error) {
                    logger.error(`Button ${interaction.customId} failed:`, error);
                }
                return;
            }

            // Handle dynamic button IDs (e.g., "rr-toggle-123456")
            for (const [id, handler] of client.buttons) {
                if (interaction.customId.startsWith(id)) {
                    try {
                        await handler.execute(interaction, client);
                    } catch (error) {
                        logger.error(`Button ${interaction.customId} failed:`, error);
                    }
                    return;
                }
            }
        }

        // Select Menus
        else if (interaction.isStringSelectMenu()) {
            const menu = client.selectMenus.get(interaction.customId);
            if (menu) {
                try {
                    await menu.execute(interaction, client);
                } catch (error) {
                    logger.error(`Select menu ${interaction.customId} failed:`, error);
                }
                return;
            }

            for (const [id, handler] of client.selectMenus) {
                if (interaction.customId.startsWith(id)) {
                    try {
                        await handler.execute(interaction, client);
                    } catch (error) {
                        logger.error(`Select menu ${interaction.customId} failed:`, error);
                    }
                    return;
                }
            }
        }

        // Modal Submissions
        else if (interaction.isModalSubmit()) {
            const modal = client.modals.get(interaction.customId);
            if (modal) {
                try {
                    await modal.execute(interaction, client);
                } catch (error) {
                    logger.error(`Modal ${interaction.customId} failed:`, error);
                }
                return;
            }

            for (const [id, handler] of client.modals) {
                if (interaction.customId.startsWith(id)) {
                    try {
                        await handler.execute(interaction, client);
                    } catch (error) {
                        logger.error(`Modal ${interaction.customId} failed:`, error);
                    }
                    return;
                }
            }
        }
    },
};
