#!/usr/bin/env python3
"""Check the isolated fixture lab in Chrome, without third-party Python packages.

Run: python3 tests/sky-preview-check.py
Uses a temporary browser profile and loopback server; never uses your browser data.
"""
import base64
import argparse
import http.server
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

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = os.environ.get("CHROME_BIN", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--screenshot', help='Save a mobile preview screenshot to this PNG path')
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
                result[tier] = group.children.length === 24 && Math.abs(visible - (cover ?? 0) * 24 / 100) < .001;
            }
            result.stars = sky.querySelector('.preview-sky-stars').hidden === !(Number(sky.dataset.solarElevation) < -4 && weather.cloudCover !== null && weather.cloudCover < 85);
            return result;
        })()''')
        assert all(result.values()), (fixture, result)
        client.evaluate("lab.document.getElementById('dashboardNavButton').click()")
        assert client.evaluate("lab.document.getElementById('dashboardAirTemp').textContent.includes('°F')")
        client.evaluate("lab.document.getElementById('settingsNavButton').click()")
    print(f'PASS: navigation, selected-beach coordinates, units, independent cloud tiers and all {len(fixture_keys)} fixtures', flush=True)

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
        const paused = [...sky.querySelectorAll('.preview-sky-drift')].every(node =>
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
    if args.screenshot:
        image = client.call('Page.captureScreenshot', {'format': 'png'})
        pathlib.Path(args.screenshot).write_bytes(base64.b64decode(image['data']))
    print('PASS: reset, fixed clock, no external service calls, no errors, normal app preferences preserved', flush=True)

    # Return to production with no selected beach: verify the ordinary entry and navigation.
    client.evaluate("localStorage.clear()")
    client.call('Page.navigate', {'url': origin + '/index.html'})
    wait_for(client, "typeof appState !== 'undefined' && regionSelect.options.length > 1")
    for page in ['settings', 'dashboard', 'beaches']:
        client.evaluate(f"document.getElementById('{page}NavButton').click()")
        assert client.evaluate(f"!document.getElementById('{page}Page').hidden")
    assert client.evaluate("typeof skyPreview === 'undefined' && previewErrors.length === 0")
    print('PASS: normal app startup/navigation unaffected', flush=True)
finally:
    if chrome:
        chrome.terminate()
        chrome.wait(timeout=10)
    server.shutdown()
    server.server_close()
    shutil.rmtree(profile, ignore_errors=True)
