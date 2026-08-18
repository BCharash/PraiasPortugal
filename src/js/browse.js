//--------------------------------------------------
// browse.js
//
// Purpose:
//
// Populate the drop-down lists that allow the
// user to browse beaches.
//
// Responsibilities:
//
// - Populate the Region list.
// - Populate the Area list.
// - Populate the Beach list.
//
// This module should not:
//
// - Load data.
// - Display beach information.
// - Start the application.
//--------------------------------------------------


//--------------------------------------------------
// Browse Helpers
//--------------------------------------------------

/*
 * Add an option to a select control.
 *
 * Parameters:
 *
 * select - The select element to update.
 * value  - The option value.
 * text   - The text displayed to the user.
 */

function addOption(select, value, text) {

    const option =
        document.createElement("option");

    option.value =
        value;

    option.textContent =
        text;

    select.appendChild(option);

}


//--------------------------------------------------
// Region Browsing
//--------------------------------------------------

/*
 * Populate the Region drop-down list.
 */

function populateRegions() {

    const regions =
        getRegions();


    regionSelect.innerHTML =
        "";


    regions.forEach(region => {

        addOption(
            regionSelect,
            region,
            region
        );

    });


    if (regions.length > 0) {

        regionSelect.value =
            regions[0];

        populateAreas(
            regions[0]
        );

    }

}


//--------------------------------------------------
// Area Browsing
//--------------------------------------------------

/*
 * Populate the Area drop-down list for
 * the selected region.
 *
 * Parameters:
 *
 * region - The selected region.
 */

function populateAreas(region) {

    areaSelect.innerHTML =
        "";


    const areas =
        getAreas(region);


    areas.forEach(area => {

        addOption(
            areaSelect,
            area.id,
            area.name
        );

    });


    if (areas.length > 0) {

        areaSelect.value =
            areas[0].id;

        populateBeaches(
            areas[0].id
        );

    }

}


//--------------------------------------------------
// Beach Browsing
//--------------------------------------------------

/*
 * Populate the Beach drop-down list for the
 * selected area.
 *
 * Parameters:
 *
 * areaId - The selected area.
 */

function populateBeaches(areaId) {

    beachSelect.innerHTML =
        "";


    const beaches =
        getBeaches(areaId);


    //--------------------------------------------------
    // Placeholder
    //--------------------------------------------------

    const placeholder =
        document.createElement("option");

    placeholder.value =
        "";

    placeholder.textContent =
        "Select a beach";

    placeholder.disabled =
        true;

    placeholder.selected =
        true;

    beachSelect.appendChild(
        placeholder
    );


    //--------------------------------------------------
    // Beaches
    //--------------------------------------------------

    beaches.forEach(beach => {

        addOption(
            beachSelect,
            beach.id,
            beach.name
        );

    });


    //--------------------------------------------------
    // No beach is selected automatically.
    //
    // The user must explicitly select a beach.
    //--------------------------------------------------

}