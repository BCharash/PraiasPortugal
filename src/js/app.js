//--------------------------------------------------
// User Interface
//--------------------------------------------------

const regionSelect = document.getElementById("regionSelect");
const beachComplexSelect = document.getElementById("beachComplexSelect");
const beachSelect = document.getElementById("beachSelect");

const regionSpan = document.getElementById("region");
const municipalitySpan = document.getElementById("municipality");
const districtSpan = document.getElementById("district");
const latitudeSpan = document.getElementById("latitude");
const longitudeSpan = document.getElementById("longitude");


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
    console.log("Reached initializeApplication");
    
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




//--------------------------------------------------
// Application Entry Point
//--------------------------------------------------

initializeApplication();