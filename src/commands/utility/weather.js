const { SlashCommandBuilder } = require('discord.js');
const { customEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get weather information for a city')
        .addStringOption(opt => opt.setName('city').setDescription('The city name').setRequired(true)),
    cooldown: 10,

    async execute(interaction) {
        const city = interaction.options.getString('city');
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            return interaction.reply({
                embeds: [errorEmbed('Not Configured', 'Weather API key is not set. Add `WEATHER_API_KEY` to your `.env` file.')],
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
            const data = await response.json();

            if (data.cod !== 200) {
                return interaction.editReply({ embeds: [errorEmbed('Not Found', `Could not find weather data for **${city}**.`)] });
            }

            const embed = customEmbed()
                .setTitle(`\u2600\uFE0F Weather in ${data.name}, ${data.sys.country}`)
                .setThumbnail(`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
                .addFields(
                    { name: 'Temperature', value: `${data.main.temp}\u00B0C (${(data.main.temp * 9/5 + 32).toFixed(1)}\u00B0F)`, inline: true },
                    { name: 'Feels Like', value: `${data.main.feels_like}\u00B0C`, inline: true },
                    { name: 'Condition', value: data.weather[0].description, inline: true },
                    { name: 'Humidity', value: `${data.main.humidity}%`, inline: true },
                    { name: 'Wind Speed', value: `${data.wind.speed} m/s`, inline: true },
                    { name: 'Visibility', value: `${(data.visibility / 1000).toFixed(1)} km`, inline: true },
                );

            return interaction.editReply({ embeds: [embed] });
        } catch {
            return interaction.editReply({ embeds: [errorEmbed('Error', 'Failed to fetch weather data.')] });
        }
    },
};
