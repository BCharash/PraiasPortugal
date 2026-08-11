//--------------------------------------------------
// Weather Formatter
//
// Formats weather information for display.
// Uses application unit settings and language.
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

    return `${translate("relativeHumidity")} ` +
           `${Math.round(weather.relativeHumidity)}%`;

}


function formatFeelsLike(weather) {

    if (!weather || weather.apparentTemperature == null)
        return "--";

    const temperature =
        convertTemperature(weather.apparentTemperature);

    return `${translate("feelsLike")} ` +
           `${temperature.toFixed(0)}${getTemperatureSymbol()}`;

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

    return `${translate("highShort")} ${Math.round(high)}${getTemperatureSymbol()}  ` +
           `${translate("lowShort")} ${Math.round(low)}${getTemperatureSymbol()}`;

}


function formatConditions(weather) {

    if (!weather)
        return "--";

    return getTranslatedWeatherDescription(
        weather.weatherCode,
        weather.description
    );

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
           `${Math.round(weather.windDirection)}° ` +
           `${speed.toFixed(0)} ${getWindSpeedSymbol()}`;

}


function formatWindGusts(weather) {

    if (!weather || weather.windGusts == null)
        return "--";

    const gusts =
        convertWindSpeed(weather.windGusts);

    return `${gusts.toFixed(0)} ${getWindSpeedSymbol()}`;

}


//--------------------------------------------------
// UV Index
//--------------------------------------------------

function formatUV(weather) {

    if (!weather || weather.uvIndex == null)
        return "--";

    const uv =
        Math.round(weather.uvIndex);

    if (uv <= 2)
        return `${uv} ${translate("uvLow")}`;

    if (uv <= 5)
        return `${uv} ${translate("uvModerate")}`;

    if (uv <= 7)
        return `${uv} ${translate("uvHigh")}`;

    if (uv <= 10)
        return `${uv} ${translate("uvVeryHigh")}`;

    return `${uv} ${translate("uvExtreme")}`;

}


//==================================================
// Weather Description Translation
//==================================================

function getTranslatedWeatherDescription(
    weatherCode,
    fallbackDescription
) {

    if (weatherCode == null)
        return fallbackDescription || "--";

    switch (weatherCode) {

        case 0:
            return translate("weatherClearSky");

        case 1:
            return translate("weatherMainlyClear");

        case 2:
            return translate("weatherPartlyCloudy");

        case 3:
            return translate("weatherOvercast");

        case 45:
        case 48:
            return translate("weatherFog");

        case 51:
        case 53:
        case 55:
            return translate("weatherDrizzle");

        case 61:
        case 63:
        case 65:
            return translate("weatherRain");

        case 71:
        case 73:
        case 75:
            return translate("weatherSnow");

        case 80:
        case 81:
        case 82:
            return translate("weatherRainShowers");

        case 95:
            return translate("weatherThunderstorm");

        case 96:
        case 99:
            return translate("weatherThunderstormHail");

        default:
            return fallbackDescription || "--";

    }

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