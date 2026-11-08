/* Weather request ownership for the data manager. No DOM, storage or refresh loop. */
function createWeatherRequestManager({service, now = () => Date.now(), setTimer = setTimeout,
    clearTimer = clearTimeout, maximumEntries = 20,
    retryDelay = count => Math.min(60000 * 2 ** (count - 1), 30 * 60000)} = {}) {
    const entries = new Map();
    const limit = Number.isInteger(maximumEntries) && maximumEntries > 0 ? maximumEntries : 20;
    let activeKey = null, generation = 0, inFlight = null, paused = false, destroyed = false;

    function keyFor(beach) {
        if (!beach || !(typeof beach.id === "string" ? beach.id.trim() !== "" : Number.isFinite(beach.id)) ||
            !Number.isFinite(beach.latitude) || Math.abs(beach.latitude) > 90 ||
            !Number.isFinite(beach.longitude) || Math.abs(beach.longitude) > 180) return null;
        return JSON.stringify([beach.id, beach.latitude, beach.longitude]);
    }
    function evaluated(entry) {
        return weatherState.evaluate(entry?.snapshot, entry?.beach, now());
    }
    function dataFor(key) { return evaluated(entries.get(key)).weather; }
    function outcome(kind, key, token, error = null) {
        const current = !destroyed && key !== null && key === activeKey && token === generation;
        return Object.freeze({outcome:kind, key, generation:token,
            data:current && !["superseded", "destroyed", "invalid"].includes(kind) ? dataFor(key) : null,
            freshness:evaluated(entries.get(key)).status, error});
    }
    function cancel(kind = "superseded") {
        if (inFlight) { generation += 1; inFlight.cancel(kind); }
    }
    function entryFor(key, beach) {
        let entry = entries.get(key);
        if (!entry) entry = {beach:{...beach}, snapshot:null, retryAt:null, failureCount:0, error:null};
        entries.delete(key);
        entries.set(key, entry);
        while (entries.size > limit) entries.delete(entries.keys().next().value);
        return entry;
    }
    function request(beach, {force = false} = {}) {
        const key = keyFor(beach);
        if (destroyed) return Promise.resolve(outcome("destroyed", key, generation));
        if (key === null) return Promise.resolve(outcome("invalid", null, generation));
        if (activeKey !== key) {
            cancel(); activeKey = key; generation += 1;
        }
        const entry = entryFor(key, beach);
        if (inFlight?.key === key) return inFlight.promise;
        if (paused) return Promise.resolve(outcome("paused", key, generation));
        if (!force && evaluated(entry).status === "fresh") return Promise.resolve(outcome("cached", key, generation));
        if (entry.retryAt !== null && now() < entry.retryAt) return Promise.resolve(outcome("backoff", key, generation, entry.error));

        const captured = Object.freeze({...beach});
        const token = ++generation;
        const controller = new AbortController();
        let resolveResult, timer, done = false;
        const promise = new Promise(resolve => { resolveResult = resolve; });
        const flight = {key, promise, cancel(kind) { finish(kind); controller.abort(); }};
        inFlight = flight;

        function finish(kind, data = null, error = null) {
            if (done) return;
            done = true;
            clearTimer(timer);
            controller.signal.removeEventListener("abort", aborted);
            const current = !destroyed && inFlight === flight && activeKey === key && generation === token;
            if (current && kind === "success") {
                const snapshot = {beachId:data?.requestedBeachId, latitude:data?.requestedLatitude,
                    longitude:data?.requestedLongitude, conditionTimeMs:data?.conditionTimeMs,
                    fetchedAtMs:data?.fetchedAtMs, weather:data};
                const valid = weatherState.evaluate(snapshot, captured, now());
                if (!valid.weather || (entry.snapshot && snapshot.conditionTimeMs < entry.snapshot.conditionTimeMs)) {
                    kind = "error";
                    error = new Error("Invalid, expired or older weather response for this beach.");
                } else {
                    entry.snapshot = snapshot;
                    entry.failureCount = 0; entry.retryAt = null; entry.error = null;
                    entry.nextUpdate = now() + 15 * 60000;
                }
            }
            if (current && ["error", "timeout"].includes(kind)) {
                entry.failureCount += 1;
                entry.retryAt = now() + retryDelay(entry.failureCount);
                entry.error = error;
            }
            if (current && kind === "aborted") {
                entry.retryAt = null;
                entry.nextUpdate = now() + retryDelay(1);
            }
            if (inFlight === flight) inFlight = null;
            resolveResult(outcome(current ? kind : destroyed ? "destroyed" : "superseded", key, token, error));
        }
        function aborted() { finish("aborted"); }
        controller.signal.addEventListener("abort", aborted, {once:true});
        timer = setTimer(() => {
            finish("timeout", null, new Error("Weather request timed out after 10 seconds."));
            controller.abort();
        }, 10000);
        try {
            Promise.resolve(service(captured, {signal:controller.signal})).then(
                data => finish("success", data),
                error => finish(error?.name === "AbortError" ? "aborted" : "error", null, error));
        } catch (error) { finish(error?.name === "AbortError" ? "aborted" : "error", null, error); }
        return promise;
    }
    function status(beach) {
        const key = beach === undefined ? activeKey : keyFor(beach);
        const entry = entries.get(key), state = evaluated(entry);
        const refreshing = !!inFlight && inFlight.key === key;
        return {key, requestedBeachId:entry?.beach.id ?? null,
            requestedLatitude:entry?.beach.latitude ?? null, requestedLongitude:entry?.beach.longitude ?? null,
            lastUpdated:entry?.snapshot?.fetchedAtMs ?? null, conditionTimeMs:entry?.snapshot?.conditionTimeMs ?? null,
            nextUpdate:entry?.nextUpdate ?? null, retryAt:entry?.retryAt ?? null, failureCount:entry?.failureCount ?? 0,
            error:entry?.error ?? null, refreshing, pendingRefresh:false,
            refreshStatus:refreshing ? "loading" : entry?.error ? "error" : "idle",
            freshness:state.status, ageMs:state.ageMs,
            status:refreshing ? "updating" : entry?.error ? "error" : state.status,
            data:state.weather};
    }
    return {
        request,
        getData(beach) { return status(beach).data; },
        getStatus:status,
        owns(result) { return !destroyed && !!result && result.key !== null && result.key === activeKey &&
            result.generation === generation && !["invalid", "destroyed", "superseded"].includes(result.outcome); },
        isCurrent(result) { return !destroyed && !!result?.data && result.key === activeKey &&
            result.generation === generation && result.data === dataFor(activeKey); },
        setPaused(value) { paused = !!value; },
        clear() { if (!destroyed) { cancel(); generation += 1; entries.clear(); activeKey = null; } },
        destroy() { if (!destroyed) { destroyed = true; cancel("destroyed"); entries.clear(); activeKey = null; } }
    };
}
