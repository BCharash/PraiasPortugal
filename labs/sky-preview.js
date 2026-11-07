(() => {
    "use strict";

    const frame = document.getElementById("previewFrame");
    const select = document.getElementById("fixtureSelect");
    const reset = document.getElementById("resetPreview");
    const status = document.getElementById("previewStatus");
    const skyEnabled = document.getElementById("skyEnabled");
    const appBase = new URL("../", location.href);
    let loading = false;

    for (const [key, fixture] of Object.entries(window.skyPreviewFixtures.cases)) {
        select.add(new Option(fixture.label, key));
    }
    select.value = "mixed";

    function showStatus() {
        const snapshot = frame.contentWindow.skyPreview.snapshot();
        status.textContent = `${window.skyPreviewFixtures.cases[snapshot.fixtureKey].label} · ${snapshot.clock} Lisbon`;
    }

    async function loadPreview() {
        loading = true;
        select.disabled = reset.disabled = true;
        status.textContent = "Loading actual app layout…";
        try {
            const response = await fetch(new URL("index.html", appBase), { cache: "no-store" });
            if (!response.ok) throw new Error(`App layout could not load (${response.status})`);
            const doc = new DOMParser().parseFromString(await response.text(), "text/html");
            // The outer lab owns Live Server reloads. Its injected client assumes an
            // http: location and cannot run inside this about:srcdoc frame.
            for (const script of doc.querySelectorAll("script:not([src])")) {
                if (script.textContent.includes("Live reload enabled.") && script.textContent.includes("new WebSocket(address)")) {
                    script.remove();
                }
            }
            const base = doc.createElement("base");
            base.href = appBase.href;
            doc.head.prepend(base);
            const skyStyles = doc.createElement("link");
            skyStyles.rel = "stylesheet";
            skyStyles.href = "labs/sky-background.css";
            doc.head.append(skyStyles);
            doc.documentElement.dataset.previewFixture = select.value;
            doc.querySelector('link[rel="manifest"]')?.remove();
            const appScript = doc.querySelector('script[src="src/js/app.js"]');
            if (!appScript) throw new Error("App startup script was not found");
            for (const source of ["labs/sky-fixtures.js", "labs/sky-background.js", "labs/sky-preview-adapter.js"]) {
                const script = doc.createElement("script");
                script.src = source;
                appScript.before(script);
            }
            await new Promise(resolve => {
                frame.addEventListener("load", resolve, { once: true });
                frame.srcdoc = "<!doctype html>\n" + doc.documentElement.outerHTML;
            });

            const deadline = performance.now() + 10000;
            while (!frame.contentWindow.skyPreview?.isReady()) {
                if (performance.now() > deadline) throw new Error("Preview startup timed out; check the browser console");
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            showStatus();
            frame.contentWindow.skyPreview.setSkyEnabled(skyEnabled.checked);
            select.disabled = reset.disabled = false;
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
    reset.addEventListener("click", loadPreview);
    skyEnabled.addEventListener("change", () => {
        frame.contentWindow.skyPreview?.setSkyEnabled(skyEnabled.checked);
    });
    loadPreview();
})();
