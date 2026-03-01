const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, infoEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure auto-moderation')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('toggle')
                .setDescription('Toggle an auto-mod feature')
                .addStringOption(opt =>
                    opt.setName('feature')
                        .setDescription('The feature to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Anti-Spam', value: 'automod_anti_spam' },
                            { name: 'Anti-Link', value: 'automod_anti_link' },
                            { name: 'Anti-Raid', value: 'automod_anti_raid' },
                        )))
        .addSubcommand(sub =>
            sub.setName('action')
                .setDescription('Set the action for auto-mod violations')
                .addStringOption(opt =>
                    opt.setName('action')
                        .setDescription('Action to take')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Timeout (5 min)', value: 'timeout' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' },
                            { name: 'Warn', value: 'warn' },
                        )))
        .addSubcommand(sub =>
            sub.setName('add-bad-word')
                .setDescription('Add a word to the filter')
                .addStringOption(opt => opt.setName('word').setDescription('The word to block').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove-bad-word')
                .setDescription('Remove a word from the filter')
                .addStringOption(opt => opt.setName('word').setDescription('The word to unblock').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('whitelist-link')
                .setDescription('Whitelist a domain for anti-link')
                .addStringOption(opt => opt.setName('domain').setDescription('Domain to whitelist (e.g. youtube.com)').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('exempt-role')
                .setDescription('Exempt a role from auto-mod')
                .addRoleOption(opt => opt.setName('role').setDescription('The role to exempt').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View auto-mod settings')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const settings = client.db.settings.getSettings(interaction.guild.id);

        if (sub === 'toggle') {
            const feature = interaction.options.getString('feature');
            const newValue = settings[feature] ? 0 : 1;
            client.db.settings.updateSetting(interaction.guild.id, feature, newValue);
            const name = feature.replace('automod_', '').replace(/_/g, '-');
            return interaction.reply({ embeds: [successEmbed('Auto-Mod Updated', `**${name}** has been **${newValue ? 'enabled' : 'disabled'}**.`)] });
        }

        if (sub === 'action') {
            const action = interaction.options.getString('action');
            client.db.settings.updateSetting(interaction.guild.id, 'automod_action', action);
            return interaction.reply({ embeds: [successEmbed('Auto-Mod Action', `Action set to **${action}**.`)] });
        }

        if (sub === 'add-bad-word') {
            const word = interaction.options.getString('word').toLowerCase();
            const words = JSON.parse(settings.automod_bad_words || '[]');
            if (!words.includes(word)) words.push(word);
            client.db.settings.updateSetting(interaction.guild.id, 'automod_bad_words', JSON.stringify(words));
            return interaction.reply({ embeds: [successEmbed('Word Added', `Added "||${word}||" to the filter. (${words.length} total)`)], ephemeral: true });
        }

        if (sub === 'remove-bad-word') {
            const word = interaction.options.getString('word').toLowerCase();
            const words = JSON.parse(settings.automod_bad_words || '[]').filter(w => w !== word);
            client.db.settings.updateSetting(interaction.guild.id, 'automod_bad_words', JSON.stringify(words));
            return interaction.reply({ embeds: [successEmbed('Word Removed', `Removed "${word}" from the filter.`)] });
        }

        if (sub === 'whitelist-link') {
            const domain = interaction.options.getString('domain');
            const whitelist = JSON.parse(settings.automod_link_whitelist || '[]');
            if (!whitelist.includes(domain)) whitelist.push(domain);
            client.db.settings.updateSetting(interaction.guild.id, 'automod_link_whitelist', JSON.stringify(whitelist));
            return interaction.reply({ embeds: [successEmbed('Domain Whitelisted', `**${domain}** has been whitelisted.`)] });
        }

        if (sub === 'exempt-role') {
            const role = interaction.options.getRole('role');
            const exempt = JSON.parse(settings.automod_exempt_roles || '[]');
            if (exempt.includes(role.id)) {
                const updated = exempt.filter(r => r !== role.id);
                client.db.settings.updateSetting(interaction.guild.id, 'automod_exempt_roles', JSON.stringify(updated));
                return interaction.reply({ embeds: [successEmbed('Role Updated', `${role} is no longer exempt.`)] });
            }
            exempt.push(role.id);
            client.db.settings.updateSetting(interaction.guild.id, 'automod_exempt_roles', JSON.stringify(exempt));
            return interaction.reply({ embeds: [successEmbed('Role Exempted', `${role} is now exempt from auto-mod.`)] });
        }

        if (sub === 'view') {
            const badWords = JSON.parse(settings.automod_bad_words || '[]');
            const whitelist = JSON.parse(settings.automod_link_whitelist || '[]');
            const exemptRoles = JSON.parse(settings.automod_exempt_roles || '[]');

            const embed = infoEmbed('Auto-Mod Settings', [
                `**Module:** ${settings.mod_automod ? 'Enabled' : 'Disabled'}`,
                `**Anti-Spam:** ${settings.automod_anti_spam ? '\u2705' : '\u274C'} (${settings.automod_spam_threshold} msgs / ${settings.automod_spam_window}ms)`,
                `**Anti-Link:** ${settings.automod_anti_link ? '\u2705' : '\u274C'}`,
                `**Anti-Raid:** ${settings.automod_anti_raid ? '\u2705' : '\u274C'}`,
                `**Action:** ${settings.automod_action}`,
                `**Bad Words:** ${badWords.length} word(s)`,
                `**Whitelisted Domains:** ${whitelist.length > 0 ? whitelist.join(', ') : 'None'}`,
                `**Exempt Roles:** ${exemptRoles.length > 0 ? exemptRoles.map(r => `<@&${r}>`).join(', ') : 'None'}`,
            ].join('\n'));

            return interaction.reply({ embeds: [embed] });
        }
    },
};
