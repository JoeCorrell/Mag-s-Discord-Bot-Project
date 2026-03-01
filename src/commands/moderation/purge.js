const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete multiple messages at once')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
        .addUserOption(opt => opt.setName('user').setDescription('Only delete messages from this user')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageMessages],

    async execute(interaction, client) {
        const amount = interaction.options.getInteger('amount');
        const filterUser = interaction.options.getUser('user');

        await interaction.deferReply({ ephemeral: true });

        let messages = await interaction.channel.messages.fetch({ limit: amount });

        if (filterUser) {
            messages = messages.filter(m => m.author.id === filterUser.id);
        }

        // Filter messages older than 14 days (Discord API limitation)
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

        if (messages.size === 0) {
            return interaction.editReply({ embeds: [errorEmbed('Error', 'No messages found to delete.')] });
        }

        const deleted = await interaction.channel.bulkDelete(messages, true);

        client.db.modLogs.add(interaction.guild.id, interaction.user.id, interaction.user.id, 'purge', `Deleted ${deleted.size} messages in #${interaction.channel.name}`);

        const settings = client.db.settings.getSettings(interaction.guild.id);
        if (settings.mod_logging && settings.log_channel_id && settings.log_mod_actions) {
            const logChannel = interaction.guild.channels.cache.get(settings.log_channel_id);
            if (logChannel) {
                const { modEmbed } = require('../../utils/embedBuilder');
                logChannel.send({ embeds: [modEmbed('Purge', interaction.user, interaction.user, `Deleted ${deleted.size} messages in <#${interaction.channel.id}>`)] }).catch(() => {});
            }
        }

        return interaction.editReply({ embeds: [successEmbed('Messages Purged', `Deleted **${deleted.size}** message(s).${filterUser ? ` (from ${filterUser.tag})` : ''}`)] });
    },
};
