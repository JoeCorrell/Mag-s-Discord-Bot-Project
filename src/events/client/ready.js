const { ActivityType, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

const TICKET_PROMPT_CHANNEL = '1471651265170903272';
const MOD_CHECK_CHANNEL = '1479563524731572354';
const RULES_CHANNEL = '1479020083035508746';

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        logger.success(`Logged in as ${client.user.tag}`);
        logger.info(`Serving ${client.guilds.cache.size} guilds`);

        client.user.setPresence({
            activities: [{ name: 'Trying to recover my tombstone', type: ActivityType.Playing }],
            status: 'online',
        });

        // Send persistent ticket panel
        try {
            const channel = await client.channels.fetch(TICKET_PROMPT_CHANNEL);
            if (channel) {
                // Remove old panels and send fresh one
                const messages = await channel.messages.fetch({ limit: 10 });
                const oldPanels = messages.filter(m => m.author.id === client.user.id && m.components.length > 0);
                for (const [, msg] of oldPanels) {
                    await msg.delete().catch(() => {});
                }

                {
                    const embed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setTitle('\uD83C\uDFAB Open a Ticket')
                        .setDescription('Need help or want to report something?\nSelect a category below to open a ticket.')
                        .addFields(
                            { name: '\uD83D\uDEE0\uFE0F Support', value: 'Get help from our team', inline: true },
                            { name: '\uD83D\uDC1B Bug Report', value: 'Report a bug or issue', inline: true },
                            { name: '\uD83D\uDCA1 Suggestion', value: 'Share an idea with us', inline: true },
                            { name: '\uD83E\uDDE9 Mod Idea', value: 'Suggest a mod for the server', inline: true },
                        )
                        .setFooter({ text: 'Our team will respond as soon as possible.' });

                    const row = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('ticket-type')
                            .setPlaceholder('Select a ticket type...')
                            .addOptions(
                                { label: 'Support', description: 'Get help from our team', value: 'support', emoji: '\uD83D\uDEE0\uFE0F' },
                                { label: 'Bug Report', description: 'Report a bug or issue', value: 'bug', emoji: '\uD83D\uDC1B' },
                                { label: 'Suggestion', description: 'Share an idea with us', value: 'suggestion', emoji: '\uD83D\uDCA1' },
                                { label: 'Mod Idea', description: 'Suggest a mod for the server', value: 'modidea', emoji: '\uD83E\uDDE9' },
                            ),
                    );

                    await channel.send({ embeds: [embed], components: [row] });
                    logger.info('Ticket panel sent to #tickets');
                }
            }
        } catch (err) {
            logger.warn(`Could not send ticket panel: ${err.message}`);
        }

        // Send rules & verification panel
        try {
            const rulesChannel = await client.channels.fetch(RULES_CHANNEL);
            if (rulesChannel) {
                const messages = await rulesChannel.messages.fetch({ limit: 10 });
                const oldPanels = messages.filter(m => m.author.id === client.user.id);
                for (const [, msg] of oldPanels) {
                    await msg.delete().catch(() => {});
                }

                const rulesEmbed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('\uD83D\uDCDC Server Rules')
                    .setDescription('Please read and follow these rules to keep our community a great place for everyone.')
                    .addFields(
                        { name: '1. Be Respectful', value: 'Treat everyone with respect. No harassment, hate speech, or personal attacks.' },
                        { name: '2. No Spam', value: 'Don\'t spam messages, emojis, or links. Keep conversations on topic.' },
                        { name: '3. No NSFW Content', value: 'Keep all content appropriate. No explicit or offensive material.' },
                        { name: '4. No Self-Promotion', value: 'Don\'t advertise servers, streams, or products without permission.' },
                        { name: '5. Use Proper Channels', value: 'Post content in the appropriate channels. Use tickets for bug reports.' },
                        { name: '6. Listen to Staff', value: 'Follow instructions from admins and moderators. Their word is final.' },
                        { name: '7. Have Fun!', value: 'We\'re here to enjoy ourselves. Be a good community member!' },
                    )
                    .setFooter({ text: 'Breaking rules may result in warnings, mutes, or bans.' });

                await rulesChannel.send({ embeds: [rulesEmbed] });

                // Ticket prompt
                const ticketEmbed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('\uD83C\uDFAB Open a Ticket')
                    .setDescription('Need help or want to report something?\nSelect a category below to open a ticket.')
                    .addFields(
                        { name: '\uD83D\uDEE0\uFE0F Support', value: 'Get help from our team', inline: true },
                        { name: '\uD83D\uDC1B Bug Report', value: 'Report a bug or issue', inline: true },
                        { name: '\uD83D\uDCA1 Suggestion', value: 'Share an idea with us', inline: true },
                        { name: '\uD83E\uDDE9 Mod Idea', value: 'Suggest a mod for the server', inline: true },
                    )
                    .setFooter({ text: 'Our team will respond as soon as possible.' });

                const ticketRow = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket-type')
                        .setPlaceholder('Select a ticket type...')
                        .addOptions(
                            { label: 'Support', description: 'Get help from our team', value: 'support', emoji: '\uD83D\uDEE0\uFE0F' },
                            { label: 'Bug Report', description: 'Report a bug or issue', value: 'bug', emoji: '\uD83D\uDC1B' },
                            { label: 'Suggestion', description: 'Share an idea with us', value: 'suggestion', emoji: '\uD83D\uDCA1' },
                            { label: 'Mod Idea', description: 'Suggest a mod for the server', value: 'modidea', emoji: '\uD83E\uDDE9' },
                        ),
                );

                await rulesChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });

                // Verify to chat (last, so it's at the bottom)
                const verifyEmbed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('\u2705 Verify to Chat')
                    .setDescription('React with \u2705 below to accept the rules and get the **Member** role so you can start chatting!');

                const verifyMsg = await rulesChannel.send({ embeds: [verifyEmbed] });
                await verifyMsg.react('\u2705');

                client.rulesMessageId = verifyMsg.id;
                logger.info('Rules & verification panel sent');
            }
        } catch (err) {
            logger.warn(`Could not send rules panel: ${err.message}`);
        }

        // Send mod compatibility check prompt
        try {
            const modChannel = await client.channels.fetch(MOD_CHECK_CHANNEL);
            if (modChannel) {
                const messages = await modChannel.messages.fetch({ limit: 10 });
                const hasPrompt = messages.some(m => m.author.id === client.user.id && m.embeds.length > 0);

                if (!hasPrompt) {
                    const embed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setTitle('\uD83D\uDD0D Mod Compatibility Checker')
                        .setDescription('Want to know if a mod is compatible with our server?\n\n**Type a mod name** below and I\'ll check it against our list of tested mods.')
                        .addFields({ name: 'Example', value: '`XPortal`\n`Seasons`\n`AdventureBackpacks`' })
                        .setFooter({ text: 'Mods not on the list may still work, but haven\'t been tested.' });

                    await modChannel.send({ embeds: [embed] });
                    logger.info('Mod check prompt sent');
                }
            }
        } catch (err) {
            logger.warn(`Could not send mod check prompt: ${err.message}`);
        }
    },
};
