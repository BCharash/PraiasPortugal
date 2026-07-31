//--------------------------------------------------
// Current Conditions Widget
//--------------------------------------------------


//--------------------------------------------------
// Private Variables
//--------------------------------------------------

let airTempElement;
let airFeelsLikeElement;
let airHighLowElement;

let seaTempElement;
let windElement;
let surfElement;
let tideElement;
let uvElement;


//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeConditions() {

    airTempElement      = document.getElementById("dashboardAirTemp");
    airFeelsLikeElement = document.getElementById("dashboardAirFeelsLike");
    airHighLowElement   = document.getElementById("dashboardAirHighLow");

    seaTempElement = document.getElementById("dashboardSeaTemp");
    windElement    = document.getElementById("dashboardWind");
    surfElement    = document.getElementById("dashboardSurf");
    tideElement    = document.getElementById("dashboardTide");
    uvElement      = document.getElementById("dashboardUV");

    airTempElement.textContent      = "--";
    airFeelsLikeElement.textContent = "--";
    airHighLowElement.textContent   = "--";

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
    const marine  = dashboardData.marine;
    const tide    = dashboardData.tide;

    //--------------------------------------------------
    // Weather
    //--------------------------------------------------

    if (weather) {

        airTempElement.textContent      = formatAirTemperature(weather);
        airFeelsLikeElement.textContent = formatFeelsLike(weather);
        airHighLowElement.textContent   = formatHighLow(weather);

        windElement.textContent = formatWind(weather);

        uvElement.textContent = formatUV(weather);

    }

    //--------------------------------------------------
    // Marine
    //--------------------------------------------------

    if (marine) {

        seaTempElement.textContent = formatSeaTemperature(marine);

        surfElement.textContent = formatSurf(marine);

    }

    //--------------------------------------------------
    // Tide
    //--------------------------------------------------

    if (tide) {

        tideElement.textContent =
            `${formatCurrentTideHeight(tide)} ${formatTideTrend(tide)}`;

    }

}


//--------------------------------------------------
// Helper Functions
//--------------------------------------------------