//--------------------------------------------------
// Weather Formatter
//
// Formats weather information for display.
//--------------------------------------------------


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function formatAirTemperature(weather) {

    return `${weather.airTemperature.toFixed(0)}°C`;

}


function formatFeelsLike(weather) {

    return `Feels like ${weather.apparentTemperature.toFixed(0)}°C`;

}


function formatConditions(weather) {

    return weather.description;

}


function formatWind(weather) {

    return `${getWindArrow(weather.windDirection)} ` +
           `${getCompassDirection(weather.windDirection)} ` +
           `${weather.windDirection}° ` +
           `${weather.windSpeed.toFixed(0)} km/h`;

}


function formatWindGusts(weather) {

    return `${weather.windGusts.toFixed(0)} km/h`;

}


/*
 * Format the UV Index.
 */
function formatUV(weather) {

    if (weather.uvIndex == null)
        return "--";

    const uv = Math.round(weather.uvIndex);

    if (uv <= 2)
        return `${uv} Low`;

    if (uv <= 5)
        return `${uv} Moderate`;

    if (uv <= 7)
        return `${uv} High`;

    if (uv <= 10)
        return `${uv} Very High`;

    return `${uv} Extreme`;

}


//--------------------------------------------------
// Private Functions
//--------------------------------------------------

function getCompassDirection(degrees) {

    const directions = [

        "N",
        "NNE",
        "NE",
        "ENE",
        "E",
        "ESE",
        "SE",
        "SSE",
        "S",
        "SSW",
        "SW",
        "WSW",
        "W",
        "WNW",
        "NW",
        "NNW"

    ];

    const index = Math.round(degrees / 22.5) % 16;

    return directions[index];

}


function getWindArrow(degrees) {

    const arrows = [

        "↑",
        "↗",
        "↗",
        "↗",
        "→",
        "↘",
        "↘",
        "↘",
        "↓",
        "↙",
        "↙",
        "↙",
        "←",
        "↖",
        "↖",
        "↖"

    ];

    const index = Math.round(degrees / 22.5) % 16;

    return arrows[index];

}