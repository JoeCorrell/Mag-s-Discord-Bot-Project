const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom-command')
        .setDescription('Manage custom text commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a custom command')
                .addStringOption(opt => opt.setName('name').setDescription('Command trigger word').setRequired(true))
                .addStringOption(opt => opt.setName('response').setDescription('The response message').setRequired(true))
                .addStringOption(opt => opt.setName('description').setDescription('Command description')))
        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('Delete a custom command')
                .addStringOption(opt => opt.setName('name').setDescription('Command name').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all custom commands')),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const name = interaction.options.getString('name').toLowerCase();
            const response = interaction.options.getString('response');
            const description = interaction.options.getString('description');

            const existing = client.db.customCommands.get(interaction.guild.id, name);
            if (existing) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'A command with that name already exists.')], ephemeral: true });
            }

            const count = client.db.customCommands.count(interaction.guild.id);
            if (count >= config.limits.customCommandsPerGuild) {
                return interaction.reply({ embeds: [errorEmbed('Error', `Maximum of ${config.limits.customCommandsPerGuild} custom commands reached.`)], ephemeral: true });
            }

            client.db.customCommands.create(interaction.guild.id, name, response, description, interaction.user.id);

            return interaction.reply({
                embeds: [successEmbed('Custom Command Created', `**Trigger:** \`${name}\`\n**Response:** ${response}\n\nMembers can type \`${name}\` in chat to trigger this command.`)],
            });
        }

        if (sub === 'delete') {
            const name = interaction.options.getString('name').toLowerCase();
            const existing = client.db.customCommands.get(interaction.guild.id, name);

            if (!existing) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Command not found.')], ephemeral: true });
            }

            client.db.customCommands.delete(interaction.guild.id, name);
            return interaction.reply({ embeds: [successEmbed('Command Deleted', `Custom command \`${name}\` has been deleted.`)] });
        }

        if (sub === 'list') {
            const commands = client.db.customCommands.list(interaction.guild.id);

            if (commands.length === 0) {
                return interaction.reply({ embeds: [infoEmbed('No Custom Commands', 'No custom commands have been created yet.')] });
            }

            const list = commands.map(c =>
                `\`${c.name}\` - ${c.description} (${c.uses} uses)`
            ).join('\n');

            return interaction.reply({ embeds: [infoEmbed('Custom Commands', list)] });
        }
    },
};
