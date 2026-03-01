const ms = require('ms');

function parseDuration(str) {
    if (!str) return null;

    // Try ms package first for simple durations like "10m", "2h"
    const result = ms(str);
    if (result) return result;

    // Handle compound durations like "1d2h30m"
    const regex = /(\d+)\s*(d|h|m|s)/gi;
    let total = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 'd': total += value * 86400000; break;
            case 'h': total += value * 3600000; break;
            case 'm': total += value * 60000; break;
            case 's': total += value * 1000; break;
        }
    }

    return total || null;
}

function formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0s';

    const days = Math.floor(milliseconds / 86400000);
    const hours = Math.floor((milliseconds % 86400000) / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
}

function relativeTimestamp(date) {
    const unix = Math.floor(new Date(date).getTime() / 1000);
    return `<t:${unix}:R>`;
}

function fullTimestamp(date) {
    const unix = Math.floor(new Date(date).getTime() / 1000);
    return `<t:${unix}:F>`;
}

module.exports = { parseDuration, formatDuration, relativeTimestamp, fullTimestamp };
