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

    const params = new URLSearchParams(window.location.search);

    // Development mode is deliberately easy to remember and type:
    // https://.../?dev
    return params.has("dev") || params.has("celestialSim");
}

function formatSimulatorDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSimulatorTime(date) {
    return `${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatSimulatorDateTime(date) {
    return `${formatSimulatorDate(date)} ${formatSimulatorTime(date)}`;
}

function parseSimulatorFourDigitTime(value) {

    const normalized = String(value || "").trim();

    if (!/^\d{4}$/.test(normalized))
        return null;

    const hour = Number(normalized.slice(0, 2));
    const minute = Number(normalized.slice(2, 4));

    if (hour > 23 || minute > 59)
        return null;

    return { hour, minute };
}

function simulatorDateFromWeather(weather) {

    const parsed =
        parseCelestialTime(weather?.currentTime);

    // In ?dev mode, always start from the currently loaded real-world time.
    // This means opening/reloading the development web app resets the clock
    // to "now" instead of retaining a previous simulation time.
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

    // ?dev is a persistent development-mode switch, not a simulation time.
    // Keep it in the URL while the simulated clock lives only in memory.
    if (url.searchParams.has("dev"))
        return;

    // Preserve compatibility with the older ?celestialSim mode.
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    url.searchParams.set(
        "celestialSim",
        `${formatSimulatorDate(date)}T${hours}:${minutes}`
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

function getCelestialSimulatorStep() {
    const root = document.getElementById("celestialSimulator");
    const select = root?.querySelector("[data-sim-step]");
    const value = Number(select?.value);
    return value === 60 ? 60 : value === 10 ? 10 : 1;
}

function getCelestialSimulatorPlayInterval() {
    const root = document.getElementById("celestialSimulator");
    const select = root?.querySelector("[data-sim-play]");
    const value = Number(select?.value);
    return value === 60 ? 60 : value === 10 ? 10 : 1;
}

function stepCelestialSimulator(minutes = null) {

    if (!(window.celestialSimulatorTime instanceof Date))
        return;

    const amount = Number.isFinite(minutes)
        ? minutes
        : getCelestialSimulatorStep();

    const next = new Date(window.celestialSimulatorTime.getTime());
    next.setMinutes(next.getMinutes() + amount);
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

    // Advance by the selected simulated interval once per second.
    celestialSimulatorTimer =
        setInterval(() => stepCelestialSimulator(getCelestialSimulatorPlayInterval()), 1000);
}

function updateCelestialSimulatorControls(celestialState = null) {

    const root = document.getElementById("celestialSimulator");

    if (!root || root.hidden)
        return;

    const dateInput = root.querySelector("[data-sim-date]");
    const timeInput = root.querySelector("[data-sim-time]");
    const runButton = root.querySelector("[data-sim-run]");
    const stepSelect = root.querySelector("[data-sim-step]");
    const playSelect = root.querySelector("[data-sim-play]");
    const date = window.celestialSimulatorTime;

    if (date instanceof Date) {
        dateInput.value = formatSimulatorDate(date);
        if (document.activeElement !== timeInput)
            timeInput.value = formatSimulatorTime(date);
    }

    if (runButton) {
        runButton.textContent = celestialSimulatorRunning ? "⏸ Pause" : "▶ Play";
        runButton.setAttribute("aria-pressed", celestialSimulatorRunning ? "true" : "false");
    }

    if (celestialState?.sun?.position) {

        const sun = celestialState.sun.position;
        const diagnostics = root.querySelector("[data-sim-diagnostics]");

        if (diagnostics) {
            diagnostics.innerHTML = `
                <span>Time: <strong>${window.celestialSimulatorTime instanceof Date ? formatSimulatorDateTime(window.celestialSimulatorTime) : "--"}</strong></span>
                <span>State: <strong>${sun.presentationState || "--"}</strong></span>
                <span>Altitude: <strong>${Number.isFinite(sun.altitude) ? sun.altitude.toFixed(2) + "°" : "--"}</strong></span>
                <span>Azimuth: <strong>${Number.isFinite(sun.azimuth) ? sun.azimuth.toFixed(1) + "°" : "--"}</strong></span>
                <span>Above horizon: <strong>${sun.isBelowHorizon ? "NO" : "YES"}</strong></span>
                <span>Reveal: <strong>${Math.round(getSunDiscReveal(sun) * 100)}%</strong></span>
                <span>Sunrise: <strong>${sun.sunriseTime ? formatSimulatorTime(sun.sunriseTime) : "--"}</strong></span>
                <span>Sunset: <strong>${sun.sunsetTime ? formatSimulatorTime(sun.sunsetTime) : "--"}</strong></span>
                <span>Night parked: <strong>${sun.isNightParked ? "YES" : "NO"}</strong></span>
            `;
        }
    }
}

function initializeCelestialSimulator(weather = null) {

    if (!hasCelestialSimulatorParameter())
        return;

    // The simulator is development-only and is created dynamically so it does
    // not require any change to index.html or the normal Conditions markup.
    let root = document.getElementById("celestialSimulator");

    if (!root) {
        const celestialSky = document.getElementById("celestialSky");

        if (!celestialSky)
            return;

        root = document.createElement("div");
        root.id = "celestialSimulator";
        root.hidden = true;
        celestialSky.parentNode.insertBefore(root, celestialSky.nextSibling);
    }

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
                <div class="celestialSimulatorTitle"><strong>Celestial Simulator</strong> <span>(DEV)</span></div>
                <label class="celestialSimulatorField">
                    <span>Date</span>
                    <input data-sim-date type="date" aria-label="Simulated date">
                </label>
                <label class="celestialSimulatorField">
                    <span>Time</span>
                    <input data-sim-time type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="0713" aria-label="Simulated time, four digits">
                </label>
                <label class="celestialSimulatorField celestialSimulatorSelectField">
                    <span>Step</span>
                    <select data-sim-step aria-label="Step size">
                        <option value="1">1 min</option>
                        <option value="10">10 min</option>
                        <option value="60">60 min</option>
                    </select>
                </label>
                <button type="button" data-sim-back aria-label="Step backward">−</button>
                <button type="button" data-sim-forward aria-label="Step forward">+</button>
                <label class="celestialSimulatorField celestialSimulatorSelectField">
                    <span>Play</span>
                    <select data-sim-play aria-label="Play interval">
                        <option value="1">1 min</option>
                        <option value="10">10 min</option>
                        <option value="60">60 min</option>
                    </select>
                </label>
                <button type="button" data-sim-run aria-pressed="false">▶ Play</button>
            </div>
            <div id="celestialSimulatorDiagnostics" data-sim-diagnostics aria-live="polite">
                <span>State: <strong>--</strong></span>
            </div>
        `;

        root.querySelector("[data-sim-back]")
            .addEventListener("click", () => stepCelestialSimulator(-getCelestialSimulatorStep()));
        root.querySelector("[data-sim-forward]")
            .addEventListener("click", () => stepCelestialSimulator(getCelestialSimulatorStep()));
        root.querySelector("[data-sim-run]")
            .addEventListener("click", () => {
                if (celestialSimulatorRunning)
                    stopCelestialSimulatorRun();
                else
                    startCelestialSimulatorRun();
            });

        root.querySelector("[data-sim-time]")
            .addEventListener("change", event => {
                const parsed = parseSimulatorFourDigitTime(event.target.value);
                if (!parsed) {
                    updateCelestialSimulatorControls();
                    return;
                }

                const current =
                    window.celestialSimulatorTime instanceof Date
                        ? new Date(window.celestialSimulatorTime.getTime())
                        : new Date();

                current.setHours(parsed.hour, parsed.minute, 0, 0);
                setCelestialSimulatorTime(current);
            });

        root.querySelector("[data-sim-time]")
            .addEventListener("input", event => {
                event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
            });

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
