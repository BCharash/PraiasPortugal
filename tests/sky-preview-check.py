#!/usr/bin/env python3
"""Check the isolated fixture lab in Chrome, without third-party Python packages.

Run: python3 tests/sky-preview-check.py
Uses a temporary browser profile and loopback server; never uses your browser data.
"""
import base64
import argparse
import http.server
import html
import json
import os
import pathlib
import shutil
import socket
import struct
import subprocess
import tempfile
import threading
import time
import urllib.request
from sky_live_preview_check import check_live_preview

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = os.environ.get("CHROME_BIN", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--screenshot', help='Save a mobile preview screenshot to this PNG path')
parser.add_argument('--review-dir', help='Write a fixed-scene acceptance gallery and layout measurements here')
parser.add_argument('--service-only', action='store_true', help='Run only the deterministic weather-service contract checks')
parser.add_argument('--requests-only', action='store_true', help='Run deterministic service and weather-request ownership checks only')
parser.add_argument("--live-only", action="store_true", help="Run service/request contracts and only the live-preview integration checks")
args = parser.parse_args()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *args):
        pass
    def do_GET(self):
        if self.path.split('?')[0] == '/index.html':
            # Reproduce Live Server's injected script markers and srcdoc URL issue.
            # Only the outer page should run a live-reload client.
            injected = '''<!-- Code injected by live-server --><script>
                if (location.protocol === 'about:') {
                    const address = 'ws://' + location.host + location.pathname + '/ws';
                    new WebSocket(address);
                }
                console.log('Live reload enabled.');
            </script>'''
            content = (ROOT / 'index.html').read_text().replace('</body>', injected + '</body>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            super().do_GET()

class CDP:
    def __init__(self, url):
        from urllib.parse import urlsplit
        u = urlsplit(url)
        self.sock = socket.create_connection((u.hostname, u.port), timeout=90)
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall(f'GET {u.path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode())
        response = b''
        while not response.endswith(b'\r\n\r\n'): response += self.sock.recv(1)
        assert response.startswith(b'HTTP/1.1 101 '), response
        self.n = 0
    def read(self, size):
        b = b''
        while len(b) < size:
            chunk = self.sock.recv(size-len(b))
            if not chunk: raise RuntimeError('CDP disconnected')
            b += chunk
        return b
    def call(self, method, params=None):
        self.n += 1
        body = json.dumps({'id':self.n,'method':method,'params':params or {}}).encode()
        mask = os.urandom(4)
        size = len(body)
        head = bytes([0x81, 0x80 | size]) if size < 126 else bytes([0x81, 0x80 | 126]) + struct.pack('!H', size)
        self.sock.sendall(head + mask + bytes(v ^ mask[i%4] for i,v in enumerate(body)))
        while True:
            h = self.read(2); size = h[1] & 127
            if size == 126: size = struct.unpack('!H', self.read(2))[0]
            elif size == 127: size = struct.unpack('!Q', self.read(8))[0]
            message = json.loads(self.read(size))
            if message.get('id') == self.n:
                if 'error' in message: raise RuntimeError(message)
                return message.get('result', {})
    def evaluate(self, expression):
        result = self.call('Runtime.evaluate', {'expression':expression,'awaitPromise':True,'returnByValue':True})
        if 'exceptionDetails' in result: raise RuntimeError(result)
        return result.get('result',{}).get('value')


def wait_for(client, expression):
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        if client.evaluate(expression):
            return
        time.sleep(0.05)
    details = client.evaluate('''(() => {
        const frame = document.getElementById('previewFrame');
        return {
            status: document.getElementById('previewStatus')?.textContent,
            errors: window.previewErrors,
            frameErrors: frame?.contentWindow.previewErrors,
            frameBody: frame?.contentDocument.body?.textContent.slice(-300),
            ready: frame?.contentWindow.skyPreview?.isReady()
        };
    })()''')
    raise AssertionError(f"Timed out: {expression}\n{details}")


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
profile = pathlib.Path(tempfile.mkdtemp(prefix='praias-sky-check-'))
chrome = None
try:
    chrome = subprocess.Popen([
        CHROME, '--headless', '--no-first-run', '--no-default-browser-check',
        '--remote-debugging-port=0', '--user-data-dir=' + str(profile), 'about:blank'
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.monotonic() + 15
    while not (profile / 'DevToolsActivePort').exists() or not (profile / 'DevToolsActivePort').read_text().strip():
        if time.monotonic() > deadline:
            raise RuntimeError('Chrome did not start')
        time.sleep(0.1)
    port = (profile / 'DevToolsActivePort').read_text().splitlines()[0]
    target = json.load(urllib.request.urlopen(urllib.request.Request(
        f'http://127.0.0.1:{port}/json/new?about:blank', method='PUT')))
    client = CDP(target['webSocketDebuggerUrl'])
    client.call('Page.enable')
    client.call('Page.addScriptToEvaluateOnNewDocument', {'source': '''
        window.previewErrors = [];
        addEventListener('error', event => previewErrors.push(event.message));
        addEventListener('unhandledrejection', event => previewErrors.push(String(event.reason)));
    '''})
    origin = f'http://127.0.0.1:{server.server_port}'

    environment_fingerprints = None
    for zone in ['Europe/Lisbon','America/Los_Angeles','Asia/Tokyo']:
        client.call('Emulation.setTimezoneOverride',{'timezoneId':zone})
        query = '?zone=' + zone
        client.call('Page.navigate',{'url':origin+'/tests/weather-service-contract.html'+query})
        wait_for(client, f"location.search === {json.dumps(query)} && !!window.serviceContractResult")
        result=client.evaluate('serviceContractResult')
        assert result['ok'], result
        assert client.evaluate('previewErrors.length===0')
        print('SERVICE_CONTRACT',zone,result['results'],flush=True)
        weather_fixture=client.evaluate('weatherContractFixture')
        client.call('Page.navigate',{'url':origin+'/tests/environment-context-contract.html'+query})
        wait_for(client,"location.pathname==='/tests/environment-context-contract.html' && !!window.environmentContractResult")
        environment=client.evaluate('environmentContractResult')
        assert environment['ok'],environment
        assert client.evaluate('previewErrors.length===0')
        if environment_fingerprints is not None:
            assert environment['fingerprints']==environment_fingerprints, 'Solar paths differ by browser timezone: '+zone
        environment_fingerprints=environment['fingerprints']
        print('ENVIRONMENT_CONTEXT',zone,environment['results'],flush=True)
    client.call('Emulation.setTimezoneOverride',{'timezoneId':'Europe/Lisbon'})
    if args.service_only:
        raise SystemExit(0)
    client.call('Page.navigate',{'url':origin+'/tests/weather-requests-contract.html'})
    wait_for(client,"location.pathname==='/tests/weather-requests-contract.html' && !!window.requestContractResult")
    result=client.evaluate('requestContractResult')
    assert result['ok'],result
    assert client.evaluate('previewErrors.length===0')
    print('WEATHER_REQUESTS',result['results'],flush=True)
    if args.requests_only:
        raise SystemExit(0)

    # Run actual app/controller/data-manager/weather service with provider fixtures.
    # The marine request is mocked too; no network weather is used in this smoke test.
    marine_fixture={'current':{'sea_surface_temperature':17,'wave_height':1.2,'wave_direction':300,'wave_period':10},
                    'hourly':{'time':weather_fixture['hourly']['time'],'sea_level_height_msl':[.1,.2]},'daily':{}}
    bootstrap='''
        window.serviceProbe={weatherRequests:0,marineRequests:0,
            deferMarine:location.search.includes('hold-marine'),pendingMarine:[],deferWeather:false,pendingWeather:[],
            weatherFailure:false,marineFailure:false,missingFields:false,now:Date.parse('2026-11-08T12:08:00Z')};
        Date.now=()=>serviceProbe.now;
        localStorage.setItem('praiasDePortugalSelectedBeach','praia-de-santa-rita-norte');
        localStorage.removeItem('praiasDePortugalSettings');
        localStorage.removeItem('praiasDePortugalFavorites');
        if(location.search.includes('alternate-startup')) localStorage.setItem('praiasDePortugalSettings',JSON.stringify({startupBeach:'praia-de-santa-rita-sul'}));
        const originalFetch=window.fetch.bind(window);
        window.fetch=async(input,options)=>{
            const url=new URL(input instanceof Request ? input.url : input,document.baseURI);
            if(url.origin==='https://api.open-meteo.com') {
                serviceProbe.weatherRequests++;
                const payload=WEATHER_FIXTURE;
                if(serviceProbe.followClock) payload.current.time=new Date(serviceProbe.now).toISOString().slice(0,16);
                if(serviceProbe.missingFields) {
                    payload.current.temperature_2m=null;payload.current.uv_index=null;
                    payload.daily.uv_index_max=[null];payload.daily.moon_phase=[null];
                }
                const response={ok:!serviceProbe.weatherFailure,status:serviceProbe.weatherFailure?503:200,json:async()=>payload};
                if(serviceProbe.deferWeather) return new Promise(resolve=>serviceProbe.pendingWeather.push(()=>resolve(response)));
                return response;
            }
            if(url.origin==='https://marine-api.open-meteo.com') {
                serviceProbe.marineRequests++;
                const response={ok:!serviceProbe.marineFailure,status:serviceProbe.marineFailure?503:200,json:async()=>(MARINE_FIXTURE)};
                if(serviceProbe.deferMarine) return new Promise(resolve=>serviceProbe.pendingMarine.push(
                    ()=>resolve(response)));
                return response;
            }
            if(url.origin!==new URL(document.baseURI).origin) throw new Error('External request forbidden in service smoke test');
            return originalFetch(input,options);
        };
    '''.replace('WEATHER_FIXTURE',json.dumps(weather_fixture)).replace('MARINE_FIXTURE',json.dumps(marine_fixture))
    if args.live_only:
        check_live_preview(client, wait_for, origin, bootstrap, args)
        raise SystemExit(0)
    probe=client.call('Page.addScriptToEvaluateOnNewDocument',{'source':bootstrap})['identifier']
    client.call('Emulation.setDeviceMetricsOverride',{'width':1280,'height':900,'deviceScaleFactor':1,'mobile':False})
    client.call('Page.navigate',{'url':origin+'/index.html?service-probe'})
    wait_for(client,"typeof currentDashboardData!=='undefined' && !!currentDashboardData && !currentDashboardData.weatherPending && !currentDashboardData.marinePending")
    smoke=client.evaluate('''(() => ({
        oneWeatherRequest:serviceProbe.weatherRequests===1,
        sharedData:currentDashboardData.weather===getDatasetData('weather'),
        beachMetadata:currentDashboardData.weather.requestedBeachId===appState.selectedBeachId,
        weatherValues:currentDashboardData.weather.relativeHumidity===70 && currentDashboardData.weather.uvIndex===3 && currentDashboardData.weather.windSpeed===15,
        temperature:document.getElementById('dashboardAirTemp').textContent==='18°C',
        noSky:!document.querySelector('.preview-sky') && document.body.classList.contains('background-sunny'),
        noErrors:previewErrors.length===0
    }))()''')
    assert all(smoke.values()),smoke
    clock_requests=client.evaluate('[serviceProbe.weatherRequests,serviceProbe.marineRequests]')
    model_before=client.evaluate('JSON.stringify(currentDashboardData.weather)')
    solar_fingerprints=None
    for zone in ['Europe/Lisbon','America/Los_Angeles','Asia/Tokyo']:
        client.call('Emulation.setTimezoneOverride',{'timezoneId':zone})
        solar=client.evaluate('''(() => {
            const previous=serviceProbe.now, result=[];
            for(const instant of ['2026-03-08T02:30:00Z','2026-07-08T23:30:00Z','2026-10-25T00:30:00Z','2026-10-25T01:30:00Z']){
                serviceProbe.now=Date.parse(instant);updateCelestialGraphicOnly();
                const state=renderConditionsCelestial(currentDashboardData);
                result.push({instant,sunrise:document.getElementById('dashboardSunrise').textContent,
                    sunset:document.getElementById('dashboardSunset').textContent,
                    altitude:state.sun.position.altitude,svg:document.getElementById('celestialGraphic').innerHTML});
            }
            serviceProbe.now=previous;updateCelestialGraphicOnly();return result;
        })()''')
        if solar_fingerprints is not None:
            assert solar==solar_fingerprints, 'Actual Conditions graphic differs by browser timezone: '+zone
        solar_fingerprints=solar
    client.call('Emulation.setTimezoneOverride',{'timezoneId':'Europe/Lisbon'})
    assert client.evaluate('[serviceProbe.weatherRequests,serviceProbe.marineRequests]')==clock_requests
    assert client.evaluate('JSON.stringify(currentDashboardData.weather)')==model_before
    # Development civil-time simulation still steps through midnight without acquisition.
    client.evaluate("history.replaceState(null,'','?dev');renderConditionsCelestial(currentDashboardData);setCelestialSimulatorTime(parseCelestialTime('2026-07-08T23:59'),false);stepCelestialSimulator(1)")
    assert client.evaluate("formatSimulatorDateTime(celestialSimulatorTime)==='2026-07-09 0000'")
    assert client.evaluate('[serviceProbe.weatherRequests,serviceProbe.marineRequests]')==clock_requests
    client.evaluate("history.replaceState(null,'','?service-probe');stopCelestialSimulatorRun();delete window.celestialSimulatorTime;document.getElementById('celestialSimulator').remove();updateCelestialGraphicOnly()")
    assert client.evaluate('previewErrors.length===0')
    print('PASS: actual Conditions clocks and SVG paths identical across three zones; civil simulator midnight and solar tick make no requests',flush=True)
    assert client.evaluate("document.getElementById('dashboardTempMin').textContent==='14°' && document.getElementById('dashboardTempMax').textContent==='21°'")
    position=client.evaluate("document.getElementById('dashboardTemperatureRange').style.getPropertyValue('--temperature-position')")
    client.evaluate("temperatureUnitSelect.value='fahrenheit'; temperatureUnitSelect.dispatchEvent(new Event('change'))")
    wait_for(client,"currentDashboardData.weather && getDataStatus('weather').refreshing===false")
    client.evaluate("showDashboard()")
    assert client.evaluate("document.getElementById('dashboardAirTemp').textContent==='64°F' && previewErrors.length===0")
    assert client.evaluate("document.getElementById('dashboardTempMin').textContent==='57°' && document.getElementById('dashboardTempMax').textContent==='70°'")
    assert client.evaluate("document.getElementById('dashboardTemperatureRange').style.getPropertyValue('--temperature-position')") == position
    client.evaluate("temperatureUnitSelect.value='celsius'; temperatureUnitSelect.dispatchEvent(new Event('change'))")
    wait_for(client,"getDataStatus('weather').refreshing===false")
    client.evaluate("showDashboard()")
    assert client.evaluate("document.getElementById('dashboardAirTemp').textContent==='18°C' && document.getElementById('dashboardTempMin').textContent==='14°' && document.getElementById('dashboardTempMax').textContent==='21°'")
    assert client.evaluate("serviceProbe.weatherRequests===1"), 'Fresh weather must be reused during unit changes'
    assert client.evaluate("serviceProbe.marineRequests===1"), 'Unit changes must not fetch marine data'
    client.evaluate("serviceProbe.deferMarine=true; saveSelectedBeach('praia-de-santa-rita-sul'); window.oldDisplay=displayBeach('praia-de-santa-rita-sul'); void 0")
    wait_for(client,"serviceProbe.pendingMarine.length===1")
    client.evaluate("saveSelectedBeach('praia-de-porto-novo'); window.newDisplay=displayBeach('praia-de-porto-novo'); void 0")
    wait_for(client,"serviceProbe.pendingMarine.length===2")
    client.evaluate("serviceProbe.pendingMarine[1](); newDisplay")
    assert client.evaluate("currentDashboardData.beach.id==='praia-de-porto-novo'")
    client.evaluate("serviceProbe.pendingMarine[0](); oldDisplay")
    assert client.evaluate("currentDashboardData.beach.id==='praia-de-porto-novo' && currentDashboardData.weather.requestedBeachId==='praia-de-porto-novo' && getDatasetData('weather').requestedBeachId==='praia-de-porto-novo' && previewErrors.length===0")
    print('PASS: fresh cache reuse and late marine result cannot overwrite newer beach',flush=True)
    # Current weather must be visible while marine is still pending.
    assert client.evaluate("!currentDashboardData.weatherPending && currentDashboardData.weather.airTemperature===18")
    client.evaluate("serviceProbe.deferMarine=false; serviceProbe.weatherFailure=true; clearWeatherDataset(); saveSelectedBeach('praia-de-santa-rita-norte'); window.caseWork=displayBeach('praia-de-santa-rita-norte'); void 0")
    client.evaluate("caseWork")
    assert client.evaluate("currentDashboardData.weather===null && currentDashboardData.marine.sea.temperature===17 && document.getElementById('dashboardAirTemp').textContent==='--' && document.getElementById('dashboardSeaTemp').textContent==='17.0°C'")
    assert client.evaluate("document.getElementById('dashboardWeatherCondition').textContent===translate('weatherUnavailable') && document.getElementById('celestialGraphic').querySelector('svg') && !document.getElementById('dashboardMoonPhase').querySelector('img') && document.getElementById('dashboardTempMarker').hidden && document.getElementById('dashboardUVCurrentMarker').hidden")
    if args.screenshot:
        shot=pathlib.Path(args.screenshot);capture=client.call('Page.captureScreenshot',{'format':'png'})
        shot.with_name(shot.stem+'-main-weather-unavailable.png').write_bytes(base64.b64decode(capture['data']))
    client.evaluate("serviceProbe.weatherFailure=false; serviceProbe.marineFailure=true; clearWeatherDataset(); saveSelectedBeach('praia-de-santa-rita-sul'); window.caseWork=displayBeach('praia-de-santa-rita-sul'); void 0")
    client.evaluate("caseWork")
    assert client.evaluate("currentDashboardData.weather.airTemperature===18 && currentDashboardData.marine===null && currentDashboardData.tide===null && document.getElementById('dashboardSeaTemp').textContent==='--' && document.getElementById('dashboardSurf').textContent==='--' && document.getElementById('dashboardMarineStatus').textContent===translate('marineUnavailable')")
    if args.screenshot:
        shot=pathlib.Path(args.screenshot);capture=client.call('Page.captureScreenshot',{'format':'png'})
        shot.with_name(shot.stem+'-main-marine-unavailable.png').write_bytes(base64.b64decode(capture['data']))
    client.evaluate("serviceProbe.marineFailure=false; serviceProbe.deferWeather=true; clearWeatherDataset(); saveSelectedBeach('praia-de-porto-novo'); window.caseWork=displayBeach('praia-de-porto-novo'); void 0")
    wait_for(client,"serviceProbe.pendingWeather.length===1 && !currentDashboardData.marinePending")
    assert client.evaluate("currentDashboardData.weatherPending && currentDashboardData.marine.sea.temperature===17 && document.getElementById('dashboardAirTemp').textContent==='--' && document.getElementById('dashboardWeatherCondition').textContent===translate('weatherLoading')")
    client.evaluate("serviceProbe.pendingWeather[0](); caseWork")
    assert client.evaluate("currentDashboardData.weather.airTemperature===18 && !currentDashboardData.weatherPending")
    # Same location, same cached weather token: display generation must still win.
    client.evaluate("serviceProbe.deferWeather=false;serviceProbe.deferMarine=true;serviceProbe.pendingMarine=[];window.firstView=displayBeach(appState.selectedBeachId);void 0")
    wait_for(client,"serviceProbe.pendingMarine.length===1")
    client.evaluate("window.secondView=displayBeach(appState.selectedBeachId);window.latestView=currentDashboardData;void 0")
    wait_for(client,"serviceProbe.pendingMarine.length===2")
    client.evaluate("serviceProbe.pendingMarine[1]();secondView")
    client.evaluate("serviceProbe.pendingMarine[0]();firstView")
    assert client.evaluate("currentDashboardData===latestView && !currentDashboardData.marinePending")
    client.evaluate("serviceProbe.deferMarine=false;serviceProbe.missingFields=true;clearWeatherDataset();window.caseWork=displayBeach(appState.selectedBeachId);void 0")
    client.evaluate("caseWork")
    assert client.evaluate("currentDashboardData.weather.airTemperature===null && currentDashboardData.weather.windSpeed===15 && document.getElementById('dashboardAirTemp').textContent==='--' && document.getElementById('dashboardTempMarker').hidden && document.getElementById('dashboardUVCurrentMarker').hidden && document.getElementById('dashboardUVMaxMarker').hidden && document.getElementById('dashboardUVMax').textContent==='--' && document.getElementById('dashboardMoonPhase').textContent==='--'")
    client.evaluate("serviceProbe.missingFields=false;clearWeatherDataset();window.caseWork=displayBeach(appState.selectedBeachId);void 0")
    client.evaluate("caseWork")
    before=client.evaluate("[serviceProbe.weatherRequests,serviceProbe.marineRequests]")
    client.evaluate("temperatureUnitSelect.value='fahrenheit';windSpeedUnitSelect.value='knots';waveHeightUnitSelect.value='feet';languageSelect.value='pt';textSizeSlider.value='3';handleSettingsChange();showDashboard()")
    assert client.evaluate("document.getElementById('dashboardWeatherCondition').textContent===translate('weatherPartlyCloudy') && document.getElementById('dashboardAirTemp').textContent==='64°F' && document.getElementById('dashboardWind').textContent.includes('kn')")
    assert client.evaluate("[serviceProbe.weatherRequests,serviceProbe.marineRequests]")==before
    client.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':False})
    assert client.evaluate("document.getElementById('dashboardWeatherCondition').scrollWidth<=document.getElementById('dashboardWeatherCondition').clientWidth"), 'Translated unavailable condition text overflows its column'
    client.evaluate("serviceProbe.now+=60*60000;showDashboard()")
    assert client.evaluate("currentDashboardData.weather===null && currentDashboardData.marine && document.getElementById('dashboardAirTemp').textContent==='--' && document.getElementById('dashboardWeatherCondition').textContent===translate('weatherExpired')")
    assert client.evaluate("[serviceProbe.weatherRequests,serviceProbe.marineRequests]")==before
    assert client.evaluate("document.getElementById('dashboardWeatherCondition').scrollWidth<=document.getElementById('dashboardWeatherCondition').clientWidth"), 'Translated expired condition text overflows its column'
    assert client.evaluate("document.getElementById('dashboardWeatherCondition').getBoundingClientRect().bottom <= document.getElementById('lowerWeatherCelestialPanel').getBoundingClientRect().top"), 'Expired message overlaps celestial panel'
    if args.screenshot:
        shot=pathlib.Path(args.screenshot);capture=client.call('Page.captureScreenshot',{'format':'png'})
        shot.with_name(shot.stem+'-main-expired-pt.png').write_bytes(base64.b64decode(capture['data']))
    # Exercise the actual app lifecycle wiring with deterministic manager timers.
    marine_before=client.evaluate('serviceProbe.marineRequests')
    client.evaluate('''(() => {
        shutdownDataManager();
        serviceProbe.followClock=true;
        window.weatherTimers=new Map();window.weatherTimerId=0;
        window.advanceWeatherClock=ms=>{
            serviceProbe.now+=ms;
            for(const [id,t] of [...weatherTimers]) if(t.at<=serviceProbe.now){weatherTimers.delete(id);t.fn();}
        };
        initializeDataManager({now:()=>serviceProbe.now,
            setTimer:(fn,ms)=>{const id=++weatherTimerId;weatherTimers.set(id,{at:serviceProbe.now+ms,fn});return id;},
            clearTimer:id=>weatherTimers.delete(id)});
        window.lifecycleWork=refreshWeatherDataset(currentDashboardData.beach);
    })()''')
    client.evaluate('lifecycleWork')
    assert client.evaluate("currentDashboardData.weather && weatherTimers.size===1")
    count=client.evaluate('serviceProbe.weatherRequests')
    client.evaluate("showSettings();serviceProbe.weatherFailure=true;advanceWeatherClock(15*60000)")
    wait_for(client,"!getDataStatus('weather').refreshing")
    assert client.evaluate("serviceProbe.weatherRequests")==count+1
    client.evaluate("showDashboard()")
    assert client.evaluate("serviceProbe.weatherRequests")==count+1
    assert client.evaluate("currentDashboardData.weatherStatus.freshness==='stale' && currentDashboardData.weather && document.getElementById('dashboardWeatherCondition').textContent.includes(translate('weatherStale'))")
    client.evaluate("window.lifecycleHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>lifecycleHidden});document.dispatchEvent(new Event('visibilitychange'));advanceWeatherClock(2*60*60000)")
    assert client.evaluate("weatherTimers.size===0")
    assert client.evaluate("serviceProbe.weatherRequests")==count+1
    # Do not collect missed ticks: resume attempts exactly once; hold its transport.
    client.evaluate("serviceProbe.weatherFailure=false;serviceProbe.deferWeather=true;serviceProbe.pendingWeather=[];lifecycleHidden=false;document.dispatchEvent(new Event('visibilitychange'))")
    wait_for(client,"serviceProbe.pendingWeather.length===1")
    assert client.evaluate("currentDashboardData.weather===null && document.getElementById('dashboardAirTemp').textContent==='--'")
    for _ in range(5):
        client.evaluate("window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
    assert client.evaluate("serviceProbe.weatherRequests")==count+2
    assert client.evaluate("weatherTimers.size===1")  # Only the request deadline remains.
    client.evaluate("serviceProbe.pendingWeather[0]()")
    wait_for(client,"!getDataStatus('weather').refreshing && !!currentDashboardData.weather")
    assert client.evaluate('weatherTimers.size===1')
    assert client.evaluate('serviceProbe.marineRequests')==marine_before
    client.evaluate("window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));delete document.hidden")
    assert client.evaluate("weatherTimers.size===0 && !dataManagerState.initialized")
    assert client.evaluate('previewErrors.length===0')
    print('PASS: real app lifecycle, stale notification, hidden pause, one resume fetch, persisted restore and shutdown; no marine requests',flush=True)
    print('PASS: independent weather/marine failure and delay, same-beach display generations, missing values, translated no-fetch settings and expiry rerender',flush=True)
    print('MAIN_APP_SERVICE',smoke,'Fahrenheit rerender passed',flush=True)
    client.call('Page.navigate',{'url':origin+'/index.html?hold-marine&alternate-startup'})
    wait_for(client,"typeof currentDashboardData!=='undefined' && !!currentDashboardData?.weather && currentDashboardData.marinePending")
    assert client.evaluate("appState.selectedBeachId==='praia-de-santa-rita-sul' && currentDashboardData.beach.id===appState.selectedBeachId && document.getElementById('dashboardAirTemp').textContent==='18°C'")
    client.evaluate("document.getElementById('settingsNavButton').click()")
    assert client.evaluate("appState.currentPage==='settings' && !settingsPage.hidden")
    client.evaluate("document.getElementById('dashboardNavButton').click();serviceProbe.pendingMarine[0]()")
    wait_for(client,"!currentDashboardData.marinePending")
    assert client.evaluate("previewErrors.length===0")
    print('PASS: saved startup beach identity and usable navigation before marine finishes',flush=True)
    client.call('Page.removeScriptToEvaluateOnNewDocument',{'identifier':probe})
    client.evaluate('localStorage.clear()')

    # Same-origin sentinel preferences must survive every preview action and reset.
    client.call('Page.navigate', {'url': origin + '/index.html'})
    wait_for(client, "typeof appState !== 'undefined' && regionSelect.options.length > 1")
    assert client.evaluate("appState.currentPage === 'beaches' && !beachesPage.hidden")
    baseline_widths = {}
    for width, height in [(1280, 900), (390, 844)]:
        client.call('Emulation.setDeviceMetricsOverride', {
            'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False})
        for size in ['1', '3']:
            client.evaluate(f"textSizeSlider.value = '{size}'; textSizeSlider.dispatchEvent(new Event('change'))")
            for page in ['dashboard', 'beaches', 'settings']:
                client.evaluate(f"document.getElementById('{page}NavButton').click()")
                baseline_widths[(width, size, page)] = client.evaluate('document.documentElement.scrollWidth')
    client.call('Emulation.setDeviceMetricsOverride', {
        'width': 1280, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    client.evaluate('''(() => {
        localStorage.setItem('praiasDePortugalSettings', JSON.stringify({language:'pt',temperatureUnit:'fahrenheit'}));
        localStorage.setItem('praiasDePortugalSelectedBeach', 'praia-de-porto-novo');
        localStorage.setItem('praiasDePortugalFavorites', JSON.stringify(['praia-de-porto-novo']));
        window.savedStorage = JSON.stringify(Object.entries(localStorage).sort());
        sessionStorage.setItem('previewSentinel', savedStorage);
    })()''')
    client.call('Page.navigate', {'url': origin + '/labs/sky-preview.html'})
    ready = "document.getElementById('fixtureSelect') && !document.getElementById('fixtureSelect').disabled"
    wait_for(client, ready)
    client.evaluate("window.lab = document.getElementById('previewFrame').contentWindow; void 0")
    results = client.evaluate('''(() => {
        const s = lab.skyPreview.snapshot();
        return {
            actualLayout: lab.document.querySelectorAll('#mainNavigation button').length === 3,
            defaultBeach: s.beachId === 'praia-de-santa-rita-norte',
            independentSettings: s.settings.language === 'en' && s.settings.temperatureUnit === 'celsius',
            cloudBands: s.weather.cloudCoverLow === 20 && s.weather.cloudCoverMid === 60 && s.weather.cloudCoverHigh === 95,
            initialDashboard: s.page === 'dashboard' && !lab.document.getElementById('dashboardPage').hidden,
            originalThemePreserved: lab.document.body.classList.contains('background-sunny'),
            layoutBase: lab.document.baseURI.endsWith('/'),
            noExternalCalls: lab.skyPreview.blockedRequests.length === 0,
            noErrors: previewErrors.length === 0 && lab.previewErrors.length === 0
        };
    })()''')
    assert all(results.values()), results
    assert client.evaluate("lab.document.querySelector('.preview-sky-inputs summary').textContent.includes('Low 20% · Mid 60% · High 95%') && lab.document.querySelector('[data-input=condition]').textContent.includes('WMO 2') && lab.document.querySelector('[data-input=freshness]').textContent.includes('Synthetic fixture')")
    print('STARTUP', results, flush=True)

    motion = client.evaluate('''(async () => {
        const sky = lab.document.querySelector('.preview-sky');
        const result = {};
        result.immediateStartup = !sky.getAnimations({subtree:true}).some(a => a instanceof lab.CSSTransition) &&
            [...sky.querySelectorAll('.sky-cloud-patch')].every(p => Math.abs(Number(lab.getComputedStyle(p).opacity) - Number(p.style.opacity)) < .001);
        const layers = [...sky.querySelectorAll('.preview-sky-drift')];
        const animations = layers.map(node => node.getAnimations()[0]);
        const deltas = layers.map((node, i) => {
            const animation = animations[i];
            const previous = animation.currentTime;
            const x = () => new lab.DOMMatrix(lab.getComputedStyle(node).transform).m41;
            animation.pause(); animation.currentTime = 0; const start = x();
            animation.currentTime = 10000; const delta = x() - start;
            animation.currentTime = previous; animation.play();
            return delta;
        });
        result.independentMotion = deltas[0] > 0 && deltas[1] > deltas[0] && deltas[2] < 0;
        result.timings = animations.every((a, i) => a.effect.getTiming().duration === [320000,240000,160000][i] &&
            a.effect.getTiming().delay === [-117000,-83000,-41000][i] && a.effect.getTiming().direction === 'alternate');
        const first = sky.querySelector('[data-tier="low"] .sky-cloud-patch');
        await lab.skyPreview.setFixture('low20');
        sky.getAnimations({subtree:true}).filter(a => a instanceof lab.CSSTransition).forEach(a => a.finish());
        void sky.offsetWidth;
        await lab.skyPreview.setFixture('low95');
        const transitions = first.getAnimations().filter(a => a instanceof lab.CSSTransition);
        result.gentleUpdates = transitions.length === 2 && transitions.every(a => a.effect.getTiming().duration === 5000);
        transitions.forEach(a => { a.pause(); a.currentTime = 0; });
        const start = Number(lab.getComputedStyle(first).opacity);
        transitions.forEach(a => a.currentTime = 2500);
        const middle = Number(lab.getComputedStyle(first).opacity);
        transitions.forEach(a => a.currentTime = 5000);
        const end = Number(lab.getComputedStyle(first).opacity);
        result.interpolates = start < middle && middle < end && end === 1;
        result.stableNodesAndDrift = first === sky.querySelector('[data-tier="low"] .sky-cloud-patch') &&
            layers.every((node, i) => node.getAnimations()[0] === animations[i]);
        await lab.skyPreview.setFixture('mixed');
        sky.getAnimations({subtree:true}).filter(a => a instanceof lab.CSSTransition).forEach(a => a.finish());
        return result;
    })()''')
    assert all(motion.values()), motion
    print('MOTION', motion, flush=True)
    semantics = client.evaluate('''(async () => {
        const api = lab.skyWeatherState, f = lab.skyPreviewFixtures;
        const beach = lab.skyPreview.snapshot().weatherState.beach;
        let clock = Date.parse('2026-11-07T12:00:00Z');
        const snap = () => f.snapshot('rain', beach, clock);
        const result = {};
        const base = snap();
        result.boundaries = api.evaluate(base, beach, clock + 15*60000 - 1).status === 'fresh' &&
            api.evaluate(base, beach, clock + 15*60000).status === 'stale' &&
            api.evaluate(base, beach, clock + 60*60000 - 1).status === 'stale' &&
            api.evaluate(base, beach, clock + 60*60000).status === 'expired';
        result.validation = api.evaluate({...base, conditionTimeMs:null},beach,clock).status === 'unavailable' &&
            api.evaluate({...base,conditionTimeMs:clock+3600000},beach,clock).weather === null &&
            api.evaluate({...base,latitude:0},beach,clock).weather === null &&
            api.evaluate({...base,conditionTimeMs:clock-65*60000},beach,clock).status === 'expired' &&
            api.evaluate({...base,fetchedAtMs:clock-65*60000},beach,clock).status === 'expired';
        result.mapping = [[56,'rain','light'],[57,'rain','heavy'],[66,'rain','light'],[67,'rain','heavy'],
            [77,'snow','light'],[85,'snow','light'],[86,'snow','heavy'],[97,'rain','heavy'],[99,'rain','heavy']]
            .every(([code,effect,intensity]) => api.condition(code).precipitation === effect && api.condition(code).intensity === intensity) &&
            api.condition(999).precipitation === null && api.condition(null).precipitation === null;
        const timers = new Map(); let nextId = 0, writes = 0;
        const control = api.createController({now:()=>clock,onState:()=>writes++,
            setTimer:(fn,delay)=>{const id=++nextId;timers.set(id,{fn,delay});return id;},
            clearTimer:id=>timers.delete(id)});
        control.commit(beach,base);
        let deliverOld, oldSignal;
        const old = control.request(beach,({signal})=>{oldSignal=signal;return new Promise(resolve=>deliverOld=resolve);});
        const newerBeach = {...beach,id:'new-beach',latitude:40};
        const newer = {...base,beachId:newerBeach.id,latitude:40};
        control.commit(newerBeach,newer);
        const beforeLate = writes;
        deliverOld(base); await Promise.resolve(); await Promise.resolve();
        result.races = await old === 'superseded' && oldSignal.aborted && writes === beforeLate && control.state.beach.id === 'new-beach';
        const invalid = await control.request(newerBeach,()=>Promise.resolve(base));
        result.wrongLocationIgnored = invalid === 'invalid' && control.state.weather === newer.weather;
        const older = await control.request(newerBeach,()=>Promise.resolve({...newer,conditionTimeMs:newer.conditionTimeMs-1000}));
        result.olderModelIgnored = older === 'invalid' && control.state.weather === newer.weather;
        let timeoutSignal;
        const timeout = control.request(newerBeach,({signal})=>{timeoutSignal=signal;return new Promise(()=>{});});
        const entry = [...timers.values()][0];
        result.timeoutPolicy = entry.delay === 10000;
        clock += 10000; entry.fn();
        result.timeout = await timeout === 'timeout' && timeoutSignal.aborted && timers.size === 0 && control.state.requestResult === 'timeout';
        let deliverAfterDestroy;
        const destroyed = control.request(newerBeach,()=>new Promise(resolve=>deliverAfterDestroy=resolve));
        control.destroy(); const afterDestroy = writes;
        deliverAfterDestroy(newer); await Promise.resolve(); await Promise.resolve();
        result.cleanup = await destroyed === 'superseded' && timers.size === 0 && writes === afterDestroy;
        return result;
    })()''')
    assert all(semantics.values()), semantics
    print('WEATHER_STATE', semantics, flush=True)

    # Exercise real app controls, not a second implementation of navigation or selection.
    client.evaluate("lab.document.getElementById('beachesNavButton').click()")
    assert client.evaluate("!lab.document.getElementById('beachesPage').hidden")
    client.evaluate('''(() => {
        const select = lab.document.getElementById('beachSelect');
        select.value = 'praia-de-santa-rita-sul';
        select.dispatchEvent(new lab.Event('change'));
    })()''')
    wait_for(client, "lab.skyPreview.snapshot().weather.latitude === 39.17118")
    assert client.evaluate("lab.document.querySelector('.preview-sky').dataset.beachId === 'praia-de-santa-rita-sul'")
    client.evaluate("lab.document.getElementById('dashboardNavButton').click()")
    assert client.evaluate("lab.document.getElementById('dashboardBeachName').textContent.includes('Santa Rita Sul')")
    client.evaluate("lab.document.getElementById('settingsNavButton').click()")
    client.evaluate('''(() => {
        const select = lab.document.getElementById('temperatureUnitSelect');
        select.value = 'fahrenheit';
        select.dispatchEvent(new lab.Event('change'));
    })()''')
    wait_for(client, "lab.skyPreview.snapshot().settings.temperatureUnit === 'fahrenheit'")
    fixture_keys = client.evaluate('Object.keys(skyPreviewFixtures.cases)')
    for fixture in fixture_keys:
        client.evaluate(f'''(() => {{
            const select = document.getElementById('fixtureSelect');
            select.value = {json.dumps(fixture)};
            select.dispatchEvent(new Event('change'));
        }})()''')
        wait_for(client, ready)
        assert client.evaluate(f"lab.skyPreview.fixtureKey === {json.dumps(fixture)}")
        assert client.evaluate("lab.skyPreview.snapshot().page === 'settings'")
        result = client.evaluate('''(() => {
            const weather = lab.skyPreview.snapshot().weather;
            const sky = lab.document.querySelector('.preview-sky');
            const result = {};
            for (const tier of ['low', 'mid', 'high']) {
                const group = sky.querySelector(`[data-tier="${tier}"] .preview-sky-tier`);
                const cover = weather[`cloudCover${tier[0].toUpperCase() + tier.slice(1)}`];
                const visible = [...group.children].reduce((sum, node) => sum + Number(node.firstElementChild.style.opacity), 0);
                const expected = Number.isFinite(cover) ? Math.max(0, Math.min(100, cover)) * 24 / 100 : 0;
                result[tier] = group.children.length === 24 && Math.abs(visible - expected) < .001;
                const reported = Number.isFinite(cover) ? `${Math.round(Math.max(0,Math.min(100,cover)))}%` : "unknown";
                result[tier+"Readout"] = lab.document.querySelector('.preview-sky-inputs summary').textContent.includes(`${tier[0].toUpperCase()+tier.slice(1)} ${reported}`);
            }
            const stars = sky.querySelector('.preview-sky-stars');
            const starsHidden = !(Number(sky.dataset.solarElevation) < -4 && weather.cloudCover !== null && weather.cloudCover < 85);
            result.stars = stars.hasAttribute('hidden') === starsHidden && (lab.getComputedStyle(stars).display === 'none') === starsHidden;
            const condition = lab.skyWeatherState.condition(weather.weatherCode);
            const rain = sky.querySelector('.preview-sky-rain'), snow = sky.querySelector('.preview-sky-snow');
            result.precipitation = rain.hidden === (condition.precipitation !== 'rain') && snow.hidden === (condition.precipitation !== 'snow') && (rain.hidden || snow.hidden);
            return result;
        })()''')
        assert all(result.values()), (fixture, result)
        client.evaluate("lab.document.getElementById('dashboardNavButton').click()")
        assert client.evaluate("lab.skyPreview.snapshot().weather.airTemperature === null ? lab.document.getElementById('dashboardAirTemp').textContent === '--' : lab.document.getElementById('dashboardAirTemp').textContent.includes('°F')")
        client.evaluate("lab.document.getElementById('settingsNavButton').click()")
    print(f'PASS: navigation, selected-beach coordinates, units, independent cloud tiers and all {len(fixture_keys)} fixtures', flush=True)

    client.evaluate("document.getElementById('fixtureSelect').value='rain'; document.getElementById('fixtureSelect').dispatchEvent(new Event('change'))")
    wait_for(client, ready)
    for scenario, expected in [('stale','stale'),('expired','expired'),('offline','unavailable'),('invalidTime','unavailable'),
                               ('futureTime','unavailable'),('oldModel','expired'),('wrongLocation','unavailable'),
                               ('staleSuccess','stale'),('staleFailure','stale'),('delayed','unavailable'),('lateBeach','fresh'),('fresh','fresh')]:
        client.evaluate(f"document.getElementById('scenarioSelect').value={json.dumps(scenario)}; document.getElementById('scenarioSelect').dispatchEvent(new Event('change'))")
        wait_for(client, ready)
        assert client.evaluate(f"lab.skyPreview.snapshot().weatherState.status === {json.dumps(expected)}"), scenario
        if expected in ['expired','unavailable']:
            assert client.evaluate("lab.document.querySelector('.preview-sky-rain').hidden && lab.document.querySelector('.preview-sky-snow').hidden && [...lab.document.querySelectorAll('.sky-cloud-patch')].every(p=>lab.getComputedStyle(p).opacity==='0')"), scenario
            client.evaluate("lab.document.getElementById('dashboardNavButton').click()")
            assert client.evaluate("lab.document.getElementById('dashboardAirTemp').textContent==='--'")
            assert client.evaluate("lab.document.getElementById('dashboardTempMarker').hidden")
            client.evaluate("lab.document.getElementById('settingsNavButton').click()")
        if scenario in ['staleSuccess','delayed']:
            wait_for(client, "lab.skyPreview.snapshot().weatherState.status === 'fresh'")
            if scenario == 'delayed':
                assert client.evaluate("!lab.document.querySelector('.preview-sky').getAnimations({subtree:true}).some(a=>a instanceof lab.CSSTransition)")
        if scenario == 'staleFailure':
            wait_for(client, "lab.skyPreview.snapshot().weatherState.requestResult === 'error'")
            assert client.evaluate("!lab.document.querySelector('.preview-sky-rain').hidden")
    for _ in range(4):
        client.evaluate("document.getElementById('advanceAge').click()")
    assert client.evaluate("lab.skyPreview.snapshot().weatherState.status === 'expired' && lab.document.querySelector('.preview-sky-rain').hidden")
    client.evaluate("document.getElementById('scenarioSelect').value='fresh'; document.getElementById('scenarioSelect').dispatchEvent(new Event('change'))")
    wait_for(client, ready)
    print('PASS: freshness scenarios, delayed success/failure, placeholders, age advance and immediate removal of expired effects', flush=True)

    # Comparison must keep the same app state and service request count.
    assert client.evaluate('''(() => {
        const before = JSON.stringify(lab.skyPreview.snapshot());
        const requests = lab.skyPreview.weatherRequests;
        const toggle = document.getElementById('skyEnabled');
        const sky = lab.document.querySelector('.preview-sky');
        toggle.click();
        const hidden = sky.hidden && lab.document.body.dataset.skyPreview === 'disabled';
        toggle.click();
        return hidden && !sky.hidden && before === JSON.stringify(lab.skyPreview.snapshot()) && requests === lab.skyPreview.weatherRequests;
    })()''')
    assert client.evaluate('''(() => {
        const sky = lab.document.querySelector('.preview-sky');
        return sky.getAttribute('aria-hidden') === 'true' && lab.getComputedStyle(sky).pointerEvents === 'none' &&
            [...sky.querySelectorAll('filter')].every(f => f.getAttribute('y') === '-100%' && f.getAttribute('height') === '300%') &&
            lab.getComputedStyle(lab.document.getElementById('conditionsWidget')).backgroundColor === 'rgba(27, 39, 71, 0.3)' &&
            lab.document.querySelector('.preview-sky-credits a').href === 'https://open-meteo.com/';
    })()''')
    client.call('Emulation.setEmulatedMedia', {'features': [{'name':'prefers-reduced-motion','value':'reduce'}]})
    assert client.evaluate("lab.document.querySelector('.preview-sky').getAnimations({subtree:true}).length === 0")
    client.call('Emulation.setEmulatedMedia', {'features': []})
    assert client.evaluate('''(() => {
        const sky = lab.document.querySelector('.preview-sky');
        const before = JSON.stringify(lab.skyPreview.snapshot());
        const requests = lab.skyPreview.weatherRequests;
        const toggle = document.getElementById('skyMotion');
        toggle.click();
        const paused = [...sky.querySelectorAll('.preview-sky-drift,.preview-sky-rain:not([hidden]),.preview-sky-snow:not([hidden]) .preview-snow-field')].every(node =>
            node.getAnimations().every(a => a.playState === 'paused'));
        const noTransitions = lab.getComputedStyle(sky.querySelector('.sky-cloud-patch')).transitionDuration === '0s';
        toggle.click();
        return paused && noTransitions && sky.dataset.motion === 'on' &&
            JSON.stringify(lab.skyPreview.snapshot()) === before && lab.skyPreview.weatherRequests === requests;
    })()''')
    assert client.evaluate('''(() => {
        const before = JSON.stringify(lab.skyPreview.snapshot());
        const requests = lab.skyPreview.weatherRequests;
        const slider = document.getElementById('panelOpacity');
        const tile = lab.document.getElementById('conditionsWidget');
        for (const [value, expected] of [['0', 'rgba(27, 39, 71, 0)'], ['100', 'rgb(27, 39, 71)'], ['30', 'rgba(27, 39, 71, 0.3)']]) {
            slider.value = value;
            slider.dispatchEvent(new Event('input'));
            if (lab.getComputedStyle(tile).backgroundColor !== expected || lab.getComputedStyle(tile).opacity !== '1') return false;
        }
        document.getElementById('skyEnabled').click();
        const original = lab.getComputedStyle(tile).backgroundColor === 'rgb(27, 39, 71)';
        document.getElementById('skyEnabled').click();
        return original && JSON.stringify(lab.skyPreview.snapshot()) === before && lab.skyPreview.weatherRequests === requests;
    })()''')
    print('PASS: background comparison, panel opacity, pause/resume and reduced motion, filter bounds and attribution', flush=True)
    client.evaluate("lab.skyPreview.setFixture('code75')")
    assert client.evaluate('''(() => {
        const fields = [...lab.document.querySelectorAll('.preview-snow-field')];
        document.getElementById('skyMotion').click();
        const paused = fields.length === 3 && fields.every(field => field.getAnimations().length === 2 && field.getAnimations().every(a=>a.playState === 'paused'));
        document.getElementById('skyMotion').click();
        return paused && fields.every(field=>field.getAnimations().every(a=>a.playState === 'running'));
    })()''')
    client.call('Emulation.setEmulatedMedia', {'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
    assert client.evaluate("lab.document.querySelector('.preview-sky').getAnimations({subtree:true}).length === 0")
    client.call('Emulation.setEmulatedMedia', {'features':[]})
    client.evaluate("lab.skyPreview.setFixture('rain')")
    print('PASS: irregular heavy-snow fields pause/resume and respect reduced motion', flush=True)

    for width, height in [(1280, 900), (390, 844)]:
        client.call('Emulation.setDeviceMetricsOverride', {
            'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False})
        for size in ['1', '3']:
            client.evaluate(f"lab.document.getElementById('textSizeSlider').value = '{size}'; lab.document.getElementById('textSizeSlider').dispatchEvent(new lab.Event('change'))")
            wait_for(client, "!lab.eval('getDataStatus(\"weather\").refreshing')")
            for page in ['dashboard', 'beaches', 'settings']:
                client.evaluate(f"lab.document.getElementById('{page}NavButton').click()")
                assert client.evaluate("document.documentElement.scrollWidth <= innerWidth")
                preview_width = client.evaluate('lab.document.documentElement.scrollWidth')
                assert preview_width <= baseline_widths[(width, size, page)], (width, size, page, preview_width, baseline_widths)
                assert client.evaluate("lab.document.querySelectorAll('.preview-sky').length === 1 && !lab.document.querySelector('.preview-sky').hidden")
                assert client.evaluate("lab.document.querySelector('.preview-sky').getBoundingClientRect().height === lab.innerHeight")
                if args.screenshot and size == '1' and page in ['dashboard', 'settings']:
                    shot = pathlib.Path(args.screenshot)
                    image = client.call('Page.captureScreenshot', {'format': 'png'})
                    shot.with_name(f'{shot.stem}-{width}-{page}.png').write_bytes(base64.b64decode(image['data']))
    print('PASS: desktop/mobile layout and largest text match existing app widths', flush=True)
    print('BASELINE mobile widths:', {size: baseline_widths[(390, size, 'dashboard')] for size in ['1', '3']}, flush=True)

    # Reset remounts the real layout and discards only temporary lab state.
    client.evaluate("document.getElementById('resetPreview').click()")
    wait_for(client, ready)
    client.evaluate("window.lab = document.getElementById('previewFrame').contentWindow; void 0")
    assert client.evaluate("lab.skyPreview.snapshot().settings.temperatureUnit === 'celsius'")
    assert client.evaluate("lab.skyPreview.snapshot().beachId === 'praia-de-santa-rita-norte'")
    assert client.evaluate("JSON.stringify(Object.entries(localStorage).sort()) === sessionStorage.getItem('previewSentinel')")
    assert client.evaluate("lab.skyPreview.blockedRequests.length === 0 && previewErrors.length === 0 && lab.previewErrors.length === 0")
    assert client.evaluate("new lab.Date().getHours() === 12 && lab.Date.now() === new lab.Date().getTime()")
    assert client.evaluate("!lab.document.querySelector('link[rel=manifest]')")
    # A pending simulated response and timeout must both be released on reset.
    for scenario in ['delayed', 'timeout']:
        client.evaluate(f"document.getElementById('scenarioSelect').value={json.dumps(scenario)}; document.getElementById('scenarioSelect').dispatchEvent(new Event('change'))")
        wait_for(client, ready)
        client.evaluate("window.oldPreview = lab.skyPreview; document.getElementById('resetPreview').click()")
        wait_for(client, ready)
        client.evaluate("window.lab = document.getElementById('previewFrame').contentWindow; void 0")
        assert client.evaluate("oldPreview.snapshot().destroyed && oldPreview.snapshot().pendingTimers === 0")
    client.evaluate("document.getElementById('scenarioSelect').value='fresh'; document.getElementById('scenarioSelect').dispatchEvent(new Event('change'))")
    wait_for(client, ready)
    assert client.evaluate("previewErrors.length===0 && lab.previewErrors.length===0")
    print('PASS: repeated reset cancels pending responses and timeout timers', flush=True)
    if args.screenshot:
        image = client.call('Page.captureScreenshot', {'format': 'png'})
        pathlib.Path(args.screenshot).write_bytes(base64.b64decode(image['data']))
        for key in ['snow', 'code75', 'offline']:
            if key != 'offline':
                client.evaluate(f"document.getElementById('fixtureSelect').value={json.dumps(key)}; document.getElementById('fixtureSelect').dispatchEvent(new Event('change'))")
            else:
                client.evaluate("document.getElementById('scenarioSelect').value='offline'; document.getElementById('scenarioSelect').dispatchEvent(new Event('change'))")
            wait_for(client, ready)
            image = client.call('Page.captureScreenshot', {'format': 'png'})
            shot = pathlib.Path(args.screenshot)
            shot.with_name(f'{shot.stem}-{key}.png').write_bytes(base64.b64decode(image['data']))
    print('PASS: reset, fixed clock, no external service calls, no errors, normal app preferences preserved', flush=True)

    if args.review_dir:
        directory = pathlib.Path(args.review_dir)
        directory.mkdir(parents=True, exist_ok=True)
        client.evaluate("lab.skyPreview.setScenario('fresh')")
        client.evaluate("document.getElementById('scenarioSelect').value='fresh'; if(document.getElementById('skyMotion').checked) document.getElementById('skyMotion').click()")
        client.evaluate("lab.document.getElementById('temperatureUnitSelect').value='celsius'; lab.document.getElementById('temperatureUnitSelect').dispatchEvent(new lab.Event('change'))")
        wait_for(client, "!lab.eval('getDataStatus(\"weather\").refreshing')")
        layout, pictures = [], []
        for width, height in [(1280,900),(768,1024),(390,844),(320,740)]:
            client.call('Emulation.setDeviceMetricsOverride', {
                'width':width,'height':height,'deviceScaleFactor':1,'mobile':False})
            for size in ['0','1','2','3']:
                client.evaluate(f"lab.document.getElementById('textSizeSlider').value='{size}'; lab.document.getElementById('textSizeSlider').dispatchEvent(new lab.Event('change'))")
                wait_for(client, "!lab.eval('getDataStatus(\"weather\").refreshing')")
                for page in ['dashboard','beaches','settings']:
                    client.evaluate(f"lab.document.getElementById('{page}NavButton').click()")
                    measurement = client.evaluate('''(() => {
                        const doc = lab.document, sky = doc.querySelector('.preview-sky');
                        lab.scrollTo(0, doc.documentElement.scrollHeight);
                        const fixed = sky.getBoundingClientRect().top === 0;
                        lab.scrollTo(0,0);
                        const active = doc.querySelector('main:not([hidden])');
                        const control = active.querySelector('select,button,input') || doc.getElementById('dashboardNavButton');
                        control.focus();
                        return {viewport:lab.innerWidth, contentWidth:doc.documentElement.scrollWidth,
                            shellWidth:document.documentElement.scrollWidth, shellViewport:innerWidth,
                            fixedOnScroll:fixed, keyboardFocus:doc.activeElement === control,
                            backdropInstances:doc.querySelectorAll('.preview-sky').length,
                            errors:previewErrors.concat(lab.previewErrors)};
                    })()''')
                    measurement.update(width=width,height=height,textSize=size,page=page)
                    assert measurement['fixedOnScroll'] and measurement['keyboardFocus'] and measurement['backdropInstances']==1 and not measurement['errors'], measurement
                    assert measurement['shellWidth'] <= measurement['shellViewport'], measurement
                    layout.append(measurement)
            if width not in [1280,390]:
                continue
            client.evaluate("lab.document.getElementById('textSizeSlider').value='1'; lab.document.getElementById('textSizeSlider').dispatchEvent(new lab.Event('change'))")
            wait_for(client, "!lab.eval('getDataStatus(\"weather\").refreshing')")
            for fixture in ['clear','mixed','overcast','rain','code75','dusk','night']:
                client.evaluate(f"document.getElementById('fixtureSelect').value={json.dumps(fixture)}; lab.skyPreview.setFixture({json.dumps(fixture)})")
                for page in (['dashboard','beaches','settings'] if fixture=='mixed' else ['dashboard']):
                    client.evaluate(f"lab.document.getElementById('{page}NavButton').click()")
                    for opacity in (['0','30','100'] if fixture=='clear' else ['30']):
                        client.evaluate(f"document.getElementById('panelOpacity').value='{opacity}'; document.getElementById('panelOpacity').dispatchEvent(new Event('input'))")
                        client.evaluate("lab.scrollTo(0,0); lab.document.querySelector('.preview-sky').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=0;})")
                        filename = f'{width}-{page}-{fixture}-opacity{opacity}.png'
                        capture = client.call('Page.captureScreenshot',{'format':'png'})
                        (directory/filename).write_bytes(base64.b64decode(capture['data']))
                        pictures.append(filename)
        report = {'browser':client.call('Browser.getVersion'), 'layout':layout, 'screenshots':pictures,
                  'note':'Chrome desktop viewport emulation only. Visual and physical-device acceptance are separate.'}
        (directory/'measurements.json').write_text(json.dumps(report,indent=2))
        cards = ''.join(f'<figure><a href="{html.escape(name)}"><img loading="lazy" src="{html.escape(name)}" alt="{html.escape(name)}"></a><figcaption>{html.escape(name)}</figcaption></figure>' for name in pictures)
        (directory/'index.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sky acceptance review</title><style>body{font:16px/1.5 system-ui;background:#101a30;color:#f4f7fb;padding:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}figure{margin:0}img{width:100%;height:450px;object-fit:contain;background:#080e1d}a{color:#8adcf0}figcaption{overflow-wrap:anywhere}</style><h1>Sky acceptance review</h1><p>Fixed fixtures and animation phases. These are Chrome desktop viewport captures, not physical mobile-device results. Select an image for full size. Check readability at 0/30/100% opacity, cloud edges, repetition and overall composition.</p><p><a href="measurements.json">Layout measurements</a></p><main>'+cards+'</main>')
        print(f'REVIEW: {len(layout)} layout combinations; {len(pictures)} stills; gallery: {directory / "index.html"}',flush=True)

    # Return to production with no selected beach: verify the ordinary entry and navigation.
    client.evaluate("localStorage.clear()")
    client.call('Page.navigate', {'url': origin + '/index.html'})
    wait_for(client, "typeof appState !== 'undefined' && regionSelect.options.length > 1")
    for page in ['settings', 'dashboard', 'beaches']:
        client.evaluate(f"document.getElementById('{page}NavButton').click()")
        assert client.evaluate(f"!document.getElementById('{page}Page').hidden")
    assert client.evaluate("typeof skyPreview === 'undefined' && typeof createSkyBackground === 'undefined' && !document.querySelector('.preview-sky,link[href*=sky-background]') && !document.body.hasAttribute('data-sky-preview') && previewErrors.length === 0")
    if args.review_dir:
        baseline = []
        for width,height in [(1280,900),(768,1024),(390,844),(320,740)]:
            client.call('Emulation.setDeviceMetricsOverride', {
                'width':width,'height':height,'deviceScaleFactor':1,'mobile':False})
            for size in ['0','1','2','3']:
                client.evaluate(f"textSizeSlider.value='{size}'; textSizeSlider.dispatchEvent(new Event('change'))")
                for page in ['dashboard','beaches','settings']:
                    client.evaluate(f"document.getElementById('{page}NavButton').click()")
                    baseline.append({'width':width,'textSize':size,'page':page,
                                     'contentWidth':client.evaluate('document.documentElement.scrollWidth')})
        report['normalAppLayout'] = baseline
        indexed = {(v['width'],v['textSize'],v['page']):v['contentWidth'] for v in baseline}
        for item in report['layout']:
            item['normalAppContentWidth'] = indexed[(item['width'],item['textSize'],item['page'])]
            item['addedHorizontalOverflow'] = item['contentWidth'] > item['normalAppContentWidth']
        assert not any(item['addedHorizontalOverflow'] for item in report['layout']), report['layout']
        (directory/'measurements.json').write_text(json.dumps(report,indent=2))
        print('PASS: all 48 review layouts match normal-app widths; no new horizontal overflow',flush=True)
    print('PASS: normal app startup/navigation unaffected', flush=True)
    check_live_preview(client, wait_for, origin, bootstrap, args)

finally:
    if chrome:
        chrome.terminate()
        chrome.wait(timeout=10)
    server.shutdown()
    server.server_close()
    shutil.rmtree(profile, ignore_errors=True)
