/*
 * --------------------------------------------------
 * tideService.js
 * --------------------------------------------------
 *
 * Purpose:
 *     Derive tide information from marine data.
 *
 * Responsibilities:
 *     - Convert sea level to Hydrographic Zero.
 *     - Determine whether the tide is rising.
 *     - Find the next high tide.
 *     - Find the next low tide.
 *
 * Notes:
 *     - Open-Meteo provides sea level relative to
 *       Mean Sea Level.
 *     - The application converts this to an
 *       approximate Portuguese Hydrographic Zero.
 */

//--------------------------------------------------
// Constants
//--------------------------------------------------

const HYDROGRAPHIC_ZERO_OFFSET = 2.08;


//--------------------------------------------------
// Tide Information
//--------------------------------------------------

/*
 * Derive tide information from hourly marine data.
 *
 * Parameters:
 *     marine - Marine data object.
 *
 * Returns:
 *     Tide information, or null if hourly tide data
 *     are unavailable.
 */
function getTideInformation(marine) {

    if (!marine ||
        !marine.hourly ||
        !marine.hourly.tide ||
        !marine.hourly.tide.seaLevel)
        return null;

    const hourly = marine.hourly;

    //--------------------------------------------------
    // Sea Level
    //--------------------------------------------------

    const heights = hourly.tide.seaLevel.map(level =>
        level + HYDROGRAPHIC_ZERO_OFFSET
    );

    //--------------------------------------------------
    // Current Time
    //--------------------------------------------------

    const now = new Date();

    //--------------------------------------------------
    // Current Index
    //--------------------------------------------------

    let currentIndex = 0;

    for (let i = 0; i < hourly.time.length; i++) {

        if (new Date(hourly.time[i]) > now)
            break;

        currentIndex = i;

    }

    //--------------------------------------------------
    // Rising / Falling
    //--------------------------------------------------

    const isRising =
        currentIndex < heights.length - 1 &&
        heights[currentIndex + 1] > heights[currentIndex];

    //--------------------------------------------------
    // Next High
    //--------------------------------------------------

    let nextHigh = null;

    for (let i = currentIndex + 1; i < heights.length - 1; i++) {

        if (heights[i] >= heights[i - 1] &&
            heights[i] >= heights[i + 1]) {

            nextHigh = {

                time: hourly.time[i],
                height: heights[i]

            };

            break;

        }

    }

    //--------------------------------------------------
    // Next Low
    //--------------------------------------------------

    let nextLow = null;

    for (let i = currentIndex + 1; i < heights.length - 1; i++) {

        if (heights[i] <= heights[i - 1] &&
            heights[i] <= heights[i + 1]) {

            nextLow = {

                time: hourly.time[i],
                height: heights[i]

            };

            break;

        }

    }

    //--------------------------------------------------
    // Return Tide Information
    //--------------------------------------------------

    return {

        currentHeight: heights[currentIndex],

        isRising,

        nextHigh,
        nextLow,

        heights,
        times: hourly.time

    };

}