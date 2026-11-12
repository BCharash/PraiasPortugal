/* Preview-only readout of values actually normalized/used by the renderer. */
window.createSkyInputsReadout = function (anchor, source) {
    const root = document.createElement("details");
    root.className = "preview-sky-inputs";
    root.innerHTML = `<summary>Sky inputs</summary>
        <dl><dt>Rendering</dt><dd data-input="rendering"></dd><dt>Source / age</dt><dd data-input="freshness"></dd>
        <dt>Animation</dt><dd data-input="motion"></dd><dt>Cloud cover</dt><dd data-input="clouds"></dd>
        <dt>Weather / effect</dt><dd data-input="condition"></dd>
        <dt>Sun / sky colour</dt><dd data-input="sun"></dd></dl>
        <p>Cloud tiers overlap; percentages are not added. Coverage controls independent cloud amounts, with dense low/mid cloud merging
        into sheets in the revised mode; it is not measured screen area. Total cover helps choose sky colour and star visibility.
        Movement is decorative, not driven by wind.</p>`;
    anchor.after(root);
    const put = (key,value) => { root.querySelector(`[data-input="${key}"]`).textContent = value; };
    const cover = value => Number.isFinite(value) ? `${Math.round(value)}%` : "unknown";
    return {
        update(inputs, freshness, ageMs) {
            root.querySelector("summary").textContent = inputs
                ? `Sky inputs · Low ${cover(inputs.low)} · Mid ${cover(inputs.mid)} · High ${cover(inputs.high)}`
                : "Sky inputs · Choose a beach";
            put("rendering",inputs?.rendering === "revised"
                ? !inputs.hasWeather ? "Revised composite · no usable weather to render"
                    : inputs.low > 60 || inputs.mid > 60 ? "Revised composite · dense low/mid cloud active"
                    : "Revised composite · varied individual shapes; dense sheets require low OR mid above 60%"
                : inputs ? "Previous patches" : "Unavailable");
            put("motion",!inputs ? "Unavailable" : inputs.reducedMotion ? "Disabled by system Reduce Motion setting"
                : !inputs.motionEnabled ? "Paused" : !inputs.hasWeather ? "No usable cloud data to animate"
                : ![inputs.low,inputs.mid,inputs.high].some(value=>Number.isFinite(value) && value>0) ? "No cloud cover to animate"
                : "Running · allow 10–15 seconds to see drift");
            put("freshness",`${source} · ${freshness || "unavailable"}${Number.isFinite(ageMs) ? ` · ${Math.floor(ageMs/60000)} min old` : ""}`);
            put("clouds",inputs ? `Total ${cover(inputs.total)} · Low ${cover(inputs.low)} · Mid ${cover(inputs.mid)} · High ${cover(inputs.high)}` : "Unavailable");
            put("condition", !inputs?.hasWeather ? "Weather unavailable; cloud and precipitation effects cleared."
                : `${inputs.condition} · WMO ${Number.isFinite(inputs.weatherCode) ? inputs.weatherCode : "unknown"} · ${inputs.precipitation ? `${inputs.intensity} ${inputs.precipitation}` : "no rain/snow effect"}`);
            put("sun",inputs ? `${inputs.solarElevation.toFixed(1)}° elevation · ${inputs.palette}` : "Unavailable");
        },
        destroy() { root.remove(); }
    };
};
