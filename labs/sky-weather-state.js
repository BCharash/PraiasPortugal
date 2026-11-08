/* Lab weather semantics adapted from the reference handoff. No provider calls. */
(() => {
"use strict";
const getSkyCondition = weatherState.condition;
const evaluate = weatherState.evaluate;

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
