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

    weatherIconElement.innerHTML =
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

    console.log(
        "WEATHER DATA:",
        dashboardData.weather.moonPhase,
        dashboardData.weather.moonrise,
        dashboardData.weather.moonset
    );

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

        renderCelestialSky(weather);

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
// Celestial Sky
//==================================================

function renderCelestialSky(weather) {

    if (!weatherIconElement)
        return;


    //--------------------------------------------------
    // SVG dimensions
    //--------------------------------------------------

    const width =
        96;

    const height =
        72;


    //--------------------------------------------------
    // Current time
    //--------------------------------------------------

    const now =
        new Date();


    //--------------------------------------------------
    // Determine whether Sun is above horizon
    //--------------------------------------------------

    const sunrise =
        parseWeatherTime(weather.sunrise);

    const sunset =
        parseWeatherTime(weather.sunset);

    const sunIsUp =
        sunrise !== null &&
        sunset !== null &&
        now >= sunrise &&
        now <= sunset;


    //--------------------------------------------------
    // Determine whether Moon is above horizon
    //--------------------------------------------------

    const moonrise =
        parseWeatherTime(weather.moonrise);

    const moonset =
        parseWeatherTime(weather.moonset);

    const moonIsUp =
        moonrise !== null &&
        moonset !== null &&
        isTimeBetween(
            now,
            moonrise,
            moonset
        );


    //--------------------------------------------------
    // Background
    //--------------------------------------------------

    const background =
        sunIsUp
            ? "#27456b"
            : "#111b32";


    //--------------------------------------------------
    // Sky arc
    //--------------------------------------------------

    let celestialObject =
        "";


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    if (sunIsUp) {

        const position =
            getSkyPosition(
                now,
                sunrise,
                sunset
            );

        celestialObject = `
            <circle
                cx="${position.x}"
                cy="${position.y}"
                r="13"
                fill="#ffd34d"
            />

            <circle
                cx="${position.x - 3}"
                cy="${position.y - 3}"
                r="9"
                fill="#fff1a8"
                opacity="0.35"
            />
        `;

    }


    //--------------------------------------------------
    // Moon
    //--------------------------------------------------

    else if (moonIsUp) {

        const position =
            getSkyPosition(
                now,
                moonrise,
                moonset
            );

        celestialObject =
            createMoonGraphic(
                weather.moonPhase,
                position.x,
                position.y
            );

    }


    //--------------------------------------------------
    // Stars
    //
    // Visible at night.
    //--------------------------------------------------

    const stars =
        sunIsUp
            ? ""
            : createStars();


    //--------------------------------------------------
    // Render
    //--------------------------------------------------

    weatherIconElement.innerHTML = `

        <svg
            viewBox="0 0 ${width} ${height}"
            width="${width}"
            height="${height}"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="${weather.description}"
        >

            <rect
                x="0"
                y="0"
                width="${width}"
                height="${height}"
                rx="10"
                fill="${background}"
            />

            ${stars}

            ${celestialObject}

        </svg>

    `;

}


//==================================================
// Sky Position
//==================================================

function getSkyPosition(
    now,
    rise,
    set
) {

    const total =
        set.getTime() -
        rise.getTime();

    const elapsed =
        now.getTime() -
        rise.getTime();

    let progress =
        elapsed / total;

    progress =
        Math.max(
            0,
            Math.min(
                1,
                progress
            )
        );


    //--------------------------------------------------
    // Horizontal movement
    //--------------------------------------------------

    const x =
        14 +
        progress * 68;


    //--------------------------------------------------
    // Vertical arc
    //--------------------------------------------------

    const arc =
        Math.sin(
            progress * Math.PI
        );


    const y =
        51 -
        arc * 34;


    return {
        x,
        y
    };

}


//==================================================
// Moon Graphic
//==================================================

function createMoonGraphic(
    phase,
    x,
    y
) {

    if (phase == null)
        phase = 0;


    const radius =
        12;


    //--------------------------------------------------
    // Base Moon
    //--------------------------------------------------

    const moon =
        `
        <circle
            cx="${x}"
            cy="${y}"
            r="${radius}"
            fill="#edf1f7"
        />
        `;


    //--------------------------------------------------
    // Shadow geometry
    //
    // Uses an ellipse to create the illuminated
    // portion corresponding to lunar phase.
    //--------------------------------------------------

    let shadow;


    if (phase < 0.5) {

        const width =
            radius * 2 *
            Math.abs(
                1 - 2 * phase
            );

        shadow = `
            <ellipse
                cx="${x}"
                cy="${y}"
                rx="${width / 2}"
                ry="${radius}"
                fill="#111b32"
            />
        `;

    }
    else {

        const width =
            radius * 2 *
            Math.abs(
                1 - 2 * phase
            );

        shadow = `
            <ellipse
                cx="${x}"
                cy="${y}"
                rx="${width / 2}"
                ry="${radius}"
                fill="#111b32"
            />
        `;

    }


    //--------------------------------------------------
    // Subtle lunar surface
    //--------------------------------------------------

    const surface = `

        <circle
            cx="${x - 4}"
            cy="${y - 3}"
            r="2"
            fill="#c9cfda"
            opacity="0.55"
        />

        <circle
            cx="${x + 4}"
            cy="${y + 4}"
            r="1.5"
            fill="#c9cfda"
            opacity="0.45"
        />

        <circle
            cx="${x + 1}"
            cy="${y - 5}"
            r="1"
            fill="#c9cfda"
            opacity="0.5"
        />

    `;


    return `
        ${moon}
        ${shadow}
        ${surface}
    `;

}


//==================================================
// Stars
//==================================================

function createStars() {

    return `

        <g
            fill="#ffffff"
            opacity="0.75"
        >

            <circle cx="13" cy="14" r="0.8"/>
            <circle cx="27" cy="10" r="0.6"/>
            <circle cx="42" cy="17" r="0.7"/>
            <circle cx="58" cy="9" r="0.8"/>
            <circle cx="74" cy="16" r="0.6"/>
            <circle cx="88" cy="11" r="0.8"/>

            <circle cx="19" cy="29" r="0.5"/>
            <circle cx="47" cy="28" r="0.6"/>
            <circle cx="82" cy="31" r="0.5"/>

        </g>

    `;

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