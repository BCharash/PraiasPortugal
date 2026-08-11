//--------------------------------------------------
// Weather Formatter
//
// Formats weather information for display.
// Uses application unit settings.
//--------------------------------------------------


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function formatAirTemperature(weather) {

    if (!weather || weather.airTemperature == null)
        return "--";

    const temperature =
        convertTemperature(weather.airTemperature);

    return `${temperature.toFixed(0)}${getTemperatureSymbol()}`;

}


function formatHumidity(weather) {

    if (!weather || weather.relativeHumidity == null)
        return "--";

    return `RH ${Math.round(weather.relativeHumidity)}%`;

}


function formatFeelsLike(weather) {

    if (!weather || weather.apparentTemperature == null)
        return "--";

    const temperature =
        convertTemperature(weather.apparentTemperature);

    return `Feels like ${temperature.toFixed(0)}${getTemperatureSymbol()}`;

}


function formatHighLow(weather) {

    if (!weather ||
        weather.highTemperature == null ||
        weather.lowTemperature == null)
        return "--";

    const high =
        convertTemperature(weather.highTemperature);

    const low =
        convertTemperature(weather.lowTemperature);

    return `H ${Math.round(high)}${getTemperatureSymbol()}  ` +
           `L ${Math.round(low)}${getTemperatureSymbol()}`;

}


function formatConditions(weather) {

    if (!weather)
        return "--";

    return weather.description;

}


function formatWind(weather) {

    if (!weather ||
        weather.windDirection == null ||
        weather.windSpeed == null)
        return "--";

    const speed =
        convertWindSpeed(weather.windSpeed);

    return `${getWindArrow(weather.windDirection)} ` +
           `${getCompassDirection(weather.windDirection)} ` +
           `${weather.windDirection}° ` +
           `${speed.toFixed(0)} ${getWindSpeedSymbol()}`;

}


function formatWindGusts(weather) {

    if (!weather || weather.windGusts == null)
        return "--";

    const gusts =
        convertWindSpeed(weather.windGusts);

    return `${gusts.toFixed(0)} ${getWindSpeedSymbol()}`;

}


/*
 * Format the UV Index.
 */
function formatUV(weather) {

    if (!weather || weather.uvIndex == null)
        return "--";

    const uv =
        Math.round(weather.uvIndex);

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
// Temperature Conversion
//--------------------------------------------------

function convertTemperature(celsius) {

    if (getTemperatureUnit() === "fahrenheit")
        return (celsius * 9 / 5) + 32;

    return celsius;

}


function getTemperatureUnit() {

    if (typeof appState !== "undefined" &&
        appState.settings &&
        appState.settings.temperatureUnit) {

        return appState.settings.temperatureUnit;

    }

    return "celsius";

}


function getTemperatureSymbol() {

    if (getTemperatureUnit() === "fahrenheit")
        return "°F";

    return "°C";

}


//--------------------------------------------------
// Wind Speed Conversion
//--------------------------------------------------

function convertWindSpeed(kmh) {

    const unit =
        getWindSpeedUnit();

    if (unit === "knots")
        return kmh / 1.852;

    if (unit === "mph")
        return kmh / 1.609344;

    return kmh;

}


function getWindSpeedUnit() {

    if (typeof appState !== "undefined" &&
        appState.settings &&
        appState.settings.windSpeedUnit) {

        return appState.settings.windSpeedUnit;

    }

    return "kmh";

}


function getWindSpeedSymbol() {

    const unit =
        getWindSpeedUnit();

    if (unit === "knots")
        return "kn";

    if (unit === "mph")
        return "mph";

    return "km/h";

}


//--------------------------------------------------
// Compass Direction
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

    const index =
        Math.round(degrees / 22.5) % 16;

    return directions[index];

}


//--------------------------------------------------
// Wind Arrow
//--------------------------------------------------

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

    const index =
        Math.round(degrees / 22.5) % 16;

    return arrows[index];

}