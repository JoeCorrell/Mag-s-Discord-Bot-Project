const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

async function createPaginatedEmbed(interaction, pages, timeout = 120000) {
    if (pages.length === 0) return;

    if (pages.length === 1) {
        return interaction.reply({ embeds: [pages[0]] });
    }

    let currentPage = 0;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('page_first')
            .setEmoji('\u23EE\uFE0F')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('page_prev')
            .setEmoji('\u25C0\uFE0F')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('page_count')
            .setLabel(`1 / ${pages.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('page_next')
            .setEmoji('\u25B6\uFE0F')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pages.length <= 1),
        new ButtonBuilder()
            .setCustomId('page_last')
            .setEmoji('\u23ED\uFE0F')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pages.length <= 1),
    );

    const message = await interaction.reply({
        embeds: [pages[0]],
        components: [row],
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: timeout,
    });

    collector.on('collect', async (i) => {
        switch (i.customId) {
            case 'page_first': currentPage = 0; break;
            case 'page_prev': currentPage = Math.max(0, currentPage - 1); break;
            case 'page_next': currentPage = Math.min(pages.length - 1, currentPage + 1); break;
            case 'page_last': currentPage = pages.length - 1; break;
        }

        row.components[0].setDisabled(currentPage === 0);
        row.components[1].setDisabled(currentPage === 0);
        row.components[2].setLabel(`${currentPage + 1} / ${pages.length}`);
        row.components[3].setDisabled(currentPage === pages.length - 1);
        row.components[4].setDisabled(currentPage === pages.length - 1);

        await i.update({ embeds: [pages[currentPage]], components: [row] });
    });

    collector.on('end', () => {
        row.components.forEach(btn => btn.setDisabled(true));
        message.edit({ components: [row] }).catch(() => {});
    });
}

module.exports = { createPaginatedEmbed };
