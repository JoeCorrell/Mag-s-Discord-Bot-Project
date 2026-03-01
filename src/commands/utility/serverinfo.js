const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { customEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about this server')
        .setDMPermission(false),
    cooldown: 5,

    async execute(interaction) {
        const { guild } = interaction;
        await guild.members.fetch().catch(() => {});

        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
        const roles = guild.roles.cache.size - 1;
        const emojis = guild.emojis.cache.size;
        const boosts = guild.premiumSubscriptionCount || 0;

        const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const idle = guild.members.cache.filter(m => m.presence?.status === 'idle').size;
        const dnd = guild.members.cache.filter(m => m.presence?.status === 'dnd').size;
        const bots = guild.members.cache.filter(m => m.user.bot).size;

        const verificationLevels = { 0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Very High' };

        const embed = customEmbed()
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Verification', value: verificationLevels[guild.verificationLevel] || 'Unknown', inline: true },
                { name: `Members [${guild.memberCount}]`, value: `\uD83D\uDFE2 ${online} \uD83D\uDFE1 ${idle} \uD83D\uDD34 ${dnd} \uD83E\uDD16 ${bots}`, inline: true },
                { name: `Channels [${textChannels + voiceChannels}]`, value: `\uD83D\uDCDD ${textChannels} text \u2022 \uD83D\uDD0A ${voiceChannels} voice \u2022 \uD83D\uDCC1 ${categories} categories`, inline: true },
                { name: 'Other', value: `\uD83C\uDFAD ${roles} roles \u2022 \uD83D\uDE00 ${emojis} emojis \u2022 \uD83D\uDC8E ${boosts} boosts`, inline: true },
            );

        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ size: 1024 }));
        }

        return interaction.reply({ embeds: [embed] });
    },
};
