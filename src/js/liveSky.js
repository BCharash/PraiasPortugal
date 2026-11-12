/* Main-app sky consumer. Weather requests and solar ticks remain app-owned. */
function createLiveSkyController({subscribe, onState = () => {}}) {
    let renderer = null, unsubscribe = null, state = null, options = {};
    function update(next) {
        state = next;
        if (!renderer) return;
        const visible = !!next?.beach && !!next.clock;
        renderer.setEnabled(visible);
        renderer.credits.hidden = !visible;
        document.body.dataset.liveSky = visible ? "enabled" : "disabled";
        if (visible) renderer.update(next.beach,next.weather,{
            time:next.clock.civilTime,utcOffsetSeconds:next.clock.utcOffsetSeconds});
        onState(next,renderer.getInputs());
    }
    function stop() {
        unsubscribe?.(); unsubscribe = null;
        renderer?.destroy(); renderer = null;
        delete document.body.dataset.liveSky;
    }
    return {
        setOptions(next) {
            options = next;
            if (!options.skyEnabled) {stop();onState(null);return;}
            if (!renderer) renderer = createSkyBackground();
            renderer.setRendering(options.skyRendering);
            renderer.setMotionEnabled(options.skyAnimation);
            renderer.setAnimationSpeed(options.skyAnimationSpeed);
            document.body.style.setProperty("--live-sky-panel-opacity",String(options.skyPanelOpacity/100));
            if (!unsubscribe) unsubscribe = subscribe(update);
            else update(state);
        },
        destroy:stop
    };
}
