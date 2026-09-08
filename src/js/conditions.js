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
let uvRiskElement;
let uvRangeElement;
let uvMaximumElement;

// Most recently loaded weather data, reused by the celestial auto-update.
// The timer redraws the graphic only; it does not request new API data.
let latestCelestialWeather = null;
let celestialAutoUpdateTimer = null;

const UV_SCALE_MAX = 11;

//--------------------------------------------------
// Moon phase image
//--------------------------------------------------

function getMoonPhaseImageUrl(phase) {

    let normalizedPhase = Number(phase);

    if (!Number.isFinite(normalizedPhase)) {
        normalizedPhase = 0;
    }

    normalizedPhase =
        ((normalizedPhase % 1) + 1) % 1;

    const imageNumber =
    Math.round(normalizedPhase * 30) % 30 + 1;

    return `assets/moon/moon-${String(imageNumber).padStart(2, "0")}.png`;
}


//--------------------------------------------------
// Celestial Development Simulator
//--------------------------------------------------

let celestialSimulatorRunning = false;
let celestialSimulatorTimer = null;
let celestialSimulatorWeather = null;

function hasCelestialSimulatorParameter() {
    if (typeof window === "undefined")
        return false;

    return new URLSearchParams(window.location.search)
        .has("celestialSim");
}

function formatSimulatorDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSimulatorTime(date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function simulatorDateFromWeather(weather) {

    const parsed =
        parseCelestialTime(weather?.currentTime);

    if (!parsed)
        return new Date();

    const urlValue =
        typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("celestialSim")
            : null;

    if (urlValue && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(urlValue)) {
        const explicit = parseCelestialTime(urlValue);
        if (explicit)
            return explicit;
    }

    if (urlValue && /^\d{4}$/.test(urlValue)) {
        const hour = Number(urlValue.slice(0, 2));
        const minute = Number(urlValue.slice(2, 4));

        if (hour <= 23 && minute <= 59) {
            parsed.setHours(hour, minute, 0, 0);
            return parsed;
        }

        if (hour === 24 && minute === 0) {
            parsed.setDate(parsed.getDate() + 1);
            parsed.setHours(0, 0, 0, 0);
            return parsed;
        }
    }

    return parsed;
}

function writeCelestialSimulatorUrl(date) {

    if (typeof window === "undefined")
        return;

    const url = new URL(window.location.href);

    url.searchParams.set(
        "celestialSim",
        `${formatSimulatorDate(date)}T${formatSimulatorTime(date)}`
    );

    window.history.replaceState(null, "", url.toString());
}

function setCelestialSimulatorTime(date, updateUrl = true) {

    if (!(date instanceof Date) || Number.isNaN(date.getTime()))
        return;

    const next = new Date(date.getTime());
    next.setSeconds(0, 0);

    window.celestialSimulatorTime = next;

    if (updateUrl)
        writeCelestialSimulatorUrl(next);

    updateCelestialSimulatorControls();
    updateCelestialGraphicOnly();
}

function stepCelestialSimulator(minutes) {

    if (!(window.celestialSimulatorTime instanceof Date))
        return;

    const next = new Date(window.celestialSimulatorTime.getTime());
    next.setMinutes(next.getMinutes() + minutes);
    setCelestialSimulatorTime(next);
}

function stopCelestialSimulatorRun() {

    celestialSimulatorRunning = false;

    if (celestialSimulatorTimer) {
        clearInterval(celestialSimulatorTimer);
        celestialSimulatorTimer = null;
    }

    updateCelestialSimulatorControls();
}

function startCelestialSimulatorRun() {

    if (celestialSimulatorRunning)
        return;

    celestialSimulatorRunning = true;
    updateCelestialSimulatorControls();

    // One simulated minute per real second makes long transitions practical
    // to observe without waiting in real time.
    celestialSimulatorTimer =
        setInterval(() => stepCelestialSimulator(1), 1000);
}

function updateCelestialSimulatorControls(celestialState = null) {

    const root = document.getElementById("celestialSimulator");

    if (!root || root.hidden)
        return;

    const dateInput = root.querySelector("[data-sim-date]");
    const timeDisplay = root.querySelector("[data-sim-time]");
    const runButton = root.querySelector("[data-sim-run]");
    const pauseButton = root.querySelector("[data-sim-pause]");
    const date = window.celestialSimulatorTime;

    if (date instanceof Date) {
        dateInput.value = formatSimulatorDate(date);
        timeDisplay.textContent = formatSimulatorTime(date);
    }

    if (runButton)
        runButton.disabled = celestialSimulatorRunning;

    if (pauseButton)
        pauseButton.disabled = !celestialSimulatorRunning;

    if (celestialState?.sun?.position) {

        const sun = celestialState.sun.position;
        const diagnostics = root.querySelector("[data-sim-diagnostics]");

        if (diagnostics) {
            diagnostics.innerHTML = `
                <span>State: <strong>${sun.presentationState || "--"}</strong></span>
                <span>Altitude: <strong>${Number.isFinite(sun.altitude) ? sun.altitude.toFixed(2) + "°" : "--"}</strong></span>
                <span>Azimuth: <strong>${Number.isFinite(sun.azimuth) ? sun.azimuth.toFixed(1) + "°" : "--"}</strong></span>
                <span>Reveal: <strong>${Math.round(getSunDiscReveal(sun) * 100)}%</strong></span>
                <span>Sunrise: <strong>${sun.sunriseTime ? formatSimulatorTime(sun.sunriseTime) : "--"}</strong></span>
                <span>Sunset: <strong>${sun.sunsetTime ? formatSimulatorTime(sun.sunsetTime) : "--"}</strong></span>
                <span>Parked: <strong>${sun.isNightParked ? "YES" : "NO"}</strong></span>
            `;
        }
    }
}

function initializeCelestialSimulator(weather = null) {

    const root = document.getElementById("celestialSimulator");

    if (!root || !hasCelestialSimulatorParameter())
        return;

    root.hidden = false;

    if (weather)
        celestialSimulatorWeather = weather;

    if (!(window.celestialSimulatorTime instanceof Date)) {
        window.celestialSimulatorTime =
            simulatorDateFromWeather(
                celestialSimulatorWeather || weather
            );
    }

    // Avoid rebuilding the controls every time weather data updates.
    if (root.dataset.initialized !== "true") {

        root.innerHTML = `
            <div id="celestialSimulatorControls">
                <strong>Celestial Simulator</strong>
                <input data-sim-date type="date" aria-label="Simulated date">
                <button type="button" data-sim-back10>−10 min</button>
                <button type="button" data-sim-back1>−1 min</button>
                <span id="celestialSimulatorTime" data-sim-time>--:--</span>
                <button type="button" data-sim-forward1>+1 min</button>
                <button type="button" data-sim-forward10>+10 min</button>
                <button type="button" data-sim-run>▶ Run</button>
                <button type="button" data-sim-pause disabled>⏸ Pause</button>
            </div>
            <div id="celestialSimulatorDiagnostics" data-sim-diagnostics aria-live="polite">
                <span>State: <strong>--</strong></span>
            </div>
        `;

        root.querySelector("[data-sim-back10]")
            .addEventListener("click", () => stepCelestialSimulator(-10));
        root.querySelector("[data-sim-back1]")
            .addEventListener("click", () => stepCelestialSimulator(-1));
        root.querySelector("[data-sim-forward1]")
            .addEventListener("click", () => stepCelestialSimulator(1));
        root.querySelector("[data-sim-forward10]")
            .addEventListener("click", () => stepCelestialSimulator(10));
        root.querySelector("[data-sim-run]")
            .addEventListener("click", startCelestialSimulatorRun);
        root.querySelector("[data-sim-pause]")
            .addEventListener("click", stopCelestialSimulatorRun);

        root.querySelector("[data-sim-date]")
            .addEventListener("change", event => {

                const value = event.target.value;

                if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
                    return;

                const current =
                    window.celestialSimulatorTime instanceof Date
                        ? new Date(window.celestialSimulatorTime.getTime())
                        : new Date();

                const parts = value.split("-").map(Number);

                current.setFullYear(parts[0], parts[1] - 1, parts[2]);
                setCelestialSimulatorTime(current);
            });

        root.dataset.initialized = "true";
    }

    updateCelestialSimulatorControls();
}


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
        document.getElementById("dashboardUVValue");

    uvRiskElement =
        document.getElementById("dashboardUVRisk");

    uvRangeElement =
        document.getElementById("dashboardUVRange");

    uvMaximumElement =
        document.getElementById("dashboardUVMax");


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

    uvRiskElement.textContent =
        "--";

    uvMaximumElement.textContent =
        "--";

}


//--------------------------------------------------
// Celestial auto-update
//--------------------------------------------------

// Redraw only the celestial graphic using the most recently loaded weather.
// This uses the already-loaded weather data; it never requests new API data.
function updateCelestialGraphicOnly() {

    if (!latestCelestialWeather)
        return;

    const celestialGraphicElement =
        document.getElementById("celestialGraphic");

    if (!celestialGraphicElement)
        return;

    const graphicWidth =
        celestialGraphicElement.clientWidth;

    const graphicHeight =
        celestialGraphicElement.clientHeight;

    if (!graphicWidth || !graphicHeight)
        return;

    // getCelestialState normally uses weather.currentTime, which is the
    // timestamp from the last weather/API load. For the minute-by-minute
    // display we must supply the current local civil clock time instead.
    // This changes no weather data and makes no API request.
    const simulationValue =
        typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("celestialSim")
            : null;

    let celestialWeather = latestCelestialWeather;

    // Preserve celestial simulation exactly as entered by the developer.
    // In normal operation, replace only currentTime with the actual local
    // wall-clock time so the celestial position advances every minute.
    if (!simulationValue) {
        const now = new Date();
        const pad = value => String(value).padStart(2, "0");

        celestialWeather = {
            ...latestCelestialWeather,
            currentTime:
                `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
                `T${pad(now.getHours())}:${pad(now.getMinutes())}`
        };
    }

    const celestial =
        getCelestialState(celestialWeather);

    if (!celestial)
        return;

    updateCelestialSimulatorControls(celestial);

    celestialGraphicElement.innerHTML =
        renderCelestialGraphic(
            celestial,
            latestCelestialWeather,
            graphicWidth,
            graphicHeight
        );
}


function scheduleCelestialAutoUpdate() {

    // Use a fresh timeout each time rather than a repeating interval.
    // This keeps every redraw aligned to the actual minute boundary and
    // avoids the timer being repeatedly reset by weather-data refreshes.
    if (celestialAutoUpdateTimer)
        clearTimeout(celestialAutoUpdateTimer);

    const now = new Date();
    const millisecondsIntoMinute =
        now.getSeconds() * 1000 +
        now.getMilliseconds();

    const delayToNextMinute =
        60000 - millisecondsIntoMinute;

    celestialAutoUpdateTimer =
        setTimeout(() => {

            updateCelestialGraphicOnly();
            scheduleCelestialAutoUpdate();

        }, delayToNextMinute);
}


function startCelestialAutoUpdate() {

    if (!celestialAutoUpdateTimer)
        scheduleCelestialAutoUpdate();
}


// If the browser temporarily suspends timers while the page is hidden,
// redraw immediately when the page becomes visible again.
if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            updateCelestialGraphicOnly();
            scheduleCelestialAutoUpdate();
        }
    });
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

    latestCelestialWeather = weather;

    if (weather) {
        initializeCelestialSimulator(weather);
        startCelestialAutoUpdate();
    }

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

        updateCelestialSimulatorControls(celestial);

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
            formatUVValue(weather);

        uvRiskElement.textContent =
            formatUVRisk(weather);

        if (weather.uvIndexMax != null) {

            uvMaximumElement.textContent =
                `${translate("uvMaximum")} ${Math.round(weather.uvIndexMax)}`;

        }

        if (uvRangeElement) {

            const currentPosition =
                weather.uvIndex == null
                    ? 0
                    : Math.max(
                        0,
                        Math.min(
                            1,
                            weather.uvIndex / UV_SCALE_MAX
                        )
                    );

            const maximumPosition =
                weather.uvIndexMax == null
                    ? 0
                    : Math.max(
                        0,
                        Math.min(
                            1,
                            weather.uvIndexMax / UV_SCALE_MAX
                        )
                    );

            uvRangeElement.style.setProperty(
                "--uv-current-position",
                `${currentPosition * 100}%`
            );

            uvRangeElement.style.setProperty(
                "--uv-maximum-position",
                `${maximumPosition * 100}%`
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

            moonPhaseElement.innerHTML = `
                <img
                    class="dashboard-moon-image"
                    src="${getMoonPhaseImageUrl(weather.moonPhase)}"
                    alt="${formatMoonPhase(weather.moonPhase)}"
                >
            `;

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
