//--------------------------------------------------
// Praias de Portugal
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


//==================================================
// LANGUAGE SYSTEM
//==================================================

const translations = {

    en: {

        // Navigation
        dashboard: "Dashboard",
        beaches: "Beaches",
        settings: "Settings",

        // Dashboard
        selectedBeach: "Selected Beach",
        noBeachSelected: "No beach selected",
        alerts: "Alerts",
        noActiveAlerts: "No active alerts",
        currentConditions: "Current Conditions",

        air: "Air",
        sea: "Sea",
        wind: "Wind",
        surf: "Surf",
        swell: "Swell",
        tide: "Tide",
        uv: "UV",

        // Beach selection
        region: "Region",
        beachComplex: "Beach Complex",
        beach: "Beach",

        // Beach information
        beachInformation: "Selected Beach",
        municipality: "Municipality",
        district: "District",
        latitude: "Latitude",
        longitude: "Longitude",

        // Settings
        unitPreferences: "Unit Preferences",
        temperature: "Temperature",
        windSpeed: "Wind Speed",
        height: "Height",
        startup: "Startup",
        startupPage: "Startup Page",
        startupBeach: "Startup Beach",
        updateDataOnStartup: "Update data when application starts",
        language: "Language",

        // Options
        dashboardOption: "Dashboard",
        beachesOption: "Beaches",
        lastSelectedBeach: "Last selected beach",

        // General
        english: "English",
        portuguese: "Português"

    },


    pt: {

        // Navegação
        dashboard: "Painel",
        beaches: "Praias",
        settings: "Definições",

        // Painel
        selectedBeach: "Praia selecionada",
        noBeachSelected: "Nenhuma praia selecionada",
        alerts: "Alertas",
        noActiveAlerts: "Sem alertas ativos",
        currentConditions: "Condições atuais",

        air: "Ar",
        sea: "Mar",
        wind: "Vento",
        surf: "Surf",
        swell: "Ondulação",
        tide: "Maré",
        uv: "UV",

        // Seleção de praia
        region: "Região",
        beachComplex: "Conjunto de praias",
        beach: "Praia",

        // Informação da praia
        beachInformation: "Praia selecionada",
        municipality: "Município",
        district: "Distrito",
        latitude: "Latitude",
        longitude: "Longitude",

        // Definições
        unitPreferences: "Preferências de unidades",
        temperature: "Temperatura",
        windSpeed: "Velocidade do vento",
        height: "Altura",
        startup: "Arranque",
        startupPage: "Página inicial",
        startupBeach: "Praia inicial",
        updateDataOnStartup: "Atualizar dados ao iniciar a aplicação",
        language: "Idioma",

        // Opções
        dashboardOption: "Painel",
        beachesOption: "Praias",
        lastSelectedBeach: "Última praia selecionada",

        // Geral
        english: "English",
        portuguese: "Português"

    }

};


//--------------------------------------------------
// Translate
//--------------------------------------------------

function translate(key) {

    const language =
        appState.settings.language;

    return translations[language]?.[key]
        || translations.en[key]
        || key;

}


//--------------------------------------------------
// Translate Element Text
//--------------------------------------------------

function setTranslatedText(element, key) {

    if (!element)
        return;

    element.textContent =
        translate(key);

}


//--------------------------------------------------
// Translate Exact Existing Text
//
// This allows us to translate labels that currently
// do not have their own IDs in index.html.
//--------------------------------------------------

function translateExistingText() {

    const elements =
        document.querySelectorAll(
            "h1, h2, h3, label, td, button, option"
        );

    elements.forEach(element => {

        const original =
            element.dataset.translationKey;

        if (original) {

            element.textContent =
                translate(original);

            return;

        }

        const text =
            element.textContent.trim();

        const keyMap = {

            "Dashboard": "dashboard",
            "Painel": "dashboard",

            "Beaches": "beaches",
            "Praias": "beaches",

            "Settings": "settings",
            "Definições": "settings",

            "Selected Beach": "selectedBeach",
            "Praia selecionada": "selectedBeach",

            "No beach selected": "noBeachSelected",
            "Nenhuma praia selecionada": "noBeachSelected",

            "Alerts": "alerts",
            "Alertas": "alerts",

            "No active alerts": "noActiveAlerts",
            "Sem alertas ativos": "noActiveAlerts",

            "Current Conditions": "currentConditions",
            "Condições atuais": "currentConditions",

            "Air": "air",
            "Ar": "air",

            "Sea": "sea",
            "Mar": "sea",

            "Wind": "wind",
            "Vento": "wind",

            "Surf": "surf",

            "Swell": "swell",
            "Ondulação": "swell",

            "Tide": "tide",
            "Maré": "tide",

            "UV": "uv",

            "Region": "region",
            "Região": "region",

            "Beach Complex": "beachComplex",
            "Conjunto de praias": "beachComplex",

            "Beach": "beach",
            "Praia": "beach",

            "Municipality": "municipality",
            "Município": "municipality",

            "District": "district",

            "Latitude": "latitude",

            "Longitude": "longitude",

            "Unit Preferences": "unitPreferences",
            "Preferências de unidades": "unitPreferences",

            "Temperature": "temperature",
            "Temperatura": "temperature",

            "Wind Speed": "windSpeed",
            "Velocidade do vento": "windSpeed",

            "Height": "height",
            "Altura": "height",

            "Startup": "startup",
            "Arranque": "startup",

            "Startup Page": "startupPage",
            "Página inicial": "startupPage",

            "Startup Beach": "startupBeach",
            "Praia inicial": "startupBeach",

            "Language": "language",
            "Idioma": "language"

        };


        const key =
            keyMap[text];

        if (key)
            element.textContent =
                translate(key);

    });

}


//--------------------------------------------------
// Apply Language
//--------------------------------------------------

function applyLanguage() {

    document.documentElement.lang =
        appState.settings.language;

    translateExistingText();

    //--------------------------------------------------
    // Special Dashboard Elements
    //--------------------------------------------------

    setTranslatedText(
        document.getElementById("dashboardBeachName"),
        appState.selectedBeachId
            ? null
            : "noBeachSelected"
    );

    //--------------------------------------------------
    // Settings Option Text
    //--------------------------------------------------

    if (startupPageSelect) {

        const dashboardOption =
            startupPageSelect.querySelector(
                'option[value="dashboard"]'
            );

        const beachesOption =
            startupPageSelect.querySelector(
                'option[value="beaches"]'
            );

        if (dashboardOption)
            dashboardOption.textContent =
                translate("dashboardOption");

        if (beachesOption)
            beachesOption.textContent =
                translate("beachesOption");

    }


    if (startupBeachSelect) {

        const lastBeachOption =
            startupBeachSelect.querySelector(
                'option[value="last"]'
            );

        if (lastBeachOption)
            lastBeachOption.textContent =
                translate("lastSelectedBeach");

    }

}


//==================================================
// SETTINGS STORAGE
//==================================================

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


//==================================================
// SETTINGS
//==================================================

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
    // Apply Language Immediately
    //--------------------------------------------------

    applyLanguage();


    //--------------------------------------------------
    // Refresh Current Beach
    //--------------------------------------------------

    if (appState.selectedBeachId) {

        await displayBeach(
            appState.selectedBeachId
        );

    }

}


//==================================================
// PAGE NAVIGATION
//==================================================

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


//==================================================
// APPLICATION STARTUP
//==================================================

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
    // Apply Saved Language
    //--------------------------------------------------

    applyLanguage();


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