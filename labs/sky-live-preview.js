/* Live preview shell. No fixture services, clock replacement or weather requests. */
(() => {
    "use strict";
    const frame = document.getElementById("previewFrame"), reset = document.getElementById("resetPreview");
    const status = document.getElementById("previewStatus"), enabled = document.getElementById("skyEnabled");
    const motion = document.getElementById("skyMotion"), opacity = document.getElementById("panelOpacity");
    let loading = false;
    function showStatus() {
        const state = frame.contentWindow.skyLivePreview.snapshot();
        status.textContent = state?.beach
            ? `${state.beach.name} · ${state.clock.civilTime.slice(0,16)} Lisbon · ${state.status.freshness}`
            : "Choose a beach in the Beaches view.";
    }
    async function load() {
        if (loading) return;
        loading = true;reset.disabled = true;
        status.textContent = "Loading actual app layout…";
        try {
            await loadSkyPreviewFrame({frame,
                styles:["src/css/sky-background.css","labs/sky-background.css"],
                scripts:["src/js/skyBackground.js","labs/sky-inputs.js","labs/sky-live-preview-adapter.js"]});
            const deadline = performance.now()+10000;
            while (!frame.contentWindow.skyLivePreview?.isReady()) {
                if (performance.now()>deadline) throw new Error("Preview startup timed out; check the browser console");
                await new Promise(resolve=>setTimeout(resolve,50));
            }
            frame.contentWindow.addEventListener("sky-live-preview-state",showStatus);
            const preview = frame.contentWindow.skyLivePreview;
            preview.setSkyEnabled(enabled.checked);preview.setMotionEnabled(motion.checked);
            preview.setPanelOpacity(Number(opacity.value)/100);showStatus();
        } catch(error) { status.textContent = error.message; }
        finally {loading = false;reset.disabled = false;}
    }
    reset.addEventListener("click",load);
    enabled.addEventListener("change",()=>frame.contentWindow.skyLivePreview?.setSkyEnabled(enabled.checked));
    motion.addEventListener("change",()=>frame.contentWindow.skyLivePreview?.setMotionEnabled(motion.checked));
    opacity.addEventListener("input",()=>{
        document.getElementById("panelOpacityValue").value = `${opacity.value}%`;
        frame.contentWindow.skyLivePreview?.setPanelOpacity(Number(opacity.value)/100);
    });
    load();
})();
