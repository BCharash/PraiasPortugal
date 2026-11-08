# Opt-in live sky preview — checkpoint 6F

Branch: `preview/sky-background`. Starting commit: `a95757a` (completed 6E handoff).
Completed and verified 8 November 2026. Implementation commit: `cfa1be8`.

This preview connects the accepted interim sky to the actual app's weather owner.
The normal `index.html` entry keeps its existing background and opaque cards.

## Run and review

In VS Code, right-click **`labs/sky-live-preview.html`** and choose **Open with Live
Server**. The existing `labs/sky-preview.html` remains the fixed-fixture comparison.
Serve the repository root so relative app/data paths resolve; do not open either
file with a `file://` URL.

The live preview uses real weather/marine services when opened normally. It copies
the app's saved selected beach and preferences into temporary frame-local storage.
If there is no selected beach, choose one in Beaches; no location is invented.
Changes to units, language, text size, favorites and selected beach stay in that
preview frame. Reset reloads from the normal app's saved choices. Closing the
preview leaves the normal app's saved preferences untouched.

Review Dashboard, Beaches and Settings. The sky stays mounted across all three.
Use Show sky to compare the original background and Animate sky to pause motion.
Panel opacity starts at the accepted 30%, with 0–100% comparison available only
in previews. Reduced-motion preferences disable sky animation/transitions even
when Animate sky is selected. No new controls were added to the normal app.

6F automated testing uses mocked providers only. Actual provider response quality,
Mac live appearance and physical-device performance are separate acceptance work.

## Files and data flow

- `src/js/skyBackground.js` is the promoted renderer from `labs/sky-background.js`.
  It preserves SVG clouds, independent low/mid/high coverage/drift, five-second
  updates, immediate first/beach-change appearance, rain/snow, irregular snow
  fields and credits. It uses shared numeric condition rules, accepts an explicit
  Lisbon UTC offset, and keys immediate location changes by ID and coordinates.
  It owns no weather fetch, refresh clock, storage or JavaScript timer.
- `src/css/sky-background.css` contains only reusable decorative sky/motion and
  credit styles. `labs/sky-background.css` retains preview panel alpha, contrast
  and status styles. The default entry loads neither stylesheet nor the renderer.
- `app.js` exposes `getApplicationEnvironment()`,
  `subscribeApplicationEnvironment(listener)` (returning an unsubscribe function)
  and `publishApplicationEnvironment()`. A snapshot contains selected beach,
  manager-approved weather or null, independently evaluated status and a shared
  Lisbon clock. Reads/subscriptions do not request data.
- `display.js` publishes on render/state updates. The existing solar-minute redraw
  in `conditions.js` publishes before checking whether its detailed graphic is
  visible. Selection starts that existing solar owner even if the first beach is
  chosen in Beaches before visiting Dashboard. This keeps live sky lighting
  current in every view using the existing solar tick. No second timer or weather
  scheduler was added.
- `labs/sky-live-preview-adapter.js` subscribes to that application state. It uses
  real service functions, real browser time and the existing request manager.
  It makes no request or scheduling decisions. Without a selected beach it shows
  the original fallback. With unavailable/expired weather it removes clouds and
  precipitation immediately and retains only selected-location solar lighting.
  Matching stale weather remains visible with its status/age and refresh failure.
- `labs/sky-live-preview.html` / `.js` supply the live shell and comparison controls.
  `labs/preview-frame.js` loads actual current app markup for both previews,
  inserts their explicitly chosen assets, strips the embedded Live Server reload
  client and removes the copied manifest. It does not substitute data or time.
- The fixed-fixture loader/adapter now import the shared renderer and styles,
  retaining synthetic weather, frozen time and request simulations only in the
  fixture lab. The live adapter's temporary preference storage remains lab-only.

The request owner remains the manager introduced in 6B–6D: one weather request,
15-minute success cadence, per-identity retry/backoff, timeout/cancellation and
visibility reconciliation. Adding a sky, changing opacity, navigating or changing
units/language does not create another request. This is the preview instance's
normal owner; opening the ordinary app in another tab creates another app instance.

## Cleanup

Reset/unload releases the environment subscription and removes the sky/status/
credit nodes. The renderer owns only DOM/CSS animation; it has no timer to leak.
Replacing the iframe disposes that app document and its owned work. Persisted
history navigation retains the preview; app lifecycle handlers pause/reconcile
weather. Repeated reset must yield one root, one credit footer and one environment
subscription in the new document. Shared app modules never import `labs/` files.

## Verification

Passed the full check: `python3 tests/sky-preview-check.py --screenshot /private/tmp/praias-6F.png`.
Focused check: `python3 tests/sky-preview-check.py --live-only`.
The focused path retains the service/timezone/request-owner contracts before the
live checks. `tests/sky_live_preview_check.py` supplies live-preview integration
checks using mocked raw provider responses through the unchanged app services.
No real provider transport is used by these automated runs.

Coverage includes manager snapshot identity; one initial weather/marine request;
no extra requests from navigation, settings, opacity, motion or solar redraws;
independent tier values; first and subsequent appearance; precipitation despite
missing temperature; shared clock/elevation; stale failure and hard expiry;
cold failure and late beach responses; provider attribution; reduced motion;
preference isolation; reset/unsubscribe cleanup; no-selection fallback; first
selection in Beaches; persisted history restore; and exact live-renderer clock/
elevation agreement across Lisbon, Los Angeles and Tokyo at summer midnight
and both autumn repeated hours.
The full suite also retains 36 fixtures, clock/DST checks in three timezones,
request/lifecycle races, normal-app behavior and preview layout checks.

Desktop (1280px) and narrow (390px) mocked live-preview screenshots were inspected
at 30% panel opacity. Viewport screenshots explicitly rerender Conditions after
resizing; its existing SVG can stretch until the next redraw after a resize.
Chrome viewport emulation does not establish physical iPhone/Safari acceptance.
The inherited narrow navigation overflow remains unchanged. The softer cloud
artwork is still the accepted interim Mac baseline, not a final realism approval.

## Stop and next checkpoint

6F does not activate the sky globally, change normal panel appearance, add a new
provider, modify ipma-radar, deploy or push. Its implementation is a separate local
rollback unit; reverting it restores 6E and the prior fixture imports.

Next is 6G: real-provider and Mac live-preview verification, estimated 30–60
minutes, requiring approval before agent-run live-provider calls. It must record
actual location/freshness and request-count evidence, user visual acceptance,
remaining device limitations and a separate global-activation decision.
