function replaceVariables(template, data) {
    if (!template) return template;

    return template
        .replace(/{user}/g, data.user ? `<@${data.user.id}>` : '{user}')
        .replace(/{user\.tag}/g, data.user ? data.user.tag : '{user.tag}')
        .replace(/{user\.name}/g, data.user ? data.user.username : '{user.name}')
        .replace(/{user\.id}/g, data.user ? data.user.id : '{user.id}')
        .replace(/{server}/g, data.guild ? data.guild.name : '{server}')
        .replace(/{server\.id}/g, data.guild ? data.guild.id : '{server.id}')
        .replace(/{memberCount}/g, data.guild ? data.guild.memberCount : '{memberCount}')
        .replace(/{channel}/g, data.channel ? `<#${data.channel.id}>` : '{channel}');
}

module.exports = { replaceVariables };
