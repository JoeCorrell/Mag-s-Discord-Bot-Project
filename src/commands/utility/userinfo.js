const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .setDMPermission(false)
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The user to get info about')),
    cooldown: 5,

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const embed = customEmbed(member?.displayColor || 0x5865F2)
            .setTitle(`User Info: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'User', value: `${user}`, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            );

        if (member) {
            embed.addFields(
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: `Roles [${member.roles.cache.size - 1}]`, value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `${r}`).join(', ') || 'None' },
            );

            if (member.premiumSinceTimestamp) {
                embed.addFields({ name: 'Boosting Since', value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`, inline: true });
            }
        }

        return interaction.reply({ embeds: [embed] });
    },
};
