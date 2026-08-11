/*
 * --------------------------------------------------
 * marineService.js
 * --------------------------------------------------
 *
 * Purpose:
 *     Retrieve marine conditions from the
 *     Open-Meteo Marine API.
 *
 * Responsibilities:
 *     - Request marine data.
 *     - Extract current marine conditions.
 *     - Extract hourly marine data.
 *     - Return a clean JavaScript object.
 *
 * Notes:
 *     - Wave directions describe where waves come from.
 *     - Ocean current direction describes where the
 *       current is heading.
 *     - Secondary and tertiary swell data may be
 *       unavailable for some model/location combinations.
 */

//--------------------------------------------------
// Marine Conditions
//--------------------------------------------------

/*
 * Retrieve the marine conditions.
 *
 * Parameters:
 *     beach - Beach object containing latitude and longitude.
 *
 * Returns:
 *     Marine conditions.
 */
async function getCurrentMarineConditions(beach) {

    const url =
        `https://marine-api.open-meteo.com/v1/marine` +
        `?latitude=${beach.latitude}` +
        `&longitude=${beach.longitude}` +
        `&current=` +
        `sea_surface_temperature,` +
        `wave_height,` +
        `wave_direction,` +
        `wave_period,` +
        `wave_peak_period,` +
        `wind_wave_height,` +
        `wind_wave_direction,` +
        `wind_wave_period,` +
        `wind_wave_peak_period,` +
        `swell_wave_height,` +
        `swell_wave_direction,` +
        `swell_wave_period,` +
        `swell_wave_peak_period,` +
        `secondary_swell_wave_height,` +
        `secondary_swell_wave_direction,` +
        `secondary_swell_wave_period,` +
        `tertiary_swell_wave_height,` +
        `tertiary_swell_wave_direction,` +
        `tertiary_swell_wave_period,` +
        `ocean_current_velocity,` +
        `ocean_current_direction,` +
        `sea_level_height_msl` +
        `&hourly=` +
        `sea_surface_temperature,` +
        `wave_height,` +
        `wave_direction,` +
        `wave_period,` +
        `wave_peak_period,` +
        `wind_wave_height,` +
        `wind_wave_direction,` +
        `wind_wave_period,` +
        `wind_wave_peak_period,` +
        `swell_wave_height,` +
        `swell_wave_direction,` +
        `swell_wave_period,` +
        `swell_wave_peak_period,` +
        `secondary_swell_wave_height,` +
        `secondary_swell_wave_direction,` +
        `secondary_swell_wave_period,` +
        `tertiary_swell_wave_height,` +
        `tertiary_swell_wave_direction,` +
        `tertiary_swell_wave_period,` +
        `ocean_current_velocity,` +
        `ocean_current_direction,` +
        `sea_level_height_msl`;

    const response = await fetch(url);

    if (!response.ok)
        throw new Error("Unable to retrieve marine conditions.");

    const data = await response.json();

    //--------------------------------------------------
    // Current
    //--------------------------------------------------

    const current = data.current;

    //--------------------------------------------------
    // Hourly
    //--------------------------------------------------

    const hourly = data.hourly;

    //--------------------------------------------------
    // Marine Object
    //--------------------------------------------------

    return {

        //--------------------------------------------------
        // Sea
        //--------------------------------------------------

        sea: {

            temperature: current.sea_surface_temperature

        },

        //--------------------------------------------------
        // Total Waves
        //--------------------------------------------------

        waves: {

            height: current.wave_height,
            direction: current.wave_direction,
            period: current.wave_period,
            peakPeriod: current.wave_peak_period

        },

        //--------------------------------------------------
        // Wind Waves
        //--------------------------------------------------

        windWaves: {

            height: current.wind_wave_height,
            direction: current.wind_wave_direction,
            period: current.wind_wave_period,
            peakPeriod: current.wind_wave_peak_period

        },

        //--------------------------------------------------
        // Primary Swell
        //--------------------------------------------------

        swell: {

            height: current.swell_wave_height,
            direction: current.swell_wave_direction,
            period: current.swell_wave_period,
            peakPeriod: current.swell_wave_peak_period

        },

        //--------------------------------------------------
        // Secondary Swell
        //--------------------------------------------------

        secondarySwell: {

            height: current.secondary_swell_wave_height,
            direction: current.secondary_swell_wave_direction,
            period: current.secondary_swell_wave_period

        },

        //--------------------------------------------------
        // Tertiary Swell
        //--------------------------------------------------

        tertiarySwell: {

            height: current.tertiary_swell_wave_height,
            direction: current.tertiary_swell_wave_direction,
            period: current.tertiary_swell_wave_period

        },

        //--------------------------------------------------
        // Ocean Current
        //--------------------------------------------------

        current: {

            velocity: current.ocean_current_velocity,
            direction: current.ocean_current_direction

        },

        //--------------------------------------------------
        // Sea Level / Tide
        //--------------------------------------------------

        tide: {

            seaLevel: current.sea_level_height_msl

        },

        //--------------------------------------------------
        // Hourly Data
        //--------------------------------------------------

        hourly: {

            time: hourly.time,

            seaTemperature:
                hourly.sea_surface_temperature,

            waves: {

                height: hourly.wave_height,
                direction: hourly.wave_direction,
                period: hourly.wave_period,
                peakPeriod: hourly.wave_peak_period

            },

            windWaves: {

                height: hourly.wind_wave_height,
                direction: hourly.wind_wave_direction,
                period: hourly.wind_wave_period,
                peakPeriod: hourly.wind_wave_peak_period

            },

            swell: {

                height: hourly.swell_wave_height,
                direction: hourly.swell_wave_direction,
                period: hourly.swell_wave_period,
                peakPeriod: hourly.swell_wave_peak_period

            },

            secondarySwell: {

                height: hourly.secondary_swell_wave_height,
                direction: hourly.secondary_swell_wave_direction,
                period: hourly.secondary_swell_wave_period

            },

            tertiarySwell: {

                height: hourly.tertiary_swell_wave_height,
                direction: hourly.tertiary_swell_wave_direction,
                period: hourly.tertiary_swell_wave_period

            },

            current: {

                velocity: hourly.ocean_current_velocity,
                direction: hourly.ocean_current_direction

            },

            tide: {

                seaLevel: hourly.sea_level_height_msl

            }

        }

    };

}