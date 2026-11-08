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
        return environmentContext.parseCivil(environmentContext.clock().civilTime);

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

    const next = environmentContext.civilDate(date.getTime());
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

    const next = environmentContext.civilDate(window.celestialSimulatorTime.getTime());
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
                        ? environmentContext.civilDate(window.celestialSimulatorTime.getTime())
                        : environmentContext.parseCivil(environmentContext.clock().civilTime);

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
                        ? environmentContext.civilDate(window.celestialSimulatorTime.getTime())
                        : environmentContext.parseCivil(environmentContext.clock().civilTime);

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

    publishApplicationEnvironment();

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

    renderConditionsCelestial(currentDashboardData);

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

// Build the same selected-location/clock context used by the future sky consumer.
function renderConditionsCelestial(data) {
    const context = environmentContext.create(data?.beach, data?.weather);
    latestCelestialWeather = context?.celestialWeather ?? null;
    if (!context) return null;
    const weather = context.celestialWeather;
    initializeCelestialSimulator({...weather,currentTime:context.clock.civilTime});
    const celestial = getCelestialState(weather, context.clock);
    startCelestialAutoUpdate();
    updateCelestialSimulatorControls(celestial);
    const clockLabel = date => date instanceof Date && !Number.isNaN(date.getTime())
        ? `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}` : "--";
    for (const [id,time] of [["dashboardSunrise",celestial?.sun.position?.sunriseTime],
        ["dashboardSunset",celestial?.sun.position?.sunsetTime]]) {
        const node = document.getElementById(id);
        if (node) node.textContent = clockLabel(time);
    }
    const graphic = document.getElementById("celestialGraphic");
    if (graphic) graphic.innerHTML = celestial ? renderCelestialGraphic(celestial,weather,graphic.clientWidth,graphic.clientHeight) : "";
    return celestial;
}

function updateConditions(data) {
    const weather = data.weather;
    window.testWeather = weather;
    const put = (id, value) => { const node=document.getElementById(id); if(node) node.textContent=value; };
    const marker = (id, show) => { const node=document.getElementById(id); if(node) node.hidden=!show; };
    const finite = Number.isFinite;
    const freshness = data.weatherStatus?.freshness;
    weatherConditionElement.textContent = weather
        ? `${formatConditions(weather)}${freshness === "stale" ? ` · ${translate("weatherStale")}` : ""}`
        : translate(data.weatherPending ? "weatherLoading" : freshness === "expired" ? "weatherExpired" : "weatherUnavailable");
    weatherConditionElement.classList.toggle("weather-status", !weather);
    weatherConditionElement.title = data.weatherStatus?.refreshStatus === "error" ? translate("weatherRefreshFailed") : "";
    if (!weather && weatherIconElement) weatherIconElement.innerHTML="";
    const coastal = weather ? getCurrentCoastalCondition(weather) || getCoastalFogRisk(weather) : null;
    if (coastalConditionElement) coastalConditionElement.textContent=coastal?.label || "";

    airTempElement.textContent = formatAirTemperature(weather);
    airHumidityElement.textContent = formatHumidity(weather);
    airFeelsLikeElement.textContent = formatFeelsLike(weather);
    windElement.textContent = formatWind(weather);
    put("dashboardTempMin", finite(weather?.lowTemperature) ? `${Math.round(convertTemperature(weather.lowTemperature))}°` : "--");
    put("dashboardTempMax", finite(weather?.highTemperature) ? `${Math.round(convertTemperature(weather.highTemperature))}°` : "--");
    const range = document.getElementById("dashboardTemperatureRange");
    const validRange = finite(weather?.airTemperature) && finite(weather?.lowTemperature) && finite(weather?.highTemperature) &&
        weather.highTemperature !== weather.lowTemperature;
    marker("dashboardTempMarker",validRange);
    if (range) {
        if (validRange) range.style.setProperty("--temperature-position", `${Math.max(0,Math.min(1,
            (weather.airTemperature-weather.lowTemperature)/(weather.highTemperature-weather.lowTemperature)))*100}%`);
        else range.style.removeProperty("--temperature-position");
    }

    uvElement.textContent = formatUVValue(weather);
    uvRiskElement.textContent = formatUVRisk(weather);
    uvMaximumElement.textContent = finite(weather?.uvIndexMax) ? `${translate("uvMaximum")} ${Math.round(weather.uvIndexMax)}` : "--";
    marker("dashboardUVCurrentMarker",finite(weather?.uvIndex));
    marker("dashboardUVMaxMarker",finite(weather?.uvIndexMax));
    if (uvRangeElement) {
        for (const [field,property] of [["uvIndex","--uv-current-position"],["uvIndexMax","--uv-maximum-position"]]) {
            if (finite(weather?.[field])) uvRangeElement.style.setProperty(property,`${Math.max(0,Math.min(1,weather[field]/UV_SCALE_MAX))*100}%`);
            else uvRangeElement.style.removeProperty(property);
        }
    }

    renderConditionsCelestial(data);
    const moon = document.getElementById("dashboardMoonPhase");
    if (moon) {
        if (finite(weather?.moonPhase)) {
            moon.innerHTML = `<img class="dashboard-moon-image" src="${getMoonPhaseImageUrl(weather.moonPhase)}" alt="${formatMoonPhase(weather.moonPhase)}">`;
        } else moon.textContent = "--";
    }
    put("dashboardMoonIllumination", finite(weather?.moonPhase) ? formatMoonIllumination(weather.moonPhase) : "--");
    seaTempElement.textContent = formatSeaTemperature(data.marine);
    surfElement.textContent = formatSurf(data.marine);
    tideElement.textContent = data.tide ? `${formatCurrentTideHeight(data.tide)} ${formatTideTrend(data.tide)}` : "--";
    const marineStatus = document.getElementById("dashboardMarineStatus");
    if (marineStatus) {
        marineStatus.hidden = !!data.marine && data.marineStatus === "ready";
        marineStatus.textContent = marineStatus.hidden ? "" : translate(data.marinePending ? "marineLoading" : "marineUnavailable");
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
