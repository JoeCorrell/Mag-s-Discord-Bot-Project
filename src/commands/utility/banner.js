const { SlashCommandBuilder } = require('discord.js');
const { customEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Get a user\'s banner')
        .setDMPermission(false)
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The user to get the banner of')),
    cooldown: 3,

    async execute(interaction) {
        const user = await interaction.client.users.fetch(
            interaction.options.getUser('user')?.id || interaction.user.id,
            { force: true }
        );

        const bannerURL = user.bannerURL({ dynamic: true, size: 4096 });

        if (!bannerURL) {
            return interaction.reply({
                embeds: [errorEmbed('No Banner', `${user.tag} does not have a banner.`)],
                ephemeral: true,
            });
        }

        const embed = customEmbed()
            .setTitle(`${user.tag}'s Banner`)
            .setImage(bannerURL);

        return interaction.reply({ embeds: [embed] });
    },
};
