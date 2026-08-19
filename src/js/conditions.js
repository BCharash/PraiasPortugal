//--------------------------------------------------
// Current Conditions Widget
//--------------------------------------------------


//--------------------------------------------------
// Private Variables
//--------------------------------------------------

let airTempElement;
let airHumidityElement;
let airFeelsLikeElement;

let weatherIconElement;
let weatherConditionElement;

let seaTempElement;
let windElement;
let surfElement;
let tideElement;
let uvElement;


//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeConditions() {

    airTempElement =
        document.getElementById("dashboardAirTemp");

    airHumidityElement =
        document.getElementById("dashboardAirHumidity");

    airFeelsLikeElement =
        document.getElementById("dashboardAirFeelsLike");

    weatherIconElement =
        document.getElementById("dashboardWeatherIcon");

    weatherConditionElement =
        document.getElementById("dashboardWeatherCondition");

    seaTempElement =
        document.getElementById("dashboardSeaTemp");

    windElement =
        document.getElementById("dashboardWind");

    surfElement =
        document.getElementById("dashboardSurf");

    tideElement =
        document.getElementById("dashboardTide");

    uvElement =
        document.getElementById("dashboardUV");


    //--------------------------------------------------
    // Initial Values
    //--------------------------------------------------

    airTempElement.textContent =
        "--";

    airHumidityElement.textContent =
        "--";

    airFeelsLikeElement.textContent =
        "--";

    weatherIconElement.textContent =
        "";

    weatherConditionElement.textContent =
        "--";

    seaTempElement.textContent =
        "--";

    windElement.textContent =
        "--";

    surfElement.textContent =
        "--";

    tideElement.textContent =
        "--";

    uvElement.textContent =
        "--";

}


//--------------------------------------------------
// Updates
//--------------------------------------------------

function updateConditions(dashboardData) {

    const weather =
        dashboardData.weather;

    const marine =
        dashboardData.marine;

    const tide =
        dashboardData.tide;


    //--------------------------------------------------
    // Weather
    //--------------------------------------------------

    if (weather) {

        weatherConditionElement.textContent =
            weather.description;

        weatherIconElement.textContent =
            weather.icon;

        airTempElement.textContent =
            formatAirTemperature(weather);

        airHumidityElement.textContent =
            formatHumidity(weather);

        airFeelsLikeElement.textContent =
            formatFeelsLike(weather);

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