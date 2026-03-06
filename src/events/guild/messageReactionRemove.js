const RULES_CHANNEL = '1479020083035508746';
const MEMBER_ROLE_ID = '1478797711619916059';

module.exports = {
    name: 'messageReactionRemove',
    once: false,
    async execute(reaction, user, client) {
        if (user.bot) return;

        if (reaction.partial) {
            try { await reaction.fetch(); } catch { return; }
        }
        if (reaction.message.partial) {
            try { await reaction.message.fetch(); } catch { return; }
        }

        if (reaction.message.channel.id === RULES_CHANNEL && reaction.emoji.name === '\u2705') {
            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            if (member.roles.cache.has(MEMBER_ROLE_ID)) {
                await member.roles.remove(MEMBER_ROLE_ID, 'Removed rules acceptance').catch(() => {});
            }
        }
    },
};
