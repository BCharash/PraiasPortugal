//--------------------------------------------------
// Application State
//--------------------------------------------------

const appState = {

    currentPage: "dashboard",

    selectedBeachId: null,

    settings: {

        temperatureUnit: "celsius",

        windSpeedUnit: "kmh",

        waveHeightUnit: "meters",

        startupPage: "dashboard",

        startupBeach: "last",

        autoUpdateOnStartup: true,

        language: "en"

    }

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
// Settings Controls
//--------------------------------------------------

const temperatureUnitSelect =
    document.getElementById("temperatureUnitSelect");

const windSpeedUnitSelect =
    document.getElementById("windSpeedUnitSelect");

const waveHeightUnitSelect =
    document.getElementById("waveHeightUnitSelect");

const startupPageSelect =
    document.getElementById("startupPageSelect");

const startupBeachSelect =
    document.getElementById("startupBeachSelect");

const autoUpdateOnStartup =
    document.getElementById("autoUpdateOnStartup");

const languageSelect =
    document.getElementById("languageSelect");


//--------------------------------------------------
// Settings Storage
//--------------------------------------------------

const SETTINGS_STORAGE_KEY =
    "praiasDePortugalSettings";

const BEACH_STORAGE_KEY =
    "praiasDePortugalSelectedBeach";


//--------------------------------------------------
// Load Settings
//--------------------------------------------------

function loadSettings() {

    const storedSettings =
        localStorage.getItem(
            SETTINGS_STORAGE_KEY
        );

    if (!storedSettings)
        return;

    try {

        const settings =
            JSON.parse(storedSettings);

        appState.settings = {

            ...appState.settings,

            ...settings

        };

    }
    catch (error) {

        // Ignore invalid stored settings.
        // Defaults remain active.

    }

}


//--------------------------------------------------
// Save Settings
//--------------------------------------------------

function saveSettings() {

    localStorage.setItem(

        SETTINGS_STORAGE_KEY,

        JSON.stringify(
            appState.settings
        )

    );

}


//--------------------------------------------------
// Load Selected Beach
//--------------------------------------------------

function loadSelectedBeach() {

    const beachId =
        localStorage.getItem(
            BEACH_STORAGE_KEY
        );

    if (beachId)
        appState.selectedBeachId =
            beachId;

}


//--------------------------------------------------
// Save Selected Beach
//--------------------------------------------------

function saveSelectedBeach(beachId) {

    appState.selectedBeachId =
        beachId;

    localStorage.setItem(

        BEACH_STORAGE_KEY,

        beachId

    );

}


//--------------------------------------------------
// Synchronize Settings Controls
//--------------------------------------------------

function updateSettingsControls() {

    temperatureUnitSelect.value =
        appState.settings.temperatureUnit;

    windSpeedUnitSelect.value =
        appState.settings.windSpeedUnit;

    waveHeightUnitSelect.value =
        appState.settings.waveHeightUnit;

    startupPageSelect.value =
        appState.settings.startupPage;

    startupBeachSelect.value =
        appState.settings.startupBeach;

    autoUpdateOnStartup.checked =
        appState.settings.autoUpdateOnStartup;

    languageSelect.value =
        appState.settings.language;

}


//--------------------------------------------------
// Settings Changes
//--------------------------------------------------

async function handleSettingsChange() {

    //--------------------------------------------------
    // Read Current Settings
    //--------------------------------------------------

    appState.settings.temperatureUnit =
        temperatureUnitSelect.value;

    appState.settings.windSpeedUnit =
        windSpeedUnitSelect.value;

    appState.settings.waveHeightUnit =
        waveHeightUnitSelect.value;

    appState.settings.startupPage =
        startupPageSelect.value;

    appState.settings.startupBeach =
        startupBeachSelect.value;

    appState.settings.autoUpdateOnStartup =
        autoUpdateOnStartup.checked;

    appState.settings.language =
        languageSelect.value;


    //--------------------------------------------------
    // Save
    //--------------------------------------------------

    saveSettings();


    //--------------------------------------------------
    // Refresh Current Beach
    //--------------------------------------------------

    if (appState.selectedBeachId) {

        await displayBeach(
            appState.selectedBeachId
        );

    }

}


//--------------------------------------------------
// Show Page
//--------------------------------------------------

function showPage(page) {

    appState.currentPage =
        page;

    dashboardPage.hidden =
        page !== "dashboard";

    beachesPage.hidden =
        page !== "beaches";

    settingsPage.hidden =
        page !== "settings";

}


//--------------------------------------------------
// Show Dashboard
//--------------------------------------------------

function showDashboard() {

    showPage("dashboard");

}


//--------------------------------------------------
// Show Beaches
//--------------------------------------------------

function showBeaches() {

    showPage("beaches");

}


//--------------------------------------------------
// Show Settings
//--------------------------------------------------

function showSettings() {

    showPage("settings");

}


//--------------------------------------------------
// Application Startup
//--------------------------------------------------

async function initializeApplication() {

    //--------------------------------------------------
    // Load Persistent State
    //--------------------------------------------------

    loadSettings();

    loadSelectedBeach();


    //--------------------------------------------------
    // Initialize Data
    //--------------------------------------------------

    await initializeData();


    //--------------------------------------------------
    // Initialize Dashboard
    //--------------------------------------------------

    initializeDashboard();


    //--------------------------------------------------
    // Initial Dashboard Background
    //--------------------------------------------------

    updateBackground("sunny");


    //--------------------------------------------------
    // Synchronize Settings UI
    //--------------------------------------------------

    updateSettingsControls();


    //--------------------------------------------------
    // Populate Beaches
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
    // Settings
    //--------------------------------------------------

    temperatureUnitSelect.addEventListener(
        "change",
        handleSettingsChange
    );

    windSpeedUnitSelect.addEventListener(
        "change",
        handleSettingsChange
    );

    waveHeightUnitSelect.addEventListener(
        "change",
        handleSettingsChange
    );

    startupPageSelect.addEventListener(
        "change",
        handleSettingsChange
    );

    startupBeachSelect.addEventListener(
        "change",
        handleSettingsChange
    );

    autoUpdateOnStartup.addEventListener(
        "change",
        handleSettingsChange
    );

    languageSelect.addEventListener(
        "change",
        handleSettingsChange
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

            saveSelectedBeach(
                beachId
            );

            await displayBeach(
                beachId
            );

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