const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

function baseEmbed() {
    return new EmbedBuilder()
        .setFooter({ text: config.defaults.footerText })
        .setTimestamp();
}

module.exports = {
    successEmbed(title, description) {
        return baseEmbed()
            .setColor(config.colors.success)
            .setTitle(`${config.emojis.success} ${title}`)
            .setDescription(description || null);
    },

    errorEmbed(title, description) {
        return baseEmbed()
            .setColor(config.colors.error)
            .setTitle(`${config.emojis.error} ${title}`)
            .setDescription(description || null);
    },

    infoEmbed(title, description) {
        return baseEmbed()
            .setColor(config.colors.info)
            .setTitle(`${config.emojis.info} ${title}`)
            .setDescription(description || null);
    },

    warnEmbed(title, description) {
        return baseEmbed()
            .setColor(config.colors.warning)
            .setTitle(`${config.emojis.warn} ${title}`)
            .setDescription(description || null);
    },

    modEmbed(action, target, moderator, reason, extras = {}) {
        const embed = baseEmbed()
            .setColor(config.colors.moderation)
            .setTitle(`Moderation: ${action}`)
            .addFields(
                { name: 'User', value: `${target} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator}`, inline: true },
                { name: 'Reason', value: reason || 'No reason provided' },
            );

        if (extras.duration) {
            embed.addFields({ name: 'Duration', value: extras.duration, inline: true });
        }

        if (extras.thumbnail) {
            embed.setThumbnail(extras.thumbnail);
        }

        return embed;
    },

    customEmbed(color) {
        return baseEmbed().setColor(color || config.colors.primary);
    },
};
