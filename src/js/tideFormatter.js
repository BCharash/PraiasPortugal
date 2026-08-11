/*
 * --------------------------------------------------
 * tideFormatter.js
 * --------------------------------------------------
 *
 * Purpose:
 *     Format tide information for display.
 *
 * Responsibilities:
 *     - Format the current tide height.
 *     - Format the tide trend.
 *     - Format the next high tide.
 *     - Format the next low tide.
 *
 * Notes:
 *     - Tide height uses the application's
 *       wave-height unit setting.
 */

//--------------------------------------------------
// Public Formatters
//--------------------------------------------------

/*
 * Format the current tide height.
 */
function formatCurrentTideHeight(tide) {

    if (!tide || tide.currentHeight == null)
        return "--";

    const height =
        convertTideHeight(tide.currentHeight);

    return `${height.toFixed(1)} ${getTideHeightSymbol()}`;

}


/*
 * Format the tide trend.
 */
function formatTideTrend(tide) {

    if (!tide)
        return "--";

    return tide.isRising
        ? "↑ Rising"
        : "↓ Falling";

}


/*
 * Format the next high tide.
 */
function formatNextHighTide(tide) {

    if (!tide || !tide.nextHigh)
        return "--";

    const height =
        convertTideHeight(tide.nextHigh.height);

    return `↑ ${formatTime(tide.nextHigh.time)} ` +
           `(${height.toFixed(1)} ${getTideHeightSymbol()})`;

}


/*
 * Format the next low tide.
 */
function formatNextLowTide(tide) {

    if (!tide || !tide.nextLow)
        return "--";

    const height =
        convertTideHeight(tide.nextLow.height);

    return `↓ ${formatTime(tide.nextLow.time)} ` +
           `(${height.toFixed(1)} ${getTideHeightSymbol()})`;

}


//--------------------------------------------------
// Tide Height Conversion
//--------------------------------------------------

function convertTideHeight(meters) {

    if (typeof appState !== "undefined" &&
        appState.settings &&
        appState.settings.waveHeightUnit === "feet") {

        return meters * 3.28084;

    }

    return meters;

}


function getTideHeightSymbol() {

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

/*
 * Format an ISO date/time as HH:MM.
 */
function formatTime(isoTime) {

    const date =
        new Date(isoTime);

    return date.toLocaleTimeString([], {

        hour: "2-digit",
        minute: "2-digit"

    });

}