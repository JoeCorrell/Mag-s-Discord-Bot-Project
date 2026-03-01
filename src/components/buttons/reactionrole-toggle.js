module.exports = {
    customId: 'rr-',

    async execute(interaction, client) {
        const roleId = interaction.customId.replace('rr-', '');
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return interaction.reply({ content: 'This role no longer exists.', ephemeral: true });
        }

        const member = interaction.member;

        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(role, 'Reaction role toggle');
            return interaction.reply({ content: `Removed ${role} from you.`, ephemeral: true });
        } else {
            await member.roles.add(role, 'Reaction role toggle');
            return interaction.reply({ content: `Added ${role} to you!`, ephemeral: true });
        }
    },
};
