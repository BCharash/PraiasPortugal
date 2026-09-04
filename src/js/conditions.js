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
let coastalConditionElement;

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

    coastalConditionElement =
        document.getElementById("dashboardCoastalCondition");

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

    weatherIconElement.innerHTML =
        "";

    weatherConditionElement.textContent =
        "--";

    coastalConditionElement.textContent =
        "";

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

    console.log(
        "WEATHER DATA:",
        dashboardData.weather.moonPhase,
        dashboardData.weather.moonrise,
        dashboardData.weather.moonset
    );

    const weather =
        dashboardData.weather;

    window.testWeather = weather;

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

    console.log(
    "WEATHER HOURLY:",
    weather.hourly
);

    //--------------------------------------------------
    // Coastal Conditions
    //--------------------------------------------------

    const currentCoastalCondition =
        getCurrentCoastalCondition(weather);

    const coastalFogRisk =
        getCoastalFogRisk(weather);

    
    if (coastalConditionElement) {

        if (currentCoastalCondition) {

            coastalConditionElement.textContent =
                currentCoastalCondition.label;

        }
        

        else if (coastalFogRisk) {

            coastalConditionElement.textContent =
                coastalFogRisk.label;

        }
        else {

            coastalConditionElement.textContent =
                "";

        }

    }

    console.log(
        "COASTAL CONDITION:",
        currentCoastalCondition
    );

    console.log(
        "COASTAL FOG RISK:",
        coastalFogRisk
    );

    

        const celestial =
            getCelestialState(weather);

                const celestialGraphicElement =
            document.getElementById("celestialGraphic");

        if (celestialGraphicElement) {

            const graphicWidth =
                celestialGraphicElement.clientWidth;

            const graphicHeight =
                celestialGraphicElement.clientHeight;

            
            console.log(
                "CELESTIAL GRAPHIC SIZE:",
                graphicWidth,
                graphicHeight
);

            celestialGraphicElement.innerHTML =
                renderCelestialGraphic(
                    celestial,
                    weather,
                    graphicWidth,
                    graphicHeight
                );

        }
        

        airTempElement.textContent =
            formatAirTemperature(weather);

        airTempElement.textContent =
            formatAirTemperature(weather);

        //--------------------------------------------------
        // Temperature Range Endpoints
        //--------------------------------------------------

        const temperatureMinElement =
            document.getElementById(
                "dashboardTempMin"
            );

        const temperatureMaxElement =
            document.getElementById(
                "dashboardTempMax"
            );

        if (
            temperatureMinElement &&
            weather.lowTemperature != null
        ) {
            temperatureMinElement.textContent =
                `${Math.round(weather.lowTemperature)}°`;
        }

        if (
            temperatureMaxElement &&
            weather.highTemperature != null
        ) {
            temperatureMaxElement.textContent =
                `${Math.round(weather.highTemperature)}°`;
        }


        //--------------------------------------------------
        // Temperature Range Position
        //--------------------------------------------------

        const temperatureRangeElement =
            document.getElementById(
                "dashboardTemperatureRange"
            );

        if (
            temperatureRangeElement &&
            weather.airTemperature != null &&
            weather.lowTemperature != null &&
            weather.highTemperature != null &&
            weather.highTemperature !==
                weather.lowTemperature
        ) {

            const position =
                (
                    weather.airTemperature -
                    weather.lowTemperature
                ) /
                (
                    weather.highTemperature -
                    weather.lowTemperature
                );

        const clampedPosition =
            Math.max(
                0,
                Math.min(
                    1,
                    position
                )
            );


                //--------------------------------------------------
                // Temperature marker position
                //
                // The temperature track runs from 0% to 100%.
                //--------------------------------------------------

                const trackPosition =
                    clampedPosition * 100;


                temperatureRangeElement.style.setProperty(
                    "--temperature-position",
                    `${trackPosition}%`
                );
        }




        airHumidityElement.textContent =
            formatHumidity(weather);

        airFeelsLikeElement.textContent =
            formatFeelsLike(weather);

        windElement.textContent =
            formatWind(weather);

        uvElement.textContent =
            formatUV(weather);

        
if (
    weather.uvIndex != null &&
    weather.uvIndexMax != null &&
    weather.uvIndexMax > 0
) {

    const position =
        Math.max(
            0,
            Math.min(
                1,
                weather.uvIndex /
                weather.uvIndexMax
            )
        );

    document
        .getElementById("conditionsUV")
        .style.setProperty(
            "--uv-position",
            `${position * 100}%`
        );

}

        //--------------------------------------------------
        // Sunrise / Sunset
        //--------------------------------------------------

        const sunriseElement =
            document.getElementById("dashboardSunrise");

        const sunsetElement =
            document.getElementById("dashboardSunset");

        if (sunriseElement) {

            sunriseElement.textContent =
                formatSunTime(weather.sunrise);

        }

        if (sunsetElement) {

            sunsetElement.textContent =
                formatSunTime(weather.sunset);

        }


        //--------------------------------------------------
        // Moon
        //--------------------------------------------------

        const moonPhaseElement =
            document.getElementById("dashboardMoonPhase");

        const moonIlluminationElement =
            document.getElementById(
                "dashboardMoonIllumination"
            );

        if (moonPhaseElement) {

            moonPhaseElement.textContent =
                formatMoonPhase(weather.moonPhase);

        }

        if (moonIlluminationElement) {

            moonIlluminationElement.textContent =
                formatMoonIllumination(
                    weather.moonPhase
                );

        }

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


//==================================================
// Time Helpers
//==================================================

function parseWeatherTime(value) {

    if (!value)
        return null;


    const parts =
        value.split("T");

    if (parts.length !== 2)
        return null;


    const dateParts =
        parts[0].split("-");

    const timeParts =
        parts[1].split(":");


    if (
        dateParts.length !== 3 ||
        timeParts.length < 2
    )
        return null;


    return new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        Number(timeParts[0]),
        Number(timeParts[1])
    );

}


function isTimeBetween(
    now,
    start,
    end
) {

    //--------------------------------------------------
    // Normal case:
    // rise and set occur on same local date.
    //--------------------------------------------------

    if (end >= start) {

        return (
            now >= start &&
            now <= end
        );

    }


    //--------------------------------------------------
    // Overnight case.
    //--------------------------------------------------

    return (
        now >= start ||
        now <= end
    );

}




//--------------------------------------------------
// Conditions Formatting Helpers
//--------------------------------------------------

function formatSunTime(value) {

    if (!value)
        return "--";

    const time =
        value.split("T")[1];

    if (!time)
        return "--";

    return time.substring(0, 5);

}


function formatMoonPhase(phase) {

    if (phase == null)
        return "--";

    if (phase < 0.0625)
        return "New Moon";

    if (phase < 0.1875)
        return "Waxing Crescent";

    if (phase < 0.3125)
        return "First Quarter";

    if (phase < 0.4375)
        return "Waxing Gibbous";

    if (phase < 0.5625)
        return "Full Moon";

    if (phase < 0.6875)
        return "Waning Gibbous";

    if (phase < 0.8125)
        return "Last Quarter";

    if (phase < 0.9375)
        return "Waning Crescent";

    return "New Moon";

}


function formatMoonIllumination(phase) {

    if (phase == null)
        return "--";

    const illumination =
        (1 - Math.cos(2 * Math.PI * phase)) / 2;

    return `${Math.round(illumination * 100)}% illuminated`;

}