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
        formatAirTemperature(weather);

    document.getElementById("dashboardWind").textContent =
        formatWind(weather);

}


//--------------------------------------------------
// Helper Functions
//--------------------------------------------------