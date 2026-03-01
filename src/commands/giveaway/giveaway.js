const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { parseDuration, formatDuration } = require('../../utils/time');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Start a new giveaway')
                .addStringOption(opt => opt.setName('prize').setDescription('The prize').setRequired(true))
                .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 1h, 1d, 7d)').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners (default 1)').setMinValue(1).setMaxValue(20)))
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('End a giveaway early')
                .addStringOption(opt => opt.setName('message-id').setDescription('The giveaway message ID').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Reroll winners for an ended giveaway')
                .addStringOption(opt => opt.setName('message-id').setDescription('The giveaway message ID').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List active giveaways')),
    cooldown: 10,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'start') {
            const prize = interaction.options.getString('prize');
            const durationStr = interaction.options.getString('duration');
            const winners = interaction.options.getInteger('winners') || 1;

            const duration = parseDuration(durationStr);
            if (!duration || duration < 60000) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Duration must be at least 1 minute.')], ephemeral: true });
            }

            if (duration > config.limits.giveawayMaxDuration) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Duration cannot exceed 30 days.')], ephemeral: true });
            }

            const endsAt = new Date(Date.now() + duration);

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('\uD83C\uDF89 GIVEAWAY')
                .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n**Hosted by:** ${interaction.user}\n\nClick the button to enter!`)
                .setTimestamp(endsAt);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('giveaway-enter')
                    .setLabel('Enter Giveaway')
                    .setEmoji('\uD83C\uDF89')
                    .setStyle(ButtonStyle.Success),
            );

            const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

            const endsAtStr = endsAt.toISOString().replace('T', ' ').substring(0, 19);
            client.db.giveaways.create(interaction.guild.id, interaction.channel.id, msg.id, interaction.user.id, prize, winners, endsAtStr);

            return interaction.reply({ embeds: [successEmbed('Giveaway Started', `Giveaway for **${prize}** started! Ends in **${formatDuration(duration)}**.`)], ephemeral: true });
        }

        if (sub === 'end') {
            const messageId = interaction.options.getString('message-id');
            const giveaway = client.db.giveaways.getByMessage(messageId);

            if (!giveaway || giveaway.guild_id !== interaction.guild.id) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Giveaway not found.')], ephemeral: true });
            }

            if (giveaway.ended) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'This giveaway has already ended.')], ephemeral: true });
            }

            // Force end by updating ends_at to now
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
            client.db.giveaways.end(giveaway.id);

            const entries = JSON.parse(giveaway.entries);
            const winners = [];
            const shuffled = entries.sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(giveaway.winners_count, shuffled.length); i++) {
                winners.push(shuffled[i]);
            }

            const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
            if (message) {
                const embed = new EmbedBuilder()
                    .setTitle('\uD83C\uDF89 Giveaway Ended!')
                    .setColor(0xED4245)
                    .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'No entries'}\n**Hosted by:** <@${giveaway.host_id}>`)
                    .setTimestamp();

                await message.edit({ embeds: [embed], components: [] });
            }

            if (winners.length > 0) {
                await interaction.channel.send(`Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**! \uD83C\uDF89`);
            }

            return interaction.reply({ embeds: [successEmbed('Giveaway Ended', `The giveaway for **${giveaway.prize}** has been ended.`)], ephemeral: true });
        }

        if (sub === 'reroll') {
            const messageId = interaction.options.getString('message-id');
            const giveaway = client.db.giveaways.getByMessage(messageId);

            if (!giveaway || !giveaway.ended) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Ended giveaway not found.')], ephemeral: true });
            }

            const entries = JSON.parse(giveaway.entries);
            if (entries.length === 0) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'No entries to reroll from.')], ephemeral: true });
            }

            const winner = entries[Math.floor(Math.random() * entries.length)];
            await interaction.channel.send(`\uD83C\uDF89 New winner: <@${winner}>! Congratulations, you won **${giveaway.prize}**!`);

            return interaction.reply({ embeds: [successEmbed('Rerolled', `New winner selected for **${giveaway.prize}**.`)], ephemeral: true });
        }

        if (sub === 'list') {
            const giveaways = client.db.giveaways.getByGuild(interaction.guild.id);

            if (giveaways.length === 0) {
                return interaction.reply({ embeds: [infoEmbed('No Active Giveaways', 'There are no active giveaways.')] });
            }

            const list = giveaways.map(g => {
                const entries = JSON.parse(g.entries).length;
                const endsAt = Math.floor(new Date(g.ends_at + 'Z').getTime() / 1000);
                return `**${g.prize}** - ${entries} entries\nEnds <t:${endsAt}:R> in <#${g.channel_id}>`;
            }).join('\n\n');

            return interaction.reply({ embeds: [infoEmbed('Active Giveaways', list)] });
        }
    },
};
