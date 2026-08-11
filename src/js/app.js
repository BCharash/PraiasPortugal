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

    //--------------------------------------------------
    // English
    //--------------------------------------------------

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

        airLabel: "🌡 Air",
        seaLabel: "🌊 Sea",
        windLabel: "🌬 Wind",
        surfLabel: "🏄 Surf",
        swellLabel: "🌊 Swell",
        tideLabel: "🌙 Tide",
        uvLabel: "☀ UV",

        // Beach selection

        selectBeach: "Select Beach",

        region: "Region:",
        beachComplex: "Beach Complex:",
        beach: "Beach:",

        // Beach information

        municipality: "Municipality:",
        district: "District:",
        latitude: "Latitude:",
        longitude: "Longitude:",

        // Settings

        units: "Units",
        unitPreferences: "Unit Preferences",

        temperature: "Temperature:",
        windSpeed: "Wind speed:",
        height: "Height:",

        startup: "Startup",
        startupPage: "Startup page:",
        startupBeach: "Startup beach:",

        updateDataOnStartup:
            "Update data when application starts",

        language: "Language:",

        // Unit options

        celsius: "Celsius (°C)",
        fahrenheit: "Fahrenheit (°F)",

        kmh: "km/h",
        knots: "knots",
        mph: "mph",

        meters: "metres (m)",
        feet: "feet (ft)",

        // Startup options

        dashboardOption: "Dashboard",
        beachesOption: "Beaches",

        lastSelectedBeach:
            "Last selected beach",

        // Weather formatter

        relativeHumidity: "RH",
        feelsLike: "Feels like",
        highShort: "H",
        lowShort: "L",

        uvLow: "Low",
        uvModerate: "Moderate",
        uvHigh: "High",
        uvVeryHigh: "Very High",
        uvExtreme: "Extreme",

        weatherClearSky: "Clear sky",
        weatherMainlyClear: "Mainly clear",
        weatherPartlyCloudy: "Partly cloudy",
        weatherOvercast: "Overcast",
        weatherFog: "Fog",
        weatherDrizzle: "Drizzle",
        weatherRain: "Rain",
        weatherSnow: "Snow",
        weatherRainShowers: "Rain showers",
        weatherThunderstorm: "Thunderstorm",
        weatherThunderstormHail: "Thunderstorm with hail",

        // Languages

        english: "English",
        portuguese: "Português"

    },


    //--------------------------------------------------
    // Portuguese
    //--------------------------------------------------

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

        airLabel: "🌡 Ar",
        seaLabel: "🌊 Mar",
        windLabel: "🌬 Vento",
        surfLabel: "🏄 Surf",
        swellLabel: "🌊 Ondulação",
        tideLabel: "🌙 Maré",
        uvLabel: "☀ UV",

        // Seleção de praia

        selectBeach: "Selecionar praia",

        region: "Região:",
        beachComplex: "Conjunto de praias:",
        beach: "Praia:",

        // Informação da praia

        municipality: "Município:",
        district: "Distrito:",
        latitude: "Latitude:",
        longitude: "Longitude:",

        // Definições

        units: "Unidades",
        unitPreferences: "Preferências de unidades",

        temperature: "Temperatura:",
        windSpeed: "Velocidade do vento:",
        height: "Altura:",

        startup: "Arranque",
        startupPage: "Página inicial:",
        startupBeach: "Praia inicial:",

        updateDataOnStartup:
            "Atualizar dados ao iniciar a aplicação",

        language: "Idioma:",

        // Opções de unidades

        celsius: "Celsius (°C)",
        fahrenheit: "Fahrenheit (°F)",

        kmh: "km/h",
        knots: "nós",
        mph: "mph",

        meters: "metros (m)",
        feet: "pés (ft)",

        // Opções de arranque

        dashboardOption: "Painel",
        beachesOption: "Praias",

        lastSelectedBeach:
            "Última praia selecionada",

        // Formatação meteorológica

        relativeHumidity: "HR",
        feelsLike: "Sensação térmica",
        highShort: "Máx.",
        lowShort: "Mín.",

        uvLow: "Baixo",
        uvModerate: "Moderado",
        uvHigh: "Alto",
        uvVeryHigh: "Muito alto",
        uvExtreme: "Extremo",

        weatherClearSky: "Céu limpo",
        weatherMainlyClear: "Pouco nublado",
        weatherPartlyCloudy: "Parcialmente nublado",
        weatherOvercast: "Nublado",
        weatherFog: "Nevoeiro",
        weatherDrizzle: "Chuvisco",
        weatherRain: "Chuva",
        weatherSnow: "Neve",
        weatherRainShowers: "Aguaceiros",
        weatherThunderstorm: "Trovoada",
        weatherThunderstormHail: "Trovoada com granizo",

        // Idiomas

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
// Apply Translation To Element
//--------------------------------------------------

function setTranslatedText(element, key) {

    if (!element || !key)
        return;

    element.textContent =
        translate(key);

}


//--------------------------------------------------
// Apply Language
//--------------------------------------------------

function applyLanguage() {

    const language =
        appState.settings.language;


    //--------------------------------------------------
    // HTML Language
    //--------------------------------------------------

    document.documentElement.lang =
        language;


    //--------------------------------------------------
    // Translate All Elements With data-i18n
    //--------------------------------------------------

    const elements =
        document.querySelectorAll("[data-i18n]");


    elements.forEach(element => {

        const key =
            element.dataset.i18n;

        if (!key)
            return;

        element.textContent =
            translate(key);

    });


    //--------------------------------------------------
    // Dashboard Default Beach Text
    //--------------------------------------------------

    if (!appState.selectedBeachId) {

        setTranslatedText(
            document.getElementById("dashboardBeachName"),
            "noBeachSelected"
        );

    }


    //--------------------------------------------------
    // Page Title
    //--------------------------------------------------

    document.title =
        "Praias de Portugal";

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
// RESTORE SAVED BEACH
//==================================================

//--------------------------------------------------
// Restore the saved beach after the beach lists
// have been populated.
//--------------------------------------------------

async function restoreSavedBeach() {

    if (
        appState.settings.startupBeach !== "last" ||
        !appState.selectedBeachId
    ) {

        return false;

    }


    const savedBeachId =
        String(appState.selectedBeachId);


    const regions =
        getRegions();


    //--------------------------------------------------
    // Search every region.
    //--------------------------------------------------

    for (const region of regions) {

        const complexes =
            getBeachComplexes(region);


        //--------------------------------------------------
        // Search every beach complex.
        //--------------------------------------------------

        for (const complex of complexes) {

            const beaches =
                getBeaches(complex.id);


            //--------------------------------------------------
            // Find saved beach.
            //--------------------------------------------------

            const beach =
                beaches.find(
                    item =>
                        String(item.id) === savedBeachId
                );


            if (!beach)
                continue;


            //--------------------------------------------------
            // Restore Region
            //--------------------------------------------------

            populateBeachComplexes(region);

            regionSelect.value =
                region;


            //--------------------------------------------------
            // Restore Beach Complex
            //--------------------------------------------------

            beachComplexSelect.value =
                complex.id;

            populateBeaches(
                complex.id
            );


            //--------------------------------------------------
            // Restore Beach
            //--------------------------------------------------

            beachSelect.value =
                beach.id;


            //--------------------------------------------------
            // Display Saved Beach
            //--------------------------------------------------

            await displayBeach(
                beach.id
            );


            return true;

        }

    }


    //--------------------------------------------------
    // Saved beach could not be found.
    //--------------------------------------------------

    return false;

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

//--------------------------------------------------
// Initialize Application
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
    // Apply Saved Language
    //--------------------------------------------------

    applyLanguage();


    //--------------------------------------------------
    // Populate Beaches
    //--------------------------------------------------

    populateRegions();


    //--------------------------------------------------
    // Restore Saved Beach
    //--------------------------------------------------

    await restoreSavedBeach();


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