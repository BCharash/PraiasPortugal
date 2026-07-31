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

    return `${tide.currentHeight.toFixed(1)} m`;

}


/*
 * Format the tide trend.
 */
function formatTideTrend(tide) {

    if (!tide)
        return "--";

    return tide.isRising ? "↑ Rising" : "↓ Falling";

}


/*
 * Format the next high tide.
 */
function formatNextHighTide(tide) {

    if (!tide || !tide.nextHigh)
        return "--";

    return `↑ ${formatTime(tide.nextHigh.time)} (${tide.nextHigh.height.toFixed(1)} m)`;

}


/*
 * Format the next low tide.
 */
function formatNextLowTide(tide) {

    if (!tide || !tide.nextLow)
        return "--";

    return `↓ ${formatTime(tide.nextLow.time)} (${tide.nextLow.height.toFixed(1)} m)`;

}


//--------------------------------------------------
// Private Helpers
//--------------------------------------------------

function formatTime(isoTime) {

    const date = new Date(isoTime);

    return date.toLocaleTimeString([], {

        hour: "2-digit",
        minute: "2-digit"

    });

}