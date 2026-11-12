/* Shared preview loader: real app markup, opt-in assets, no service/clock changes. */
window.loadSkyPreviewFrame = async function ({frame, styles, scripts, dataset = {}}) {
    const appBase = new URL("../", location.href);
    const response = await fetch(new URL("index.html", appBase), {cache:"no-store"});
    if (!response.ok) throw new Error(`App layout could not load (${response.status})`);
    const doc = new DOMParser().parseFromString(await response.text(), "text/html");
    // Live Server's reload client assumes an http: location, not about:srcdoc.
    for (const script of doc.querySelectorAll("script:not([src])")) {
        if (script.textContent.includes("Live reload enabled.") && script.textContent.includes("new WebSocket(address)")) script.remove();
    }
    const base = doc.createElement("base");
    base.href = appBase.href;
    doc.head.prepend(base);
    doc.querySelector('link[rel="manifest"]')?.remove();
    // Previews own their renderer/controls; do not start the main-app sky too.
    for (const node of doc.querySelectorAll('script[src="src/js/skyBackground.js"],script[src="src/js/liveSky.js"],link[href="src/css/sky-background.css"],link[href="src/css/live-sky.css"],#liveSkyToggleRow,#liveSkyDetails,#liveSkySettings')) node.remove();
    // Reset must reload changed preview artwork rather than reuse cached assets.
    const previewVersion = String(Date.now());
    const previewAsset = path => {
        const url = new URL(path,appBase);
        url.searchParams.set("preview",previewVersion);
        return url.href;
    };
    for (const href of styles) {
        const link = doc.createElement("link");
        link.rel = "stylesheet"; link.href = previewAsset(href); doc.head.append(link);
    }
    Object.assign(doc.documentElement.dataset, dataset);
    const appScript = doc.querySelector('script[src="src/js/app.js"]');
    if (!appScript) throw new Error("App startup script was not found");
    for (const src of scripts) {
        const script = doc.createElement("script"); script.src = previewAsset(src); appScript.before(script);
    }
    await new Promise(resolve => {
        frame.addEventListener("load", resolve, {once:true});
        frame.contentWindow.skyPreview?.destroy();
        frame.contentWindow.skyLivePreview?.destroy();
        frame.srcdoc = "<!doctype html>\n" + doc.documentElement.outerHTML;
    });
};
