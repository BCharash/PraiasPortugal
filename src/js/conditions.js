//--------------------------------------------------
// Current Conditions Widget
//--------------------------------------------------


//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeConditions() {

    document.getElementById("dashboardAirTemp").textContent = "--";
    document.getElementById("dashboardSeaTemp").textContent = "--";
    document.getElementById("dashboardWind").textContent    = "--";
    document.getElementById("dashboardSurf").textContent    = "--";
    document.getElementById("dashboardTide").textContent    = "--";
    document.getElementById("dashboardUV").textContent      = "--";

}


//--------------------------------------------------
// Updates
//--------------------------------------------------

function updateConditions(weather) {

    if (!weather)
        return;

    document.getElementById("dashboardAirTemp").textContent =
        `${Math.round(weather.airTemperature)}°C`;

    document.getElementById("dashboardWind").textContent =
        `${Math.round(weather.windSpeed)} km/h`;

}


//--------------------------------------------------
// Helper Functions
//--------------------------------------------------