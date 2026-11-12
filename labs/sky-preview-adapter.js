/* Installed only in the lab frame, after service definitions and before app startup. */
(() => {
    "use strict";

    const fixtures = window.skyPreviewFixtures;
    let fixtureKey = document.documentElement.dataset.previewFixture;
    if (!Object.hasOwn(fixtures.cases, fixtureKey)) throw new Error("Unknown preview fixture");

    // Per-frame storage: even opening this lab on the normal app's origin is safe.
    const values = new Map();
    const storage = {
        getItem: key => values.get(String(key)) ?? null,
        setItem: (key, value) => values.set(String(key), String(value)),
        removeItem: key => values.delete(String(key)),
        clear: () => values.clear(),
        key: index => [...values.keys()][index] ?? null,
        get length() { return values.size; }
    };
    Object.defineProperty(window, "localStorage", { value: storage });
    Object.defineProperty(window, "sessionStorage", { value: storage });

    // Freeze the civil clock as expected by the host's existing celestial/tide services.
    // Explicit dates still parse normally; the real browser clock remains untouched.
    const RealDate = window.Date;
    const fixtureEpoch = () => {
        const [hour, minute] = fixtures.cases[fixtureKey].time.split(":").map(Number);
        return RealDate.UTC(2026, 10, 7, hour, minute);
    };
    window.Date = class extends RealDate {
        constructor(...args) { super(...(args.length ? args : [fixtureEpoch()])); }
        static now() { return fixtureEpoch(); }
        static [Symbol.hasInstance](value) { return value instanceof RealDate; }
    };

    const realFetch = window.fetch.bind(window);
    const appOrigin = new URL(document.baseURI).origin;
    const blockedRequests = [];
    window.fetch = (input, options) => {
        const url = new URL(input instanceof Request ? input.url : input, document.baseURI);
        if (url.origin !== appOrigin) {
            blockedRequests.push(url.href);
            return Promise.reject(new Error("External requests are disabled in the fixture preview"));
        }
        return realFetch(input, options);
    };

    let weatherRequests = 0, scenario = document.documentElement.dataset.previewScenario || "fresh", ageOffset = 0, destroyed = false;
    const timers = new Set();
    const schedule = (fn, delay) => {
        const timer = setTimeout(() => { timers.delete(timer); fn(); }, delay);
        timers.add(timer);
        return timer;
    };
    const unschedule = timer => { clearTimeout(timer); timers.delete(timer); };
    const evaluationTime = () => RealDate.parse(fixtures.civilTime(fixtureKey) + ":00Z") + ageOffset;
    const sky = createSkyBackground({creditLabel:"Synthetic fixtures · Illustrative sky · Weather provider for future live data:"});
    sky.setEnabled(true);
    const status = document.createElement("div");
    status.className = "preview-weather-status";
    status.setAttribute("role", "status");
    document.getElementById("applicationHeader").after(status);

    const inputsReadout = createSkyInputsReadout(status,"Synthetic fixture");

    function fixturePayload(state) {
        if (!state.weather) return null;
        return {...state.weather,requestedBeachId:state.beach.id,requestedLatitude:state.beach.latitude,
            requestedLongitude:state.beach.longitude,fetchedAtMs:Date.now(),
            conditionTimeMs:Date.now()-(state.ageMs || 0)};
    }
    const controller = skyWeatherState.createController({
        now: evaluationTime, setTimer: schedule, clearTimer: unschedule,
        onState: state => {
            if (destroyed || (appState.selectedBeachId && appState.selectedBeachId !== state.beach.id)) return;
            sky.update(state.beach, state.weather, {time: fixtures.civilTime(fixtureKey)});
            sky.root.dataset.weatherStatus = state.status;
            inputsReadout.update(sky.getInputs(),state.status,state.ageMs);
            const condition = skyWeatherState.condition(state.weather?.weatherCode);
            const age = state.ageMs === null ? "" : ` · ${Math.floor(state.ageMs / 60000)} min old`;
            const result = {timeout:" · refresh timed out",error:" · refresh failed",invalid:" · invalid response ignored"}[state.requestResult] || "";
            status.textContent = `${state.beach.name} · ${state.weather ? state.status === "stale" ? "Stale weather" : "Fresh weather" : "Weather unavailable"}${age} · ${state.weather ? condition.label : state.reason}${state.pending ? " · loading fixture response…" : result}`;
            if (currentDashboardData?.beach.id === state.beach.id) {
                currentDashboardData.weather = fixturePayload(state);
                currentDashboardData.weatherStatus = {freshness:state.status, refreshStatus:state.pending ? "loading" : state.requestResult ? "error" : "idle"};
                if (appState.currentPage === "dashboard") updateDashboard(currentDashboardData);
            }
            window.dispatchEvent(new Event("sky-preview-state"));
        }
    });
    function transport(key, beach, {fail = false, ignoreAbort = false} = {}) {
        return ({signal}) => new Promise((resolve, reject) => {
            const finish = () => {
                signal.removeEventListener("abort", aborted);
                if (fail) reject(new Error("Simulated offline refresh"));
                else resolve(fixtures.snapshot(key, beach, evaluationTime()));
            };
            const timer = schedule(finish, 1200);
            const aborted = () => { unschedule(timer); reject(new Error("Superseded fixture request")); };
            if (!ignoreAbort) signal.addEventListener("abort", aborted, {once: true});
        });
    }
    getCurrentWeather = async beach => {
        weatherRequests += 1;
        const key = fixtureKey;
        controller.commit(beach, fixtures.snapshot(key, beach, evaluationTime(), scenario));
        if (["staleSuccess", "staleFailure", "delayed"].includes(scenario)) {
            void controller.request(beach, transport(key, beach, {fail: scenario === "staleFailure"}));
        } else if (scenario === "timeout") {
            void controller.request(beach, () => new Promise(() => {}));
        } else if (scenario === "lateBeach") {
            const other = beaches.find(item => item.id !== beach.id);
            if (other) {
                void controller.request(other, transport(key, other, {ignoreAbort: true}));
                controller.commit(beach, fixtures.snapshot(key, beach, evaluationTime()));
            }
        }
        const payload = fixturePayload(controller.state);
        if (!payload) throw new Error("Simulated unavailable fixture weather");
        return payload;
    };
    getCurrentMarineConditions = async () => fixtures.marine();
    DATASETS.weather.service = getCurrentWeather;
    DATASETS.marine.service = getCurrentMarineConditions;
    const normalDisplayBeach = displayBeach;
    // A fixture/scenario change is deliberate new data, not a cached live read.
    displayBeach = beachId => normalDisplayBeach(beachId, {forceWeather:true});
    storage.setItem("praiasDePortugalSelectedBeach", "praia-de-santa-rita-norte");

    async function redisplay() {
        if (destroyed || !appState.selectedBeachId) return;
        await displayBeach(appState.selectedBeachId);
        if (!destroyed && appState.currentPage === "dashboard") updateDashboard(currentDashboardData);
    }
    function destroy() {
        if (destroyed) return;
        destroyed = true;
        controller.destroy();
        for (const timer of timers) clearTimeout(timer);
        timers.clear();
        inputsReadout.destroy();
        sky.destroy();
        status.remove();
    }
    window.addEventListener("pagehide", destroy, {once:true});
    window.skyPreview = {
        blockedRequests,
        get weatherRequests() { return weatherRequests; },
        get fixtureKey() { return fixtureKey; },
        setSkyEnabled: enabled => sky.setEnabled(enabled),
        setMotionEnabled(enabled) {
            sky.setMotionEnabled(enabled);
            if (controller.state) inputsReadout.update(sky.getInputs(),controller.state.status,controller.state.ageMs);
        },
        setRendering(value) {
            sky.setRendering(value);
            if (controller.state) inputsReadout.update(sky.getInputs(),controller.state.status,controller.state.ageMs);
        },
        setPanelOpacity: value => {
            if (Number.isFinite(value)) document.body.style.setProperty("--preview-panel-opacity", String(Math.max(0, Math.min(1, value))));
        },
        isReady: () => typeof currentDashboardData !== "undefined" && !!currentDashboardData &&
            !currentDashboardData.weatherPending && !currentDashboardData.marinePending,
        async setFixture(key) {
            if (!Object.hasOwn(fixtures.cases, key)) throw new Error("Unknown preview fixture");
            clearWeatherDataset(); // Fixture clocks may deliberately move backwards.
            fixtureKey = key; ageOffset = 0;
            await redisplay();
        },
        async setScenario(key) {
            if (!Object.hasOwn(fixtures.scenarios, key)) throw new Error("Unknown data scenario");
            clearWeatherDataset(); // A scenario intentionally replaces its weather history.
            scenario = key; ageOffset = 0;
            await redisplay();
        },
        advanceAge() { if (!destroyed) { ageOffset += 15 * 60000; controller.recheck(); } },
        destroy,
        snapshot: () => ({
            fixtureKey, scenario, page: appState.currentPage, beachId: appState.selectedBeachId,
            weather: currentDashboardData?.weather, weatherState: controller.state,
            pendingTimers: timers.size, destroyed,
            settings: {...appState.settings}, clock: fixtures.civilTime(fixtureKey)
        })
    };
})();
