/* Lab weather semantics adapted from the reference handoff. No provider calls. */
(() => {
"use strict";
function getSkyCondition(code){
  const definitions = [
    [[0], "Clear", "clear", null], [[1], "Mainly Clear", "mainly-clear", null],
    [[2], "Partly Cloudy", "partly-cloudy", null], [[3], "Overcast", "cloud", null],
    [[45,48], "Fog", "fog", null], [[51,53,55], "Drizzle", "rain", "rain"],
    [[56,57], "Freezing Drizzle", "rain", "rain"], [[61,63,65], "Rain", "rain", "rain"],
    [[66,67], "Freezing Rain", "rain", "rain"], [[71,73,75], "Snow", "snow", "snow"],
    [[77], "Snow Grains", "snow", "snow"], [[80,81,82], "Rain Showers", "rain", "rain"],
    [[85,86], "Snow Showers", "snow", "snow"], [[95,97], "Thunderstorm", "storm", "rain"],
    [[96,99], "Thunderstorm with Hail", "storm", "rain"]
  ];
  const entry=definitions.find(([codes])=>codes.includes(code));
  const intensity=[51,56,61,66,71,77,80,85].includes(code) ? "light" :
    [55,57,65,67,75,82,86,96,97,99].includes(code) ? "heavy" : "moderate";
  return entry ? {label:entry[1],icon:entry[2],precipitation:entry[3],intensity,
    drizzle:[51,53,55,56,57].includes(code)} :
    {label:"Conditions unavailable",icon:"unknown",precipitation:null};
}

const MINUTE = 60000;
function evaluate(snapshot, beach, now) {
    const unavailable = reason => ({status: "unavailable", reason, weather: null, ageMs: null});
    if (!snapshot || !snapshot.weather || typeof snapshot.weather !== "object" || Array.isArray(snapshot.weather)) return unavailable("No weather data");
    if (!Number.isFinite(beach.latitude) || Math.abs(beach.latitude) > 90 ||
        !Number.isFinite(beach.longitude) || Math.abs(beach.longitude) > 180) return unavailable("Invalid location");
    if (snapshot.beachId !== beach.id || !Number.isFinite(snapshot.latitude) || !Number.isFinite(snapshot.longitude) ||
        Math.abs(snapshot.latitude - beach.latitude) > .000001 || Math.abs(snapshot.longitude - beach.longitude) > .000001) {
        return unavailable("Location mismatch");
    }
    if (![now, snapshot.fetchedAtMs, snapshot.conditionTimeMs].every(Number.isFinite) ||
        snapshot.fetchedAtMs <= 0 || snapshot.conditionTimeMs <= 0 ||
        snapshot.fetchedAtMs > now + MINUTE || snapshot.conditionTimeMs > now + MINUTE) return unavailable("Invalid weather time");
    const ageMs = Math.max(0, now - snapshot.fetchedAtMs, now - snapshot.conditionTimeMs);
    return {status: ageMs >= 60 * MINUTE ? "expired" : ageMs >= 15 * MINUTE ? "stale" : "fresh",
        reason: ageMs >= 60 * MINUTE ? "Conditions expired" : "", ageMs,
        weather: ageMs < 60 * MINUTE ? snapshot.weather : null};
}

// Owned by the lab adapter, never by the renderer. Injectable time/scheduling
// lets browser checks exercise a real 10-second timeout without waiting ten seconds.
function createController({onState, now, setTimer = setTimeout, clearTimer = clearTimeout}) {
    let location = null, snapshot = null, pending = null, generation = 0, destroyed = false;
    let state = null;
    const publish = (extra = {}) => {
        if (destroyed || !location) return;
        state = {...evaluate(snapshot, location, now()), beach: {...location}, pending: false, ...extra};
        onState(state);
    };
    function cancel() {
        generation += 1;
        pending?.abort();
        pending = null;
    }
    function select(beach) {
        if (!location || location.id !== beach.id || location.latitude !== beach.latitude || location.longitude !== beach.longitude) snapshot = null;
        location = {...beach};
    }
    return {
        get state() { return state; },
        commit(beach, next) {
            if (destroyed) return;
            cancel(); select(beach); snapshot = next; publish();
        },
        recheck() { publish({pending: !!pending}); },
        request(beach, transport) {
            if (destroyed) return Promise.resolve("destroyed");
            cancel(); select(beach);
            const request = new AbortController();
            pending = request;
            const token = generation;
            publish({pending: true});
            return new Promise(resolve => {
                let done = false, timer;
                const finish = (result, next) => {
                    if (done) return;
                    done = true;
                    clearTimer(timer);
                    request.signal.removeEventListener("abort", aborted);
                    if (!destroyed && token === generation && pending === request) {
                        pending = null;
                        if (result === "accepted") {
                            const valid = evaluate(next, location, now());
                            if (valid.weather && (!snapshot || next.conditionTimeMs >= snapshot.conditionTimeMs)) snapshot = next;
                            else result = "invalid";
                        }
                        publish({requestResult: result});
                    }
                    resolve(result);
                };
                const aborted = () => finish("superseded");
                request.signal.addEventListener("abort", aborted, {once: true});
                timer = setTimer(() => { finish("timeout"); request.abort(); }, 10000);
                try {
                    Promise.resolve(transport({signal: request.signal, beach: {...beach}}))
                        .then(next => finish("accepted", next), () => finish("error"));
                } catch (_) { finish("error"); }
            });
        },
        destroy() { if (!destroyed) { destroyed = true; cancel(); snapshot = null; } }
    };
}
window.skyWeatherState = {condition: getSkyCondition, evaluate, createController};
})();
