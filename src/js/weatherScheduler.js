/* One data-manager-owned weather wake-up. No DOM, marine work or solar clock. */
function createWeatherScheduler({manager, onChange = () => {}, now = () => Date.now(),
    setTimer = setTimeout, clearTimer = clearTimeout} = {}) {
    let beach = null, timer = null, paused = false, destroyed = false;
    const observed = new Set();

    function cancelWake() {
        if (timer !== null) clearTimer(timer);
        timer = null;
    }
    function nextAttempt(status) {
        return status.retryAt ?? status.nextUpdate ?? now();
    }
    function publish() {
        if (beach && !destroyed) {
            const status = manager.getStatus(beach);
            onChange({beach:{...beach}, weather:status.data, status});
        }
    }
    function schedule() {
        cancelWake();
        if (!beach || paused || destroyed) return;
        const status = manager.getStatus(beach), deadlines = [];
        if (!status.refreshing) deadlines.push(nextAttempt(status));
        // Age and request cadence are independent: an old model must not make
        // every successful refresh immediately due again.
        if (status.data) {
            const origin = Math.min(status.lastUpdated, status.conditionTimeMs);
            for (const minutes of [15,60]) {
                const boundary = origin + minutes * 60000;
                if (boundary > now()) deadlines.push(boundary);
            }
        }
        if (!deadlines.length) return;
        timer = setTimer(reconcile, Math.max(0, Math.min(...deadlines) - now()));
    }
    function reconcile() {
        cancelWake();
        if (!beach || paused || destroyed) return;
        publish();
        const status = manager.getStatus(beach);
        if (!status.refreshing && nextAttempt(status) <= now()) request(beach, {force:true});
        else schedule();
    }
    function request(selected, options) {
        if (destroyed) return manager.request(selected, options);
        const promise = manager.request(selected, options);
        // An invalid request must not displace a valid scheduled identity.
        const status = manager.getStatus(selected);
        if (selected && status.key !== null) beach = {...selected};
        publish();
        schedule();
        if (!observed.has(promise)) {
            observed.add(promise);
            promise.then(() => {
                observed.delete(promise);
                // Superseded completions only reconcile the current identity.
                publish();
                schedule();
            });
        }
        return promise;
    }
    return {
        request,
        setPaused(value) {
            paused = !!value;
            manager.setPaused(paused);
            cancelWake();
            if (!paused) reconcile();
        },
        clear() { cancelWake(); beach = null; manager.clear(); },
        destroy() {
            destroyed = true;
            cancelWake(); beach = null; manager.destroy(); observed.clear();
        }
    };
}
