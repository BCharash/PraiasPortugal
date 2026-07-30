//--------------------------------------------------
// Beach Display
//--------------------------------------------------

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

    regionSpan.textContent = beach.region;
    municipalitySpan.textContent = beach.municipality;
    districtSpan.textContent = beach.district;
    latitudeSpan.textContent = beach.latitude ?? "";
    longitudeSpan.textContent = beach.longitude ?? "";

}
