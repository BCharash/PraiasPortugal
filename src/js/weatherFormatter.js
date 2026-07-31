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