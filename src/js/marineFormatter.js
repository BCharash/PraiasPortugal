/*
 * --------------------------------------------------
 * marineFormatter.js
 * --------------------------------------------------
 *
 * Purpose:
 *     Format marine conditions for display.
 *
 * Responsibilities:
 *     - Format sea temperature.
 *     - Format wave conditions.
 *     - Format swell conditions.
 *     - Format wind-wave conditions.
 *     - Format ocean current conditions.
 *     - Convert marine directions to text.
 *
 * Notes:
 *     - Wave and swell directions describe where waves
 *       are coming from.
 *
 *     - Ocean current direction describes where the
 *       current is heading.
 *
 *     - Wave height and sea temperature use the
 *       application unit settings.
 */

//--------------------------------------------------
// Public Formatters
//--------------------------------------------------

/*
 * Format the sea surface temperature.
 */
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


/*
 * Format the total wave conditions.
 */
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


/*
 * Format the total wave direction.
 */
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


/*
 * Format the primary swell.
 */
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


/*
 * Format the wind waves.
 */
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


/*
 * Format the ocean current.
 *
 * Current direction indicates where the current
 * is heading, rather than where it comes from.
 */
function formatOceanCurrent(marine) {

    if (!marine ||
        !marine.current ||
        marine.current.velocity == null ||
        marine.current.direction == null)
        return "--";

    const velocity =
        marine.current.velocity;

    const arrow =
        getDirectionArrow(
            marine.current.direction
        );

    const direction =
        getCompassDirection(
            marine.current.direction
        );

    return `${velocity.toFixed(1)} km/h ` +
           `${arrow} ${direction}`;

}


//--------------------------------------------------
// Temperature Conversion
//--------------------------------------------------

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


//--------------------------------------------------
// Wave Height Conversion
//--------------------------------------------------

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


//--------------------------------------------------
// Private Helpers
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