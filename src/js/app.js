//--------------------------------------------------
// Application State
//--------------------------------------------------

const appState = {

    currentPage: "dashboard",

    selectedBeachId: null

};


//--------------------------------------------------
// User Interface
//--------------------------------------------------

const regionSelect =
    document.getElementById("regionSelect");

const beachComplexSelect =
    document.getElementById("beachComplexSelect");

const beachSelect =
    document.getElementById("beachSelect");

const regionSpan =
    document.getElementById("region");

const municipalitySpan =
    document.getElementById("municipality");

const districtSpan =
    document.getElementById("district");

const latitudeSpan =
    document.getElementById("latitude");

const longitudeSpan =
    document.getElementById("longitude");


//--------------------------------------------------
// Pages
//--------------------------------------------------

const dashboardPage =
    document.getElementById("dashboardPage");

const beachesPage =
    document.getElementById("beachesPage");

const settingsPage =
    document.getElementById("settingsPage");


//--------------------------------------------------
// Navigation
//--------------------------------------------------

const dashboardNavButton =
    document.getElementById("dashboardNavButton");

const beachesNavButton =
    document.getElementById("beachesNavButton");

const settingsNavButton =
    document.getElementById("settingsNavButton");


//--------------------------------------------------
// Show Page
//--------------------------------------------------

function showPage(page) {

    appState.currentPage = page;

    dashboardPage.hidden =
        page !== "dashboard";

    beachesPage.hidden =
        page !== "beaches";

    settingsPage.hidden =
        page !== "settings";

}


//--------------------------------------------------
// Dashboard
//--------------------------------------------------

function showDashboard() {

    showPage("dashboard");

}


//--------------------------------------------------
// Beaches
//--------------------------------------------------

function showBeaches() {

    showPage("beaches");

}


//--------------------------------------------------
// Settings
//--------------------------------------------------

function showSettings() {

    showPage("settings");

}


//--------------------------------------------------
// Application Startup
//--------------------------------------------------

async function initializeApplication() {

    await initializeData();

    initializeDashboard();


    //--------------------------------------------------
    // Initial Dashboard Background
    //--------------------------------------------------

    updateBackground("sunny");


    //--------------------------------------------------
    // Beach Selection
    //--------------------------------------------------

    populateRegions();


    //--------------------------------------------------
    // Navigation
    //--------------------------------------------------

    dashboardNavButton.addEventListener(
        "click",
        showDashboard
    );

    beachesNavButton.addEventListener(
        "click",
        showBeaches
    );

    settingsNavButton.addEventListener(
        "click",
        showSettings
    );


    //--------------------------------------------------
    // Region Selection
    //--------------------------------------------------

    regionSelect.addEventListener(
        "change",
        () => {

            populateBeachComplexes(
                regionSelect.value
            );

        }
    );


    //--------------------------------------------------
    // Beach Complex Selection
    //--------------------------------------------------

    beachComplexSelect.addEventListener(
        "change",
        () => {

            populateBeaches(
                beachComplexSelect.value
            );

        }
    );


    //--------------------------------------------------
    // Beach Selection
    //--------------------------------------------------

    beachSelect.addEventListener(
        "change",
        async () => {

            const beachId =
                beachSelect.value;

            appState.selectedBeachId =
                beachId;

            await displayBeach(beachId);

            showDashboard();

        }
    );


    //--------------------------------------------------
    // Initial Page
    //--------------------------------------------------

    showDashboard();

}


//--------------------------------------------------
// Application Entry Point
//--------------------------------------------------

initializeApplication();