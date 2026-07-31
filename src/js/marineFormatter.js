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
 *     - Convert wave direction to compass text.
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

    if (!marine || marine.waveHeight == null)
        return "--";

    let text = `${marine.waveHeight.toFixed(1)} m`;

    if (marine.wavePeriod != null)
        text += ` @ ${Math.round(marine.wavePeriod)} s`;

    return text;

}


/*
 * Format the wave direction.
 */
function formatWaveDirection(marine) {

    if (!marine || marine.waveDirection == null)
        return "--";

    const direction = getCompassDirection(marine.waveDirection);

    return `${direction} ${Math.round(marine.waveDirection)}°`;

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