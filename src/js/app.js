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

        // Languages

        english: "English",
        portuguese: "Português",

        // Weather

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
        weatherThunderstormHail:
            "Thunderstorm with hail"

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

        // Idiomas

        english: "English",
        portuguese: "Português",

        // Meteorologia

        relativeHumidity: "HR",
        feelsLike: "Sensação térmica",
        highShort: "Máx.",
        lowShort: "Mín.",

        uvLow: "Baixo",
        uvModerate: "