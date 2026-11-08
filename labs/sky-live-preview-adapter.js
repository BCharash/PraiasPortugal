/* Opt-in frame adapter only. Real services/clock; temporary preview preferences. */
(() => {
    "use strict";
    const values = new Map();
    // Seed the preview from existing app choices without writing to them.
    for (const key of ["praiasDePortugalSettings","praiasDePortugalSelectedBeach","praiasDePortugalFavorites"]) {
        const value = localStorage.getItem(key);
        if (value !== null) values.set(key,value);
    }
    function storage(map) {
        return {getItem:key=>map.get(String(key)) ?? null,
            setItem:(key,value)=>map.set(String(key),String(value)),removeItem:key=>map.delete(String(key)),
            clear:()=>map.clear(),key:index=>[...map.keys()][index] ?? null,get length(){return map.size;}};
    }
    Object.defineProperty(window,"localStorage",{value:storage(values)});
    Object.defineProperty(window,"sessionStorage",{value:storage(new Map())});

    let sky, unsubscribe, destroyed = false, snapshot = null;
    function announce() { window.dispatchEvent(new Event("sky-live-preview-state")); }
    function start() {
        if (destroyed) return;
        sky = createSkyBackground();
        const status = document.createElement("div");
        status.className = "preview-weather-status"; status.setAttribute("role","status");
        document.getElementById("applicationHeader").after(status);
        const inputsReadout = createSkyInputsReadout(status,"Live model data");
        unsubscribe = subscribeApplicationEnvironment(state => {
            if (destroyed) return;
            snapshot = state;
            if (!state.beach || !state.clock) {
                sky.setEnabled(false);
                sky.root.removeAttribute("data-clouds-ready");
                status.textContent = "Choose a beach in Beaches to preview its sky.";
            } else {
                sky.setEnabled(enabled);
                sky.update(state.beach,state.weather,{time:state.clock.civilTime,utcOffsetSeconds:state.clock.utcOffsetSeconds});
                sky.root.dataset.weatherStatus = state.status.freshness;
                const age = state.status.ageMs === null ? "" : ` · ${Math.floor(state.status.ageMs/60000)} min old`;
                status.textContent = `${state.beach.name} · ${state.status.freshness}${age}${state.status.refreshing ? " · updating…" : state.status.error ? " · refresh failed" : ""}`;
            }
            inputsReadout.update(state.beach ? sky.getInputs() : null,state.status?.freshness,state.status?.ageMs);
            announce();
        });
        window.skyLivePreview = {
            isReady:()=>regionSelect.options.length>1,
            snapshot:()=>snapshot,
            setSkyEnabled(value) {
                enabled = !!value; sky.setEnabled(enabled && !!snapshot?.beach);
            },
            setMotionEnabled:value=>sky.setMotionEnabled(value),
            setPanelOpacity(value) {
                if (Number.isFinite(value)) document.body.style.setProperty("--preview-panel-opacity",String(Math.max(0,Math.min(1,value))));
            },
            destroy() {
                if (destroyed) return;
                destroyed = true; unsubscribe();sky.destroy();status.remove();inputsReadout.destroy();
            }
        };
        sky.setEnabled(enabled && !!snapshot?.beach);
    }
    let enabled = true;
    document.addEventListener("DOMContentLoaded",start,{once:true});
    // A history-cache restore keeps the mounted preview; final unload releases it.
    window.addEventListener("pagehide",event=>{if(!event.persisted) window.skyLivePreview?.destroy();});
})();
