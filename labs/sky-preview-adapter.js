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
        return new RealDate(2026, 10, 7, hour, minute).getTime();
    };
    window.Date = class extends RealDate {
        constructor(...args) { super(...(args.length ? args : [fixtureEpoch()])); }
        static now() { return fixtureEpoch(); }
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

    let weatherRequests = 0;
    const sky = createPreviewSkyBackground();
    sky.setEnabled(true);
    getCurrentWeather = async beach => {
        weatherRequests += 1;
        const weather = fixtures.weather(fixtureKey, beach);
        sky.update(beach, weather);
        return weather;
    };
    getCurrentMarineConditions = async () => fixtures.marine();
    DATASETS.weather.service = getCurrentWeather;
    DATASETS.marine.service = getCurrentMarineConditions;

    // Seed the existing app's startup path without changing its storage keys or source.
    storage.setItem("praiasDePortugalSelectedBeach", "praia-de-santa-rita-norte");

    window.skyPreview = {
        blockedRequests,
        get weatherRequests() { return weatherRequests; },
        get fixtureKey() { return fixtureKey; },
        setSkyEnabled: enabled => sky.setEnabled(enabled),
        setMotionEnabled: enabled => sky.setMotionEnabled(enabled),
        setPanelOpacity: value => {
            if (Number.isFinite(value)) {
                document.body.style.setProperty("--preview-panel-opacity", String(Math.max(0, Math.min(1, value))));
            }
        },
        isReady: () => typeof currentDashboardData !== "undefined" && !!currentDashboardData,
        async setFixture(key) {
            if (!Object.hasOwn(fixtures.cases, key)) throw new Error("Unknown preview fixture");
            fixtureKey = key;
            const page = appState.currentPage;
            if (appState.selectedBeachId) {
                await displayBeach(appState.selectedBeachId);
                // Hidden widgets are redrawn on their normal Dashboard navigation path.
                if (page === "dashboard") updateDashboard(currentDashboardData);
            }
        },
        snapshot: () => ({
            fixtureKey, page: appState.currentPage, beachId: appState.selectedBeachId,
            weather: currentDashboardData?.weather,
            settings: { ...appState.settings },
            clock: fixtures.civilTime(fixtureKey)
        })
    };
})();
