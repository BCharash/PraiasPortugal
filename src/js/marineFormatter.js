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
 *     - Ocean current direction describes where the
 *       current is heading.
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

    return `${marine.sea.temperature.toFixed(1)}°C`;

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

    const arrow =
        getDirectionArrow(marine.waves.direction);

    const direction =
        getCompassDirection(marine.waves.direction);

    return `${marine.waves.height.toFixed(1)} m ` +
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
        getDirectionArrow(marine.waves.direction);

    const direction =
        getCompassDirection(marine.waves.direction);

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

    const arrow =
        getDirectionArrow(marine.swell.direction);

    const direction =
        getCompassDirection(marine.swell.direction);

    return `${marine.swell.height.toFixed(1)} m ` +
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

    const arrow =
        getDirectionArrow(marine.windWaves.direction);

    const direction =
        getCompassDirection(marine.windWaves.direction);

    return `${marine.windWaves.height.toFixed(1)} m ` +
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

    const arrow =
        getDirectionArrow(marine.current.direction);

    const direction =
        getCompassDirection(marine.current.direction);

    return `${marine.current.velocity.toFixed(1)} km/h ` +
           `${arrow} ${direction}`;

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