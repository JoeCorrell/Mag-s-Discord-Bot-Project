const { Collection } = require('discord.js');
const config = require('../../config/config');

function checkCooldown(client, interaction, command) {
    if (!client.cooldowns.has(command.data.name)) {
        client.cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown || config.defaults.cooldown) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return `Please wait **${timeLeft.toFixed(1)}** seconds before using \`/${command.data.name}\` again.`;
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    return null;
}

module.exports = { checkCooldown };
