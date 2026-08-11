//--------------------------------------------------
// Marine Formatter
//
// Formats marine conditions for display.
// Uses application unit settings.
//--------------------------------------------------


//--------------------------------------------------
// Public Formatters
//--------------------------------------------------


//--------------------------------------------------
// Sea Surface Temperature
//--------------------------------------------------

function formatSeaTemperature(marine) {

    if (!marine ||
        !marine.sea ||
        marine.sea.temperature == null)
        return "--";

    const temperature =
        convertTemperature(
            marine.sea.temperature
        );

    return `${temperature.toFixed(1)}${getTemperatureSymbol()}`;

}


//--------------------------------------------------
// Total Wave Conditions
//--------------------------------------------------

function formatSurf(marine) {

    if (!marine ||
        !marine.waves ||
        marine.waves.height == null ||
        marine.waves.direction == null ||
        marine.waves.period == null)
        return "--";

    const height =
        convertWaveHeight(
            marine.waves.height
        );

    const arrow =
        getDirectionArrow(
            marine.waves.direction
        );

    const direction =
        getCompassDirection(
            marine.waves.direction
        );

    return `${height.toFixed(1)} ` +
           `${getWaveHeightSymbol()} ` +
           `${arrow} ${direction} @ ` +
           `${Math.round(marine.waves.period)} s`;

}


//--------------------------------------------------
// Total Wave Direction
//--------------------------------------------------

function formatWaveDirection(marine) {

    if (!marine ||
        !marine.waves ||
        marine.waves.direction == null)
        return "--";

    const arrow =
        getDirectionArrow(
            marine.waves.direction
        );

    const direction =
        getCompassDirection(
            marine.waves.direction
        );

    return `${arrow} ${direction} ` +
           `${Math.round(marine.waves.direction)}°`;

}


//--------------------------------------------------
// Primary Swell
//--------------------------------------------------

function formatSwell(marine) {

    if (!marine ||
        !marine.swell ||
        marine.swell.height == null ||
        marine.swell.direction == null ||
        marine.swell.period == null)
        return "--";

    const height =
        convertWaveHeight(
            marine.swell.height
        );

    const arrow =
        getDirectionArrow(
            marine.swell.direction
        );

    const direction =
        getCompassDirection(
            marine.swell.direction
        );

    return `${height.toFixed(1)} ` +
           `${getWaveHeightSymbol()} ` +
           `${arrow} ${direction} @ ` +
           `${Math.round(marine.swell.period)} s`;

}


//--------------------------------------------------
// Wind Waves
//--------------------------------------------------

function formatWindWaves(marine) {

    if (!marine ||
        !marine.windWaves ||
        marine.windWaves.height == null ||
        marine.windWaves.direction == null ||
        marine.windWaves.period == null)
        return "--";

    const height =
        convertWaveHeight(
            marine.windWaves.height
        );

    const arrow =
        getDirectionArrow(
            marine.windWaves.direction
        );

    const direction =
        getCompassDirection(
            marine.windWaves.direction
        );

    return `${height.toFixed(1)} ` +
           `${getWaveHeightSymbol()} ` +
           `${arrow} ${direction} @ ` +
           `${Math.round(marine.windWaves.period)} s`;

}


//--------------------------------------------------
// Ocean Current
//
// Current direction indicates where the current
// is heading, rather than where it comes from.
//--------------------------------------------------

function formatOceanCurrent(marine) {

    if (!marine ||
        !marine.current ||
        marine.current.velocity == null ||
        marine.current.direction == null)
        return "--";

    const velocity =
        convertWindSpeed(
            marine.current.velocity
        );

    const arrow =
        getDirectionArrow(
            marine.current.direction
        );

    const direction =
        getCompassDirection(
            marine.current.direction
        );

    return `${velocity.toFixed(1)} ` +
           `${getWindSpeedSymbol()} ` +
           `${arrow} ${direction}`;

}


//==================================================
// Temperature Conversion
//==================================================

function convertTemperature(celsius) {

    if (typeof appState !== "undefined" &&
        appState.settings &&
        appState.settings.temperatureUnit === "fahrenheit") {

        return (celsius * 9 / 5) + 32;

    }

    return celsius;

}


function getTemperatureSymbol() {

    if (typeof appState !== "undefined" &&
        appState.settings &&
        appState.settings.temperatureUnit === "fahrenheit") {

        return "°F";

    }

    return "°C";

}


//==================================================
// Wave Height Conversion
//==================================================

function convertWaveHeight(meters) {

    if (typeof appState !== "undefined" &&
        appState.settings &&
        appState.settings.waveHeightUnit === "feet") {

        return meters * 3.28084;

    }

    return meters;

}


function getWaveHeightSymbol() {

    if (typeof appState !== "undefined" &&
        appState.settings &&
        appState.settings.waveHeightUnit === "feet") {

        return "ft";

    }

    return "m";

}


//==================================================
// Wind Speed Conversion
//==================================================

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


//==================================================
// Private Helpers
//==================================================


//--------------------------------------------------
// Compass Direction
//--------------------------------------------------

function getCompassDirection(degrees) {

    const directions = [

        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"

    ];

    const index =
        Math.round(degrees / 45) % 8;

    return directions[index];

}


//--------------------------------------------------
// Direction Arrow
//--------------------------------------------------

function getDirectionArrow(degrees) {

    const arrows = [

        "↑",
        "↗",
        "→",
        "↘",
        "↓",
        "↙",
        "←",
        "↖"

    ];

    const index =
        Math.round(degrees / 45) % 8;

    return arrows[index];

}