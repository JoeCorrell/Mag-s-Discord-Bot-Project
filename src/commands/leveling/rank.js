const { SlashCommandBuilder } = require('discord.js');
const { customEmbed, errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your or someone else\'s level and XP')
        .setDMPermission(false)
        .addUserOption(opt => opt.setName('user').setDescription('The user to check')),
    cooldown: 5,

    async execute(interaction, client) {
        const user = interaction.options.getUser('user') || interaction.user;
        const userData = client.db.leveling.getUser(interaction.guild.id, user.id);

        if (!userData) {
            return interaction.reply({
                embeds: [errorEmbed('No Data', `${user.tag} has no XP data yet.`)],
                ephemeral: true,
            });
        }

        const rank = client.db.leveling.getRank(interaction.guild.id, user.id);
        const xpNeeded = config.xp.levelUpFormula(userData.level);
        const progressPercent = Math.floor((userData.xp / xpNeeded) * 100);

        const barLength = 20;
        const filledBars = Math.floor((userData.xp / xpNeeded) * barLength);
        const progressBar = '\u2588'.repeat(filledBars) + '\u2591'.repeat(barLength - filledBars);

        const embed = customEmbed()
            .setTitle(`${user.tag}'s Rank`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Rank', value: `#${rank}`, inline: true },
                { name: 'Level', value: `${userData.level}`, inline: true },
                { name: 'Total XP', value: `${userData.total_xp.toLocaleString()}`, inline: true },
                { name: `Progress (${progressPercent}%)`, value: `\`${progressBar}\`\n${userData.xp} / ${xpNeeded} XP` },
                { name: 'Messages', value: `${userData.messages.toLocaleString()}`, inline: true },
            );

        return interaction.reply({ embeds: [embed] });
    },
};
