//--------------------------------------------------
// Application Startup
//--------------------------------------------------

async function initializeApplication() {

    await initializeData();

    initializeDashboard();

    //--------------------------------------------------
    // Dashboard
    //--------------------------------------------------

    // Set the initial dashboard background theme.
    // This will eventually be determined by the current
    // weather conditions.
    updateBackground("sunny");

    //--------------------------------------------------
    // User Interface
    //--------------------------------------------------

    populateRegions();

    regionSelect.addEventListener("change", () => {
        populateBeachComplexes(regionSelect.value);
    });

    beachComplexSelect.addEventListener("change", () => {
        populateBeaches(beachComplexSelect.value);
    });

    beachSelect.addEventListener("change", () => {
        displayBeach(beachSelect.value);
    });

}