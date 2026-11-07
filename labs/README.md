# Sky preview checkpoints

This is an isolated lab for evaluating an eventual weather-driven background.
Checkpoint 3 adds independent cloud drift and gentle coverage updates behind
the real application layout with synthetic fixed data. Production `index.html`,
services and styles remain unchanged. Precipitation effects, freshness behavior
and live integration are deferred.

## Current handoff

Updated 7 November 2026. This is the authoritative guide for the sky experiment.
The current implementation stops after checkpoint 3 plus the cloud-placement
correction. The next development step has **not** been started or authorized by
this documentation request.

- Branch: `preview/sky-background`.
- Current implementation commit: `6eef2aa`.
- Normal application baseline: `476d190922870a39bc76cc91c68e9c9ba0bc20a7`.
- Normal app entry: `index.html`; experiment entry: `labs/sky-preview.html`.
- No global activation, live weather integration, deployment or push was performed.
- All implementation commits are local save points. No manual commit is needed
  before resuming from the documented checkpoint.

The original read-only investigation covered repository rules, layout, navigation,
weather service/formatter, data manager, `background.js`, and celestial services.
The reference implementation and handoff were read from
`/Users/williamcharash/Documents/GitHub/ipma-radar/docs/sky-header-architecture.md`,
with its `skyTheme.js`, SVG markup, CSS and browser checks. **ipma-radar was not
modified.** Its softer artwork remains an interim baseline, not an accepted final
realism design. The user's selected-beach requirement supersedes the reference's
startup-GPS location policy.

## Saved checkpoints

| Checkpoint | Commit | Completed work |
| --- | --- | --- |
| 1 — fixture shell | `52ad242` | Actual app markup and scripts in an isolated frame; five initial fixtures; navigation, beach selection, settings and storage isolation. |
| 2 — static sky | `9eec0ce` | Full-screen sky, host solar calculation, independent cloud tiers, 17 fixtures, original-background comparison and provider/licence credits. Also handles Live Server's injected reload script. |
| 2 follow-up — transparency | `b77d714` | Adjustable 0–100% panel backgrounds, default 30%; text and graphics remain fully visible. |
| 3 — motion | `d556b3d` | Independent drift, five-second coverage updates, immediate initial/beach display, pause/resume and reduced motion. |
| 3 follow-up — placement | `6eef2aa` | Removed the repeated three-row vertical layout that made every cloud type look like three horizontal bands; retained artwork, coverage and motion. |

Checkpoint 0's baseline preservation was performed before implementation by
recording the original commit and creating the preview branch. The normal app's
`index.html`, `src/`, data and manifest have remained unchanged throughout.

To inspect history without changing files:

```sh
git status --short --branch
git log --oneline -8
git show --stat 6eef2aa
git diff 476d190 HEAD -- index.html src data manifest.json
```

The last command should show no production-file changes at this checkpoint.

## File responsibilities and current data flow

| File | Responsibility |
| --- | --- |
| `labs/sky-preview.html` | Full-screen shell, fixture selector, reset, Show sky, Animate sky and opacity controls. |
| `labs/sky-preview.js` | Fetches current app markup, sets base URLs, inserts lab assets before startup, removes the embedded Live Server reload client and coordinates toolbar changes. |
| `labs/sky-preview.css` | Styles only the outer toolbar and frame. |
| `labs/sky-fixtures.js` | Synthetic normalized weather and marine results, fixed civil times and all 17 scenarios. |
| `labs/sky-preview-adapter.js` | Replaces services and storage inside the frame, freezes its clock, updates the sky from the same fixture weather returned to the app and exposes preview controls. |
| `labs/sky-background.js` | Instance-scoped SVG sky, palette selection, independent patch coverage, solar-service reuse, update/visibility/motion methods and cleanup. |
| `labs/sky-background.css` | Scoped drift/transitions, reduced motion, panel transparency and contrast support. |
| `tests/sky-preview-check.py` | Dependency-free isolated Chrome verification, local server, temporary profile and optional screenshots. |
| `docs/file-map.md` | Repository navigation entry pointing to this guide. |

The app still starts through its real controller. Its existing data manager
calls the frame's substituted weather service. That service returns fixture
weather to the app and passes the same snapshot and requested beach to the sky.
Marine fixtures support the existing cards and tide calculation. Only local
area/beach JSON and app assets are fetched. There is no second sky weather fetch.

The sky is mounted outside the three view containers, so navigation does not
remount it. Coverage updates reuse existing SVG patch nodes. CSS moves a separate
wrapper per tier, keeping movement independent from patch growth. All DOM queries
for sky artwork are scoped to the instance; SVG definition IDs are prefixed.

The fixture list is Clear day, Mixed clouds, Rain, Snow, Clear night,
Near-overcast, Dusk, Cloud data missing, and Low/Mid/High clouds at 20/60/95% each.
Clear day also covers the 0% case. All beaches share the selected synthetic
scenario; choosing a beach changes its geographic/solar context, not the fixture's
invented weather measurements.

## Open the preview

In VS Code, right-click `labs/sky-preview.html` and select **Open with Live Server**.
Keep PraiasPortugal open as the workspace folder. Refresh the preview after changes.
The outer lab handles Live Server reloads; its injected reload client is removed
from the embedded app to avoid an invalid WebSocket URL inside the frame.

Alternatively, from the repository root:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open <http://127.0.0.1:8766/labs/sky-preview.html>.
The normal application remains at <http://127.0.0.1:8766/index.html>.
Stop the server with Control-C.

The lab fetches the current `index.html`, adds a base URL and preview adapters,
then loads it into a full-height frame. It uses the existing markup, CSS,
controller, navigation, data manager, celestial calculations and formatters.
There is no copied dashboard or production preview flag.

## Checkpoint 3 review

1. Confirm the toolbar says **Checkpoint 3**, with **Show sky** and **Animate sky** checked.
2. Start with Mixed clouds. Check the combined cloud composition behind Dashboard,
   Beaches and Settings. Panels now default to 30% opacity so the sky is visible
   through them. **Panel opacity** ranges from 0% (fully transparent) to 100%
   (opaque). Text and graphics stay fully visible, with shadows for contrast.
3. Uncheck **Show sky** to compare with the original app background using
   the same beach, weather and settings. The comparison does not reset the app
   or request weather. Recheck it to restore the sky.
   The original-background comparison also restores the original opaque panels.
   Reset preserves the toolbar's opacity setting; reopening the lab defaults to 30%.
4. Compare Clear day, the individual Low/Mid/High 20/60/95% fixtures, Near-overcast,
   Dusk and Clear night. Zero coverage is represented by Clear day. Cloud data
   missing must show neither clouds nor stars, even at night.
5. Change beach, navigate between views and scroll Settings. The background must
   stay fixed to the viewport and continue to represent the selected beach.
6. Review desktop and narrow mobile sizes. Check text readability, cloud edges,
   overlap and repetition. Visual acceptance remains yours; passing technical
   checks does not establish natural-looking clouds.
7. Select Mixed clouds and watch for 20–30 seconds. High and mid layers initially
   move right at different speeds; low initially moves left. Movement is deliberately
   slow and decorative, with independent phases and smooth reversals at the limits.
8. Switch Low clouds 20% to Low clouds 95%. Additional patches should appear
   gently over five seconds; existing patches and drift should stay stable.
9. Uncheck **Animate sky** to pause drift at its current position and apply fixture
   changes immediately. Recheck it to resume. Reset retains this toolbar choice.
   The operating system's reduced-motion setting always disables drift and transitions,
   even if the checkbox is checked. Stars remain static.
10. Reset the preview with clouds selected: the first cloud state should appear
    immediately. Selecting another beach also commits its sky immediately so the
    previous beach's conditions do not linger during a transition.

The renderer reuses the reference's soft artwork, tier opacity, 24-patch growth,
independent activation seeds, shared illumination and 8/7/5 blur. Patches use
stable, tier-specific vertical positions across a 900-unit scene, rather than
three repeated rows. The earlier row layout made each type look like three
horizontal bands; the follow-up changes placement only. The SVGs crop to fill
the viewport while keeping shape proportions. This adapts the full-screen canvas; it does
not stretch the original shallow banner vertically. On narrow screens, cropping
means some patches fall outside the visible region. Percentages remain patch
budgets rather than literal fractions of cloudy pixels.

Solar elevation uses the host's `calculateSolarPosition()` and the fixture's
selected beach and civil time. The sky is a separate, decorative background;
the existing detailed Conditions graphic is unchanged. Stars are static and
illustrative. No additional moon artwork is introduced. Open-Meteo and licence
links are visible in the footer, explicitly labelled as future live-data credits;
the displayed data are synthetic fixtures.

Rain/Snow fixtures currently select a subdued palette and clouds only. Falling
precipitation is reserved for checkpoint 4. Subsequent cloud coverage updates use
five-second opacity/scale transitions; initial display and beach changes are
immediate. Palette selection still uses the reference's solar thresholds.
Independent High/Mid/Low drift uses 320/240/160-second traversals with negative
phases of -117/-83/-41 seconds. Linear alternate animation reverses at the limits.
Drift runs on a separate SVG group from patch growth, preserving stable patch
nodes and ongoing movement during weather updates. The renderer adds no JavaScript
timers or requests. Removing the frame also removes its CSS animations.

## Earlier checkpoint 1

Saved as commit `52ad242`: fixture shell with the original background only.
Its original checks remain useful:

1. Confirm the initial Dashboard shows Santa Rita Norte with the Mixed clouds
   fixture.
2. Open Beaches and select Santa Rita Sul or another beach. Return to Dashboard
   and check the selected name. Fixture weather uses that beach's coordinates.
3. Open Settings and change units, language or text size. Navigate between all
   three views. Existing cards and controls should behave as in the app.
4. Switch the lab's weather selector through Clear day, Mixed clouds, Rain,
   Snow and Clear night. Confirm the Dashboard conditions change. All beaches
   intentionally share the same synthetic weather scenario.
5. Press Reset preview. It retains the chosen weather fixture but resets the
   beach, settings and favorites to the lab defaults.
6. Open the normal app. Its saved settings, favorites and beach must be unchanged.

The fixed civil date is 7 November 2026, usually at 12:00, at 22:00 for night and
missing-cloud fixtures, and at 17:45 for dusk.
The frame freezes its own clock to that civil time, matching the existing host
services' local wall-clock contract. The parent page and normal app clock are
unchanged. This does not validate cross-timezone live-data handling.

Weather and marine services are replaced **only inside the preview frame** with
normalized fixture results. Beach and area JSON still load from the repository.
External fetches are blocked. No GPS or live weather requests are introduced.
Marine and tide values are synthetic supporting data, not forecasts.

Preview storage is temporary, per frame, and separate from browser storage,
even when the normal app and lab share a server port. Reset/reload discards it.
Removing the frame releases its listeners and timers.

## Verification

On macOS with Google Chrome installed:

```sh
python3 tests/sky-preview-check.py
```

The dependency-free check uses a temporary Chrome profile and a local server.
It exercises real navigation and beach-selection controls, all 17 fixtures,
independent cloud tiers, immediate startup, drift direction/timing, five-second
transition interpolation, stable patch nodes, pause/resume, reduced motion, comparison without state
changes, 0/30/100% panel backgrounds without fading their content, filter bounds,
attribution, unit conversion, desktop/mobile widths,
largest text size, reset and isolation from normal app preferences. It also checks
ordinary app startup/navigation and simulates the Live Server injection markers
to verify that its reload client stays out of the embedded app.
Set `CHROME_BIN` to use another Chrome executable.

For temporary review screenshots:

```sh
python3 tests/sky-preview-check.py --screenshot /private/tmp/praias-sky-review.png
```

This also writes desktop/mobile Dashboard and Settings variants next to the
named PNG. Those screenshots are temporary artifacts, not committed project files.

These checks do not validate live provider responses or physical iPhone/Safari.
The normal app's current weather-fetch and refresh behavior is unchanged.

Checkpoint 1 was verified in isolated Chrome on 7 November 2026. All checks
passed. A mobile screenshot was also inspected. The unchanged app has a small
navigation overflow at 390px: content width is 394px at normal text and 421px at
extra-large text. The preview matches those existing widths; it does not add
horizontal overflow. This layout limitation is recorded for later review.

Checkpoint 2 also passed the expanded Chrome checks on 7 November 2026.
Desktop and mobile screenshots of Dashboard and Settings were inspected.
Physical iPhone/Safari rendering and visual acceptance remain open.

Checkpoint 3 passed the expanded Chrome motion and regression checks on
7 November 2026. Physical iPhone/Safari sustained animation performance and
visual motion acceptance remain open.

The transparency and placement follow-ups also passed the existing regression
checks. Desktop/mobile stills were inspected after the placement change. The
motion tests sample animation progress deterministically; they do not constitute
a sustained physical-device performance test.

## Known limitations and unfinished behavior

- Rain/Snow scenarios currently change colours and cloud coverage only. There
  are no falling rain/snow layers, precipitation intensity classes or complete
  WMO condition mapping for effects yet.
- Fresh/stale/expired/offline status, valid-time metadata and delayed-response
  simulations are not implemented. The renderer currently expects a weather
  object with valid location/time context; a null-weather startup needs an
  explicit solar-only path in checkpoint 4.
- The live host already returns total/low/mid/high cloud values and numeric
  weather codes. Formatters handle units/translations; the sky must continue to
  consume numeric values instead of parsing their display strings.
- The host data manager has refresh/retry bookkeeping and request deduplication,
  but lacks an active automatic weather scheduler, beach-bound response safety,
  cancellation/timeouts and condition-age expiry. Pending refresh flags do not
  currently provide a complete latest-beach request queue. These are future
  live-integration tasks, not features established by the fixture tests.
- Host weather times are civil strings. Unambiguous condition/fetch instants,
  Lisbon DST handling and use from browsers outside Portugal still need live
  integration verification. Do not change the host's existing time format
  without considering its celestial and tide consumers.
- Cloud cover is an active patch budget, not a measured pixel area. Cropping,
  overlap, repetition and procedural appearance remain visual limitations.
  Independent atmospheric tiers must not be summed or normalized.
- Movement is decorative, not derived from winds aloft. No pressure-level wind
  requests, viewing-bearing model or new astronomy implementation was added.
- Solar palette thresholds still switch discretely; five-second smoothing
  applies to cloud growth/opacity, not continuous sky-colour interpolation.
- Physical iPhone/Safari, sustained performance, full accessibility acceptance
  and final visual acceptance remain open. Existing mobile navigation overflow
  is measured above and has not been repaired as part of the sky experiment.
- Panel transparency is an evaluation control in the lab, not an approved global
  readability design. Keep the original app available for comparison.

## Remaining steps and stop points

Estimates cover implementation and local verification. They exclude time for
user review, visual redesign and physical-device investigation. Work remains
incremental; finish checks and save a working local commit before stopping at
each checkpoint. A failure must be resolved or its increment reverted before
calling the checkpoint complete.

| Next step | Estimate | Scope and completion criteria |
| --- | --- | --- |
| 4 — precipitation and freshness fixtures | 45–75 minutes | Rain/snow effects and intensity, explicit status/expiry, missing/offline data and delayed beach responses, all confined to the lab. Regression checks pass and a local checkpoint is saved. |
| 5 — preview acceptance | 30–60 minutes | Whole-app visual/interaction review, clipping, scrolling, contrast, reduced motion and reset/cleanup; record physical-device checks and unresolved findings. Save the reviewed preview without activating it globally. |
| Later — live integration design and implementation | Estimate after audit | Strengthen the existing weather/data-manager lifecycle, adapt its shared snapshots and preserve current app function through separate small checkpoints. Requires approval after preview review. |
| Later — global activation | Estimate after integration review | Explicit visual/device acceptance and approval before changing the normal app's background. Preserve a reversible fallback. |

### Checkpoint 4 implementation order

1. Read this guide, Git status, the current lab files and the reference handoff.
   Preserve `6eef2aa` as the implementation baseline; do not modify ipma-radar.
2. Add an explicit lab weather-state contract: selected beach/requested coordinates,
   fetched-at and condition-time instants, injected evaluation time and validity.
   Keep state validation separate from drawing. A small new
   `labs/sky-weather-state.js` is an option, not an existing file.
3. Add one code mapping for rain, drizzle/freezing drizzle, freezing rain, snow,
   snow grains/showers, thunderstorms/hail and unknown codes. Keep rain/snow
   mutually exclusive; derive light/moderate/heavy presentation from the reference
   codes. No lightning, hailstone or accumulation simulation is required.
4. Add scoped CSS rain/snow layers, respecting Animate sky, reduced motion,
   pointer transparency and existing contrast/opacity controls. Check this increment
   before implementing the freshness cases.
5. Classify age using the older of fetch age and condition age. Below 15 minutes
   is fresh; 15 to under 60 minutes is stale, with a visible label while retaining
   valid matching conditions; 60 minutes or more is unavailable. Expired/invalid
   data must remove weather-driven clouds/precipitation and retain solar colours.
   Unknown weather must not imply clear-night stars. New fetch time cannot make
   an old model condition fresh.
6. Add fixed scenarios for missing/invalid times and cloud values, offline startup,
   stale refresh success/failure and expiry. Allow a solar-only sky without making
   the existing Dashboard crash when it expects a weather object. Use explicit
   state in the lab rather than pretending that the host already handles null data.
7. Simulate a 10-second request timeout and late responses, including a transport
   that ignores cancellation. Use generation and selected-beach/coordinate checks:
   an older beach's response must never replace current conditions. This tests
   the intended contract; it does not implement a second production fetch loop.
8. Verify the first usable state appears immediately, later same-beach updates
   stay gentle, and a beach change cannot leave old effects visible. Verify
   repeated reset/unmount releases owned work and prevents late writes.
9. Run the expanded isolated Chrome checks, inspect desktop/mobile compositions,
   confirm production files are unchanged, update this guide and save a local
   checkpoint. Stop before checkpoint 5 or live integration unless authorized.

### Checkpoint 5 review

Review the combined sky first, including single tiers and mixed/near-overcast,
then short motion sequences with the same fixed data and viewport. Check that
all three views, text sizes, controls, credits, scrolling and low/high panel
opacities remain usable. Check expanded SVG blur bounds and the removal of the
earlier three-row appearance at desktop/mobile sizes. Record user visual feedback
separately from technical test results. Physical iPhone/Safari rendering and
sustained animation should be checked before calling the feature ready.

### Later live integration boundaries

Use the selected beach as the location; do not acquire GPS for the sky. Reuse
`weatherService.js` snapshots and `dataManager.js` refresh ownership, with explicit
beach identity, reliable time metadata, timeout/cancellation and late-response
protection. Keep weather scheduling outside the renderer and share the geographic
and temporal context with the existing celestial service. Preserve independent
cover, immediate initial display, gentle later updates, precipitation, expiry,
reduced motion, provider attribution and readable controls. The normal
`background.js` replacement and any new default panel appearance belong only
to that later approved integration.

## Copy-paste resume prompt

```text
Resume PraiasPortugal's isolated sky lab on branch preview/sky-background.
First read labs/README.md and the repository development rules, inspect Git
status and current code, and preserve existing user changes. The completed
implementation baseline is 6eef2aa (checkpoint 3 plus the placement correction).
Follow the documented checkpoint 4 only: precipitation and freshness fixtures,
with the existing actual-layout preview, panel opacity and motion controls.
Read ipma-radar/docs/sky-header-architecture.md as a reference, but do not modify
ipma-radar. Keep production index.html, src/, data and manifest unchanged.
Do not fetch live weather, activate the sky globally, deploy or publish.
Verify each meaningful increment, run the expanded isolated browser checks,
document results/limitations and save a clean local checkpoint. Stop before
checkpoint 5 or live integration and report what remains for user review.
```

## Durable stop / resume

- Branch: `preview/sky-background`.
- Original app baseline: `476d190922870a39bc76cc91c68e9c9ba0bc20a7`.
- Current stop: checkpoint 3, cloud movement and transitions. No global changes.
- Checkpoint 2's original opaque-panel version is saved as `9eec0ce`. The follow-up
  adds adjustable panel transparency for sky evaluation (`b77d714`), preserved here.
- Next checkpoint, after approval: precipitation/freshness fixtures, followed
  separately by preview acceptance.
- Live-data integration and global activation require later approval.

To run the normal app, simply use `index.html`. To remove this experiment,
remove `labs/` and `tests/sky-preview-check.py`, and its file-map entry.
No production code needs to be reverted.
