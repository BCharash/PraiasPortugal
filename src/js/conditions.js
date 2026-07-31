//--------------------------------------------------
// Current Conditions Widget
//--------------------------------------------------


//--------------------------------------------------
// Private Variables
//--------------------------------------------------

let airTempElement;
let seaTempElement;
let windElement;
let surfElement;
let tideElement;
let uvElement;


//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeConditions() {

    airTempElement = document.getElementById("dashboardAirTemp");
    seaTempElement = document.getElementById("dashboardSeaTemp");
    windElement    = document.getElementById("dashboardWind");
    surfElement    = document.getElementById("dashboardSurf");
    tideElement    = document.getElementById("dashboardTide");
    uvElement      = document.getElementById("dashboardUV");

    airTempElement.textContent = "--";
    seaTempElement.textContent = "--";
    windElement.textContent    = "--";
    surfElement.textContent    = "--";
    tideElement.textContent    = "--";
    uvElement.textContent      = "--";

}


//--------------------------------------------------
// Updates
//--------------------------------------------------

function updateConditions(dashboardData) {

    const weather = dashboardData.weather;

    if (!weather)
        return;

    airTempElement.textContent = formatAirTemperature(weather);

    windElement.textContent = formatWind(weather);

}


//--------------------------------------------------
// Helper Functions
//--------------------------------------------------