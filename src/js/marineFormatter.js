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
 *     - Format surf conditions.
 *     - Convert wave direction to text.
 */

//--------------------------------------------------
// Public Formatters
//--------------------------------------------------

/*
 * Format the sea surface temperature.
 */
function formatSeaTemperature(marine) {

    if (!marine || marine.seaTemperature == null)
        return "--";

    return `${marine.seaTemperature.toFixed(1)}°C`;

}


/*
 * Format the surf conditions.
 */
function formatSurf(marine) {

    if (!marine ||
        marine.waveHeight == null ||
        marine.waveDirection == null ||
        marine.wavePeriod == null)
        return "--";

    const arrow = getDirectionArrow(marine.waveDirection);
    const direction = getCompassDirection(marine.waveDirection);

    return `${marine.waveHeight.toFixed(1)} m ${arrow} ${direction} @ ${Math.round(marine.wavePeriod)} s`;

}


/*
 * Format the wave direction.
 */
function formatWaveDirection(marine) {

    if (!marine || marine.waveDirection == null)
        return "--";

    const arrow = getDirectionArrow(marine.waveDirection);
    const direction = getCompassDirection(marine.waveDirection);

    return `${arrow} ${direction} ${Math.round(marine.waveDirection)}°`;

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

    const index = Math.round(degrees / 45) % 8;

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

    const index = Math.round(degrees / 45) % 8;

    return arrows[index];

}