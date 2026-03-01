const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get a user\'s avatar')
        .setDMPermission(false)
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The user to get the avatar of')),
    cooldown: 3,

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = customEmbed()
            .setTitle(`${user.tag}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .addFields({
                name: 'Links',
                value: [
                    `[PNG](${user.displayAvatarURL({ extension: 'png', size: 4096 })})`,
                    `[JPG](${user.displayAvatarURL({ extension: 'jpg', size: 4096 })})`,
                    `[WEBP](${user.displayAvatarURL({ extension: 'webp', size: 4096 })})`,
                    user.avatar?.startsWith('a_') ? `[GIF](${user.displayAvatarURL({ extension: 'gif', size: 4096 })})` : null,
                ].filter(Boolean).join(' \u2022 '),
            });

        return interaction.reply({ embeds: [embed] });
    },
};
