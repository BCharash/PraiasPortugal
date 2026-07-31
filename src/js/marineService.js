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
 *     - Extract the current conditions.
 *     - Extract the hourly marine data.
 *     - Return a clean JavaScript object.
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
        `wave_period` +
        `&hourly=` +
        `sea_surface_temperature,` +
        `wave_height,` +
        `wave_direction,` +
        `wave_period,` +
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
        // Current Conditions
        //--------------------------------------------------

        seaTemperature: current.sea_surface_temperature,

        waveHeight: current.wave_height,
        waveDirection: current.wave_direction,
        wavePeriod: current.wave_period,

        //--------------------------------------------------
        // Hourly Data
        //--------------------------------------------------

        hourly: {

            time: hourly.time,

            seaTemperature: hourly.sea_surface_temperature,

            waveHeight: hourly.wave_height,
            waveDirection: hourly.wave_direction,
            wavePeriod: hourly.wave_period,

            seaLevel: hourly.sea_level_height_msl

        }

    };

}