const { PermissionFlagsBits } = require('discord.js');

function checkPermissions(member, requiredPerms) {
    if (!requiredPerms || requiredPerms.length === 0) return { allowed: true, missing: [] };

    const missing = [];
    for (const perm of requiredPerms) {
        if (!member.permissions.has(perm)) {
            missing.push(perm);
        }
    }

    return { allowed: missing.length === 0, missing };
}

function isModerator(member) {
    return member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
           member.permissions.has(PermissionFlagsBits.ManageMessages) ||
           member.permissions.has(PermissionFlagsBits.KickMembers);
}

function isAdmin(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isBotOwner(userId) {
    return userId === process.env.BOT_OWNER_ID;
}

module.exports = { checkPermissions, isModerator, isAdmin, isBotOwner };
