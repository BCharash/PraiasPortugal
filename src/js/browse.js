/*
--------------------------------------------------
browse.js
--------------------------------------------------

Purpose:

    Populate the drop-down lists that allow the
    user to browse beaches.

Responsibilities:

    - Populate the Region list.
    - Populate the Beach Complex list.
    - Populate the Beach list.

This module should not:

    - Load data.
    - Display beach information.
    - Start the application.
*/

//--------------------------------------------------
// Browse Helpers
//--------------------------------------------------

/*
--------------------------------------------------
Add an option to a select control.

Parameters:

    select - The select element to update.
    value  - The option value.
    text   - The text displayed to the user.
--------------------------------------------------
*/
function addOption(select, value, text) {

    const option = document.createElement("option");

    option.value = value;
    option.textContent = text;

    select.appendChild(option);
}


//--------------------------------------------------
// Region Browsing
//--------------------------------------------------

/*
--------------------------------------------------
Populate the Region drop-down list.
--------------------------------------------------
*/
function populateRegions() {

    const regions = getRegions();

    regionSelect.innerHTML = "";

    regions.forEach(region => {

        addOption(
            regionSelect,
            region,
            region
        );

    });

    if (regions.length > 0) {

        regionSelect.value = regions[0];

        populateBeachComplexes(
            regions[0]
        );

    }

}


//--------------------------------------------------
// Beach Complex Browsing
//--------------------------------------------------

/*
--------------------------------------------------
Populate the Beach Complex drop-down list for
the selected region.

Parameters:

    region - The selected region.
--------------------------------------------------
*/
function populateBeachComplexes(region) {

    beachComplexSelect.innerHTML = "";

    const complexes =
        getBeachComplexes(region);

    complexes.forEach(complex => {

        addOption(
            beachComplexSelect,
            complex.id,
            complex.name
        );

    });

    if (complexes.length > 0) {

        beachComplexSelect.value =
            complexes[0].id;

        populateBeaches(
            complexes[0].id
        );

    }

}


//--------------------------------------------------
// Beach Browsing
//--------------------------------------------------

/*
--------------------------------------------------
Populate the Beach drop-down list for the
selected beach complex.

Parameters:

    beachComplexId - The selected beach complex.

Note:
    This function only populates the list.
    It does not display or select a beach.
--------------------------------------------------
*/
function populateBeaches(beachComplexId) {

    beachSelect.innerHTML = "";

    const beaches =
        getBeaches(beachComplexId);

    beaches.forEach(beach => {

        addOption(
            beachSelect,
            beach.id,
            beach.name
        );

    });

    if (beaches.length > 0) {

        beachSelect.value =
            beaches[0].id;

    }

}