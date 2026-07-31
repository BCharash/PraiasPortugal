/*
 * --------------------------------------------------
 * display.js
 * --------------------------------------------------
 *
 * Purpose:
 *     Display information in the user interface.
 *
 * Responsibilities:
 *     - Display information about the selected beach.
 *
 * This module should not:
 *     - Load data.
 *     - Search for data.
 *     - Start the application.
 */

//--------------------------------------------------
// Display Helpers
//--------------------------------------------------

/*
 * Display text in an HTML element.
 *
 * Parameters:
 *     element - The HTML element to update.
 *     value   - The value to display.
 *
 * If the value is null or undefined, an empty string
 * is displayed instead.
 */
function setText(element, value) {

    element.textContent = value ?? "";

}


//--------------------------------------------------
// Beach Display
//--------------------------------------------------

/*
 * Display the information for the selected beach.
 *
 * Parameters:
 *     beachId - The unique identifier of the beach.
 */
async function displayBeach(beachId) {

    const beach = findBeach(beachId);

    if (!beach)
        return;

    //--------------------------------------------------
    // Current Weather
    //--------------------------------------------------

    const weather = await getCurrentWeather(beach);

    //--------------------------------------------------
    // Beach Information
    //--------------------------------------------------

    setText(regionSpan, beach.region);
    setText(municipalitySpan, beach.municipality);
    setText(districtSpan, beach.district);
    setText(latitudeSpan, beach.latitude);
    setText(longitudeSpan, beach.longitude);

    //--------------------------------------------------
    // Dashboard
    //--------------------------------------------------

    updateDashboard(beach, weather);

}