"""Opt-in live preview checks; all provider responses supplied by test bootstrap."""
import base64
import pathlib

def check_live_preview(client, wait_for, origin, bootstrap, args):
    # Live-preview integration: real app/services/manager, mocked providers only.
    client.evaluate("localStorage.clear();localStorage.setItem('praiasDePortugalSelectedBeach','praia-de-santa-rita-norte');localStorage.setItem('praiasDePortugalSettings',JSON.stringify({language:'en',temperatureUnit:'celsius'}))")
    persistent=client.evaluate('JSON.stringify(Object.entries(localStorage).sort())')
    live_bootstrap=bootstrap[:bootstrap.index("        localStorage.setItem")] + bootstrap[bootstrap.index('        const originalFetch'):]
    live_bootstrap=live_bootstrap.replace('                if(serviceProbe.followClock)', '''                if(Number.isFinite(serviceProbe.testCode)) payload.current.weather_code=serviceProbe.testCode;
                if(serviceProbe.testClouds) [payload.current.cloud_cover,payload.current.cloud_cover_low,payload.current.cloud_cover_mid,payload.current.cloud_cover_high]=serviceProbe.testClouds;
                if(serviceProbe.followClock)''')
    live_bootstrap+='\nwindow.clockAfterProbe=Date;window.transportAfterProbe=window.fetch;'
    live_probe=client.call('Page.addScriptToEvaluateOnNewDocument',{'source':live_bootstrap})['identifier']
    client.call('Emulation.setDeviceMetricsOverride',{'width':1280,'height':900,'deviceScaleFactor':1,'mobile':False})
    client.call('Page.navigate',{'url':origin+'/labs/sky-live-preview.html'})
    wait_for(client,"document.getElementById('previewFrame')?.contentWindow.skyLivePreview?.isReady() && !document.getElementById('resetPreview').disabled")
    client.evaluate("window.liveApp=document.getElementById('previewFrame').contentWindow;void 0")
    wait_for(client,"liveApp.skyLivePreview.snapshot()?.weather && !liveApp.eval('currentDashboardData.marinePending')")
    assert client.evaluate("serviceProbe.weatherRequests===0 && serviceProbe.marineRequests===0 && liveApp.serviceProbe.weatherRequests===1 && liveApp.serviceProbe.marineRequests===1")
    assert client.evaluate("liveApp.Date===liveApp.clockAfterProbe && liveApp.fetch===liveApp.transportAfterProbe && !liveApp.document.querySelector('script[src*=sky-fixtures],script[src*=sky-weather-state]')")
    assert client.evaluate("liveApp.eval(\"skyLivePreview.snapshot().weather === getDatasetData('weather',findBeach(appState.selectedBeachId))\")")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().beach.id==='praia-de-santa-rita-norte' && liveApp.skyLivePreview.snapshot().weather.cloudCoverLow===20 && liveApp.skyLivePreview.snapshot().weather.cloudCoverMid===60 && liveApp.skyLivePreview.snapshot().weather.cloudCoverHigh===95")
    client.evaluate("liveApp.originalSky=liveApp.document.querySelector('.preview-sky');liveApp.originalPatch=liveApp.originalSky.querySelector('.sky-cloud-patch')")
    assert client.evaluate("liveApp.originalSky.hasAttribute('data-clouds-ready') && !liveApp.originalSky.getAnimations({subtree:true}).some(a=>a instanceof liveApp.CSSTransition)")
    assert client.evaluate("liveApp.document.querySelector('.preview-sky-credits').textContent.includes('Weather data:') && !liveApp.document.querySelector('.preview-sky-credits').textContent.includes('Synthetic') && liveApp.document.querySelector('.preview-sky-credits a').href==='https://open-meteo.com/'")
    before=client.evaluate('[liveApp.serviceProbe.weatherRequests,liveApp.serviceProbe.marineRequests]')
    for page in ['beaches','settings','dashboard']:
        client.evaluate(f"liveApp.document.getElementById('{page}NavButton').click()")
        assert client.evaluate("liveApp.document.querySelector('.preview-sky')===liveApp.originalSky")
    client.evaluate("liveApp.eval(\"temperatureUnitSelect.value='fahrenheit';languageSelect.value='pt';handleSettingsChange()\")")
    assert client.evaluate("liveApp.document.getElementById('dashboardAirTemp').textContent==='64°F'")
    assert client.evaluate('[liveApp.serviceProbe.weatherRequests,liveApp.serviceProbe.marineRequests]')==before
    client.evaluate("liveApp.dispatchEvent(new liveApp.PageTransitionEvent('pagehide',{persisted:true}));liveApp.dispatchEvent(new liveApp.PageTransitionEvent('pageshow',{persisted:true}))")
    assert client.evaluate("liveApp.document.querySelector('.preview-sky')===liveApp.originalSky && liveApp.eval('environmentSubscribers.size')===1")
    assert client.evaluate('[liveApp.serviceProbe.weatherRequests,liveApp.serviceProbe.marineRequests]')==before
    assert client.evaluate('JSON.stringify(Object.entries(localStorage).sort())')==persistent
    # Same nodes, gentle subsequent updates, valid clouds despite missing temperature.
    client.evaluate("liveApp.serviceProbe.testCode=75;liveApp.serviceProbe.testClouds=[85,90,5,10];liveApp.eval(\"refreshWeatherDataset(findBeach(appState.selectedBeachId),{force:true})\")")
    assert client.evaluate("!liveApp.originalSky.querySelector('.preview-sky-snow').hidden && liveApp.originalSky.querySelector('.preview-sky-snow').dataset.intensity==='heavy' && liveApp.originalSky.querySelector('.preview-sky-rain').hidden")
    assert client.evaluate("liveApp.originalSky.querySelector('.sky-cloud-patch')===liveApp.originalPatch && liveApp.originalSky.getAnimations({subtree:true}).some(a=>a instanceof liveApp.CSSTransition)")
    client.evaluate("liveApp.serviceProbe.missingFields=true;liveApp.eval(\"refreshWeatherDataset(findBeach(appState.selectedBeachId),{force:true})\")")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().weather.airTemperature===null && !liveApp.originalSky.querySelector('.preview-sky-snow').hidden && [...liveApp.originalSky.querySelectorAll('[data-tier=low] .sky-cloud-patch')].some(p=>Number(p.style.opacity)>0)")
    # Live sky and detailed Conditions use the same exact current clock/coordinates.
    client.evaluate("liveApp.eval('showSettings()');liveApp.serviceProbe.now+=60000;liveApp.updateCelestialGraphicOnly()")
    assert client.evaluate("liveApp.eval(\"Math.abs(Number(document.querySelector('.preview-sky').dataset.solarElevation)-getCelestialState(environmentContext.create(currentDashboardData.beach,currentDashboardData.weather).celestialWeather,environmentContext.clock()).sun.position.altitude)<1e-9\")")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().clock.instantMs===liveApp.serviceProbe.now")
    client.evaluate("liveApp.eval('showDashboard()')")
    # Comparison/opacity and reduced motion change presentation, never acquisition.
    no_more=client.evaluate('[liveApp.serviceProbe.weatherRequests,liveApp.serviceProbe.marineRequests]')
    client.evaluate("document.getElementById('panelOpacity').value='100';document.getElementById('panelOpacity').dispatchEvent(new Event('input'))")
    assert client.evaluate("liveApp.document.body.style.getPropertyValue('--preview-panel-opacity')==='1'")
    client.evaluate("document.getElementById('skyEnabled').click()")
    assert client.evaluate("liveApp.originalSky.hidden && liveApp.document.body.dataset.skyPreview==='disabled' && liveApp.document.body.classList.contains('background-sunny')")
    client.evaluate("document.getElementById('skyEnabled').click();document.getElementById('skyMotion').click()")
    assert client.evaluate("liveApp.originalSky.dataset.motion==='off' && [...liveApp.originalSky.getAnimations({subtree:true})].every(a=>a.playState!=='running')")
    client.call('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
    client.evaluate("document.getElementById('skyMotion').click()")
    assert client.evaluate("liveApp.originalSky.getAnimations({subtree:true}).length===0")
    client.call('Emulation.setEmulatedMedia',{'features':[]})
    client.evaluate("document.getElementById('panelOpacity').value='30';document.getElementById('panelOpacity').dispatchEvent(new Event('input'))")
    assert client.evaluate('[liveApp.serviceProbe.weatherRequests,liveApp.serviceProbe.marineRequests]')==no_more
    if args.screenshot:
        shot=pathlib.Path(args.screenshot)
        for width,height in [(1280,900),(390,844)]:
            client.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':False})
            client.evaluate("liveApp.eval('renderCurrentDashboard()')")
            capture=client.call('Page.captureScreenshot',{'format':'png'})
            shot.with_name(shot.stem+f'-live-{width}.png').write_bytes(base64.b64decode(capture['data']))
    # Failed refresh retains matching stale weather; hard expiry clears effects immediately.
    client.evaluate("liveApp.serviceProbe.now+=15*60000;liveApp.serviceProbe.weatherFailure=true;liveApp.eval(\"refreshWeatherDataset(findBeach(appState.selectedBeachId),{force:true})\")")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().status.freshness==='stale' && liveApp.skyLivePreview.snapshot().weather && !liveApp.originalSky.querySelector('.preview-sky-snow').hidden && liveApp.document.querySelector('.preview-weather-status').textContent.includes('refresh failed')")
    count=client.evaluate('liveApp.serviceProbe.weatherRequests')
    client.evaluate("liveApp.serviceProbe.now+=60*60000;liveApp.updateCelestialGraphicOnly()")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().status.freshness==='expired' && liveApp.skyLivePreview.snapshot().weather===null && liveApp.originalSky.querySelector('.preview-sky-snow').hidden && liveApp.originalSky.querySelector('.preview-sky-rain').hidden && [...liveApp.originalSky.querySelectorAll('.sky-cloud-patch')].every(p=>p.style.opacity==='0') && !liveApp.originalSky.hasAttribute('data-clouds-ready')")
    assert client.evaluate('liveApp.serviceProbe.weatherRequests')==count
    # The promoted renderer also honors exact Lisbon offsets across browser zones.
    positions=None
    for zone in ['Europe/Lisbon','America/Los_Angeles','Asia/Tokyo']:
        client.call('Emulation.setTimezoneOverride',{'timezoneId':zone})
        current=client.evaluate('''(() => {
            const samples=[];
            for(const instant of ['2026-07-08T23:30:00Z','2026-10-25T00:30:00Z','2026-10-25T01:30:00Z']){
                liveApp.serviceProbe.now=Date.parse(instant);liveApp.updateCelestialGraphicOnly();
                const state=liveApp.skyLivePreview.snapshot();
                samples.push([state.clock.civilTime,state.clock.utcOffsetSeconds,Number(liveApp.originalSky.dataset.solarElevation)]);
            }
            return samples;
        })()''')
        if positions is not None: assert current==positions, 'Live sky solar clock differs by browser timezone: '+zone
        positions=current
    assert positions[0][0].startswith('2026-07-09T00:30') and positions[1][1]==3600 and positions[2][1]==0 and positions[1][2]!=positions[2][2]
    client.call('Emulation.setTimezoneOverride',{'timezoneId':'Europe/Lisbon'})
    assert client.evaluate('liveApp.serviceProbe.weatherRequests')==count
    # Cold failed beach and late results cannot preserve the previous beach's sky.
    client.evaluate("liveApp.serviceProbe.now=Date.parse('2026-11-08T12:08:00Z');liveApp.serviceProbe.missingFields=false;liveApp.eval(\"clearWeatherDataset();saveSelectedBeach('praia-de-santa-rita-sul');displayBeach('praia-de-santa-rita-sul')\")")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().status.freshness==='unavailable' && liveApp.skyLivePreview.snapshot().weather===null && liveApp.originalSky.dataset.beachId==='praia-de-santa-rita-sul'")
    client.evaluate("liveApp.serviceProbe.weatherFailure=false;liveApp.serviceProbe.deferWeather=true;liveApp.serviceProbe.pendingWeather=[];liveApp.eval(\"clearWeatherDataset();saveSelectedBeach('praia-de-santa-rita-norte');window.firstLiveWork=displayBeach('praia-de-santa-rita-norte');void 0\")")
    wait_for(client,"liveApp.serviceProbe.pendingWeather.length===1")
    client.evaluate("liveApp.eval(\"saveSelectedBeach('praia-de-porto-novo');window.secondLiveWork=displayBeach('praia-de-porto-novo');void 0\")")
    wait_for(client,"liveApp.serviceProbe.pendingWeather.length===2")
    client.evaluate("liveApp.serviceProbe.pendingWeather[1]();liveApp.eval('secondLiveWork')")
    client.evaluate("liveApp.serviceProbe.pendingWeather[0]();liveApp.eval('firstLiveWork')")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().weather.requestedBeachId==='praia-de-porto-novo' && liveApp.originalSky.dataset.beachId==='praia-de-porto-novo'")
    # Reset during pending transport releases subscription and roots; each new app owns one request.
    client.evaluate("liveApp.eval(\"clearWeatherDataset();refreshWeatherDataset(findBeach(appState.selectedBeachId));void 0\")")
    for _ in range(3):
        client.evaluate("window.previousLive=liveApp.skyLivePreview;previousLive.destroy();void 0")
        assert client.evaluate("liveApp.eval('environmentSubscribers.size')===0 && !liveApp.document.querySelector('.preview-sky,.preview-sky-credits')")
        client.evaluate("document.getElementById('resetPreview').click()")
        wait_for(client,"document.getElementById('previewFrame').contentWindow.skyLivePreview && document.getElementById('previewFrame').contentWindow.skyLivePreview!==previousLive && !document.getElementById('resetPreview').disabled")
        client.evaluate("window.liveApp=document.getElementById('previewFrame').contentWindow;void 0")
        wait_for(client,"!!liveApp.skyLivePreview.snapshot()?.weather")
        assert client.evaluate("liveApp.document.querySelectorAll('.preview-sky').length===1 && liveApp.document.querySelectorAll('.preview-sky-credits').length===1 && liveApp.eval('environmentSubscribers.size')===1 && liveApp.serviceProbe.weatherRequests===1")
        assert client.evaluate('JSON.stringify(Object.entries(localStorage).sort())')==persistent
    assert client.evaluate("previewErrors.length===0 && liveApp.previewErrors.length===0")
    # No stored beach: ordinary fallback, no invented beach or weather request.
    client.evaluate("localStorage.removeItem('praiasDePortugalSelectedBeach');window.previousLive=liveApp.skyLivePreview;document.getElementById('resetPreview').click()")
    wait_for(client,"document.getElementById('previewFrame').contentWindow.skyLivePreview && document.getElementById('previewFrame').contentWindow.skyLivePreview!==previousLive && !document.getElementById('resetPreview').disabled")
    client.evaluate("window.liveApp=document.getElementById('previewFrame').contentWindow;void 0")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().beach===null && liveApp.serviceProbe.weatherRequests===0 && liveApp.document.querySelector('.preview-sky').hidden && liveApp.document.body.dataset.skyPreview==='disabled' && liveApp.eval(\"appState.currentPage==='beaches'\")")
    assert client.evaluate("previewErrors.length===0 && liveApp.previewErrors.length===0")
    # First selection can happen entirely in Beaches; the existing solar owner
    # must start without waiting for a visit to Dashboard or another weather fetch.
    assert client.evaluate("liveApp.eval('celestialAutoUpdateTimer===null')")
    client.evaluate("""liveApp.eval("saveSelectedBeach('praia-de-santa-rita-norte');displayBeach('praia-de-santa-rita-norte')")""")
    assert client.evaluate("""liveApp.eval("appState.currentPage==='beaches' && celestialAutoUpdateTimer!==null") && !liveApp.document.querySelector('.preview-sky').hidden""")
    count=client.evaluate('liveApp.serviceProbe.weatherRequests')
    client.evaluate("liveApp.serviceProbe.now+=60000;liveApp.updateCelestialGraphicOnly()")
    assert client.evaluate("liveApp.skyLivePreview.snapshot().clock.instantMs===liveApp.serviceProbe.now")
    assert client.evaluate("liveApp.serviceProbe.weatherRequests")==count
    client.call('Page.removeScriptToEvaluateOnNewDocument',{'identifier':live_probe})
    print('PASS: opt-in live preview shares real manager state; navigation/settings/solar redraws add no requests; freshness, weather effects, late beaches, motion, preference isolation and reset cleanup',flush=True)

