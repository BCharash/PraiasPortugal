//--------------------------------------------------
// Current Conditions Widget
//--------------------------------------------------


//--------------------------------------------------
// Private Variables
//--------------------------------------------------

let airTempElement;
let airHumidityElement;
let airFeelsLikeElement;
let airHighLowElement;

let seaTempElement;
let windElement;
let surfElement;
let swellElement;
let tideElement;
let uvElement;


//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeConditions() {

    airTempElement      = document.getElementById("dashboardAirTemp");
    airHumidityElement  = document.getElementById("dashboardAirHumidity");
    airFeelsLikeElement = document.getElementById("dashboardAirFeelsLike");
    airHighLowElement   = document.getElementById("dashboardAirHighLow");

    seaTempElement = document.getElementById("dashboardSeaTemp");
    windElement    = document.getElementById("dashboardWind");
    surfElement    = document.getElementById("dashboardSurf");
    swellElement   = document.getElementById("dashboardSwell");
    tideElement    = document.getElementById("dashboardTide");
    uvElement      = document.getElementById("dashboardUV");

    airTempElement.textContent      = "--";
    airHumidityElement.textContent  = "--";
    airFeelsLikeElement.textContent = "--";
    airHighLowElement.textContent   = "--";

    seaTempElement.textContent = "--";
    windElement.textContent    = "--";
    surfElement.textContent    = "--";
    tideElement.textContent    = "--";
    uvElement.textContent      = "--";

    if (swellElement)
        swellElement.textContent = "--";

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

        airTempElement.textContent =
            formatAirTemperature(weather);

        airHumidityElement.textContent =
            formatHumidity(weather);

        airFeelsLikeElement.textContent =
            formatFeelsLike(weather);

        airHighLowElement.textContent =
            formatHighLow(weather);

        windElement.textContent =
            formatWind(weather);

        uvElement.textContent =
            formatUV(weather);

    }

    //--------------------------------------------------
    // Marine
    //--------------------------------------------------

    if (marine) {

        seaTempElement.textContent =
            formatSeaTemperature(marine);

        surfElement.textContent =
            formatSurf(marine);

        if (swellElement)
            swellElement.textContent =
                formatSwell(marine);

    }

    //--------------------------------------------------
    // Tide
    //--------------------------------------------------

    if (tide) {

        tideElement.textContent =
            `${formatCurrentTideHeight(tide)} ` +
            `${formatTideTrend(tide)}`;

    }

}


//--------------------------------------------------
// Helper Functions
//--------------------------------------------------