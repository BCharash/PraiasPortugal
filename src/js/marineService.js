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
 *     - Extract daily marine summaries.
 *     - Record when the application fetched the data.
 *     - Return a clean JavaScript object.
 *
 * Notes:
 *     - Wave directions describe where waves come from.
 *     - Ocean current direction describes where the
 *       current is heading.
 *     - Secondary and tertiary swell data may be
 *       unavailable for some model/location combinations.
 *     - FetchedAt records when Praias de Portugal
 *       retrieved the data. It does not represent
 *       the underlying model's update time.
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

    const fetchedAt = new Date().toISOString();

    const url =
        `https://marine-api.open-meteo.com/v1/marine` +
        `?latitude=${beach.latitude}` +
        `&longitude=${beach.longitude}` +
        `&timezone=auto` +
        `&forecast_days=7` +
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
        `sea_level_height_msl` +
        `&daily=` +
        `wave_height_max,` +
        `wave_direction_dominant,` +
        `wave_period_max,` +
        `wind_wave_height_max,` +
        `wind_wave_direction_dominant,` +
        `wind_wave_period_max,` +
        `wind_wave_peak_period_max,` +
        `swell_wave_height_max,` +
        `swell_wave_direction_dominant,` +
        `swell_wave_period_max,` +
        `swell_wave_peak_period_max`;

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
    // Daily
    //--------------------------------------------------

    const daily = data.daily;

    //--------------------------------------------------
    // Marine Object
    //--------------------------------------------------

    return {

        //--------------------------------------------------
        // Data Source
        //--------------------------------------------------

        source: "Open-Meteo Marine API",

        fetchedAt,

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

        },

        //--------------------------------------------------
        // Daily Data
        //--------------------------------------------------

        daily: {

            time: daily.time,

            waves: {

                heightMax: daily.wave_height_max,
                directionDominant:
                    daily.wave_direction_dominant,
                periodMax: daily.wave_period_max

            },

            windWaves: {

                heightMax:
                    daily.wind_wave_height_max,

                directionDominant:
                    daily.wind_wave_direction_dominant,

                periodMax:
                    daily.wind_wave_period_max,

                peakPeriodMax:
                    daily.wind_wave_peak_period_max

            },

            swell: {

                heightMax:
                    daily.swell_wave_height_max,

                directionDominant:
                    daily.swell_wave_direction_dominant,

                periodMax:
                    daily.swell_wave_period_max,

                peakPeriodMax:
                    daily.swell_wave_peak_period_max

            }

        }

    };

}