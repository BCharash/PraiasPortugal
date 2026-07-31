/*
 * --------------------------------------------------
 * marineService.js
 * --------------------------------------------------
 *
 * Purpose:
 *     Retrieve current marine conditions from the
 *     Open-Meteo Marine API.
 *
 * Responsibilities:
 *     - Request marine data.
 *     - Extract the current conditions.
 *     - Return a clean JavaScript object.
 */

//--------------------------------------------------
// Marine Conditions
//--------------------------------------------------

/*
 * Retrieve the current marine conditions.
 *
 * Parameters:
 *     beach - Beach object containing latitude and longitude.
 *
 * Returns:
 *     Current marine conditions.
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
        `wave_period`;

    const response = await fetch(url);

    if (!response.ok)
        throw new Error("Unable to retrieve marine conditions.");

    const data = await response.json();

    const current = data.current;

    return {

        seaTemperature: current.sea_surface_temperature,

        waveHeight: current.wave_height,
        waveDirection: current.wave_direction,
        wavePeriod: current.wave_period

    };

}