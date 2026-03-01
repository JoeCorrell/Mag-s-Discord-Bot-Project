const { SlashCommandBuilder } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');
const { createPaginatedEmbed } = require('../../utils/pagination');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the XP leaderboard')
        .setDMPermission(false),
    cooldown: 10,

    async execute(interaction, client) {
        const totalUsers = client.db.leveling.totalUsers(interaction.guild.id);

        if (totalUsers === 0) {
            return interaction.reply({
                embeds: [customEmbed().setTitle('\uD83C\uDFC6 Leaderboard').setDescription('No one has any XP yet!')],
            });
        }

        const perPage = 10;
        const totalPages = Math.ceil(totalUsers / perPage);
        const pages = [];

        for (let page = 1; page <= Math.min(totalPages, 10); page++) {
            const users = client.db.leveling.getLeaderboard(interaction.guild.id, page, perPage);

            const entries = users.map((u, i) => {
                const position = (page - 1) * perPage + i + 1;
                const medal = position === 1 ? '\uD83E\uDD47' : position === 2 ? '\uD83E\uDD48' : position === 3 ? '\uD83E\uDD49' : `**${position}.**`;
                return `${medal} <@${u.user_id}> \u2022 Level ${u.level} \u2022 ${u.total_xp.toLocaleString()} XP`;
            }).join('\n');

            const embed = customEmbed()
                .setTitle(`\uD83C\uDFC6 ${interaction.guild.name} Leaderboard`)
                .setDescription(entries)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

            pages.push(embed);
        }

        return createPaginatedEmbed(interaction, pages);
    },
};
