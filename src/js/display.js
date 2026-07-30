//--------------------------------------------------
// Beach Display
//--------------------------------------------------

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
