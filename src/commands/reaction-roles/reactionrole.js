const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Set up reaction roles with buttons')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a new reaction role panel')
                .addStringOption(opt => opt.setName('title').setDescription('Panel title').setRequired(true))
                .addStringOption(opt => opt.setName('description').setDescription('Panel description')))
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a role button to an existing panel')
                .addStringOption(opt => opt.setName('message-id').setDescription('The panel message ID').setRequired(true))
                .addRoleOption(opt => opt.setName('role').setDescription('The role to assign').setRequired(true))
                .addStringOption(opt => opt.setName('label').setDescription('Button label'))
                .addStringOption(opt => opt.setName('emoji').setDescription('Button emoji'))
                .addStringOption(opt =>
                    opt.setName('style')
                        .setDescription('Button style')
                        .addChoices(
                            { name: 'Blue', value: 'Primary' },
                            { name: 'Grey', value: 'Secondary' },
                            { name: 'Green', value: 'Success' },
                            { name: 'Red', value: 'Danger' },
                        )))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a role from a panel')
                .addStringOption(opt => opt.setName('message-id').setDescription('The panel message ID').setRequired(true))
                .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))),
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageRoles],

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description') || 'Click a button to toggle a role.';

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(title)
                .setDescription(description)
                .setTimestamp();

            const msg = await interaction.channel.send({ embeds: [embed] });

            return interaction.reply({
                embeds: [successEmbed('Panel Created', `Panel created! Use \`/reactionrole add\` with message ID \`${msg.id}\` to add roles.`)],
                ephemeral: true,
            });
        }

        if (sub === 'add') {
            const messageId = interaction.options.getString('message-id');
            const role = interaction.options.getRole('role');
            const label = interaction.options.getString('label') || role.name;
            const emoji = interaction.options.getString('emoji');
            const style = interaction.options.getString('style') || 'Primary';

            const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
            if (!message) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'Message not found in this channel.')], ephemeral: true });
            }

            client.db.reactionRoles.add(interaction.guild.id, interaction.channel.id, messageId, role.id, {
                buttonLabel: label,
                buttonStyle: style,
                emoji,
                type: 'button',
            });

            // Rebuild buttons from DB
            const roles = client.db.reactionRoles.getForMessage(messageId);
            const styles = { Primary: ButtonStyle.Primary, Secondary: ButtonStyle.Secondary, Success: ButtonStyle.Success, Danger: ButtonStyle.Danger };

            const rows = [];
            let currentRow = new ActionRowBuilder();

            for (let i = 0; i < roles.length; i++) {
                const btn = new ButtonBuilder()
                    .setCustomId(`rr-${roles[i].role_id}`)
                    .setLabel(roles[i].button_label || 'Role')
                    .setStyle(styles[roles[i].button_style] || ButtonStyle.Primary);

                if (roles[i].emoji) btn.setEmoji(roles[i].emoji);

                currentRow.addComponents(btn);

                if ((i + 1) % 5 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
            }

            if (currentRow.components.length > 0) rows.push(currentRow);

            await message.edit({ components: rows });

            return interaction.reply({
                embeds: [successEmbed('Role Added', `${role} has been added to the panel.`)],
                ephemeral: true,
            });
        }

        if (sub === 'remove') {
            const messageId = interaction.options.getString('message-id');
            const role = interaction.options.getRole('role');

            client.db.reactionRoles.remove(messageId, role.id);

            const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
            if (message) {
                const roles = client.db.reactionRoles.getForMessage(messageId);
                const styles = { Primary: ButtonStyle.Primary, Secondary: ButtonStyle.Secondary, Success: ButtonStyle.Success, Danger: ButtonStyle.Danger };

                const rows = [];
                let currentRow = new ActionRowBuilder();

                for (let i = 0; i < roles.length; i++) {
                    const btn = new ButtonBuilder()
                        .setCustomId(`rr-${roles[i].role_id}`)
                        .setLabel(roles[i].button_label || 'Role')
                        .setStyle(styles[roles[i].button_style] || ButtonStyle.Primary);

                    if (roles[i].emoji) btn.setEmoji(roles[i].emoji);
                    currentRow.addComponents(btn);

                    if ((i + 1) % 5 === 0) {
                        rows.push(currentRow);
                        currentRow = new ActionRowBuilder();
                    }
                }

                if (currentRow.components.length > 0) rows.push(currentRow);
                await message.edit({ components: rows.length > 0 ? rows : [] });
            }

            return interaction.reply({
                embeds: [successEmbed('Role Removed', `${role} has been removed from the panel.`)],
                ephemeral: true,
            });
        }
    },
};
