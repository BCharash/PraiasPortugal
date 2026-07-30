//--------------------------------------------------
// Beach Display
//--------------------------------------------------

/*
 * Display text in an HTML element.
 *
 * Parameters:
 *     element - The HTML element to update.
 *     value   - The value to display.
 *
 * If the value is null or undefined, an empty string is displayed.
 */
function setText(element, value) {

    element.textContent = value ?? "";

}


/*
 * Display the information for the selected beach.
 *
 * Parameters:
 *     beachId - The unique identifier of the beach to display.
 */
function displayBeach(beachId) {

    const beach = findBeach(beachId);

    if (!beach)
        return;

    setText(regionSpan, beach.region);
    setText(municipalitySpan, beach.municipality);
    setText(districtSpan, beach.district);
    setText(latitudeSpan, beach.latitude);
    setText(longitudeSpan, beach.longitude);

}