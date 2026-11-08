(() => {
    "use strict";

    const frame = document.getElementById("previewFrame");
    const select = document.getElementById("fixtureSelect");
    const scenarioSelect = document.getElementById("scenarioSelect");
    const advanceAge = document.getElementById("advanceAge");
    const reset = document.getElementById("resetPreview");
    const status = document.getElementById("previewStatus");
    const skyEnabled = document.getElementById("skyEnabled");
    const skyMotion = document.getElementById("skyMotion");
    const panelOpacity = document.getElementById("panelOpacity");
    const panelOpacityValue = document.getElementById("panelOpacityValue");
    let loading = false;

    for (const [key, fixture] of Object.entries(window.skyPreviewFixtures.cases)) {
        select.add(new Option(fixture.label, key));
    }
    select.value = "mixed";
    for (const [key, label] of Object.entries(window.skyPreviewFixtures.scenarios)) scenarioSelect.add(new Option(label, key));

    function showStatus() {
        const snapshot = frame.contentWindow.skyPreview.snapshot();
        status.textContent = `${window.skyPreviewFixtures.cases[snapshot.fixtureKey].label} · ${snapshot.clock} Lisbon · ${snapshot.weatherState?.status || "loading"}`;
    }

    async function loadPreview() {
        loading = true;
        select.disabled = scenarioSelect.disabled = advanceAge.disabled = reset.disabled = true;
        status.textContent = "Loading actual app layout…";
        try {
            await loadSkyPreviewFrame({frame,
                styles:["src/css/sky-background.css","labs/sky-background.css"],
                scripts:["labs/sky-weather-state.js","labs/sky-fixtures.js","src/js/skyBackground.js","labs/sky-preview-adapter.js"],
                dataset:{previewFixture:select.value,previewScenario:scenarioSelect.value}
            });

            const deadline = performance.now() + 10000;
            while (!frame.contentWindow.skyPreview?.isReady()) {
                if (performance.now() > deadline) throw new Error("Preview startup timed out; check the browser console");
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            frame.contentWindow.addEventListener("sky-preview-state", showStatus);
            showStatus();
            frame.contentWindow.skyPreview.setSkyEnabled(skyEnabled.checked);
            frame.contentWindow.skyPreview.setMotionEnabled(skyMotion.checked);
            frame.contentWindow.skyPreview.setPanelOpacity(Number(panelOpacity.value) / 100);
            select.disabled = scenarioSelect.disabled = advanceAge.disabled = reset.disabled = false;
        } catch (error) {
            status.textContent = error.message;
            reset.disabled = false;
        } finally {
            loading = false;
        }
    }

    select.addEventListener("change", async () => {
        if (loading) return;
        select.disabled = reset.disabled = true;
        try {
            await frame.contentWindow.skyPreview.setFixture(select.value);
            showStatus();
        } catch (error) {
            status.textContent = error.message;
        } finally {
            select.disabled = reset.disabled = false;
        }
    });
    scenarioSelect.addEventListener("change", async () => {
        scenarioSelect.disabled = select.disabled = reset.disabled = true;
        try { await frame.contentWindow.skyPreview.setScenario(scenarioSelect.value); showStatus(); }
        catch (error) { status.textContent = error.message; }
        finally { scenarioSelect.disabled = select.disabled = reset.disabled = false; }
    });
    advanceAge.addEventListener("click", () => frame.contentWindow.skyPreview?.advanceAge());
    reset.addEventListener("click", loadPreview);
    skyEnabled.addEventListener("change", () => {
        frame.contentWindow.skyPreview?.setSkyEnabled(skyEnabled.checked);
    });
    skyMotion.addEventListener("change", () => {
        frame.contentWindow.skyPreview?.setMotionEnabled(skyMotion.checked);
    });
    panelOpacity.addEventListener("input", () => {
        panelOpacityValue.value = `${panelOpacity.value}%`;
        frame.contentWindow.skyPreview?.setPanelOpacity(Number(panelOpacity.value) / 100);
    });
    loadPreview();
})();
