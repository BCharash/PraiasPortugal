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
 */

const HYDROGRAPHIC_ZERO_OFFSET = 2.0;


//--------------------------------------------------
// Tide Information
//--------------------------------------------------

function getTideInformation(marine) {

    if (!marine || !marine.hourly)
        return null;

    const hourly = marine.hourly;

    const heights = hourly.seaLevel.map(level =>
        level + HYDROGRAPHIC_ZERO_OFFSET);

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