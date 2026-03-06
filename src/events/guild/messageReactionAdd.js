const RULES_CHANNEL = '1479020083035508746';
const MEMBER_ROLE_ID = '1478797711619916059';

module.exports = {
    name: 'messageReactionAdd',
    once: false,
    async execute(reaction, user, client) {
        if (user.bot) return;

        // Handle partial reactions/messages
        if (reaction.partial) {
            try { await reaction.fetch(); } catch { return; }
        }
        if (reaction.message.partial) {
            try { await reaction.message.fetch(); } catch { return; }
        }

        // Rules verification — checkmark in rules channel
        if (reaction.message.channel.id === RULES_CHANNEL && reaction.emoji.name === '\u2705') {
            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            if (!member.roles.cache.has(MEMBER_ROLE_ID)) {
                await member.roles.add(MEMBER_ROLE_ID, 'Accepted server rules').catch(() => {});
            }
        }
    },
};
