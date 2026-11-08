# Sky live-data integration plan

Updated 8 November 2026. **Checkpoints 6A–6C implemented and verified; 6D–6G not started.**
Current branch: `preview/sky-background`. Planning baseline: `ff92eb3`.
Accepted visual implementation: `ee8be74`, with the star-visibility correction
and review checks in `22eed6f`. Mac interim appearance acceptance is recorded
in `ff92eb3`; its scope is in [the acceptance record](../labs/ACCEPTANCE.md).

The user approved checkpoints 6A and 6B separately after planning. 6A is saved as
`fd6722a`, starting from `0976be3`; see [the service contract](weather-service-contract.md)
for exact behavior, tests and limitations. 6B is now implemented as `b7806a7`,
starting from `fca7450`; see [weather request ownership](weather-request-ownership.md).
The user subsequently authorized 6C, now complete (`bac0b4f`); see [safe display](weather-display.md). Further checkpoints require approval.
Global activation remains a separate later decision.

## Intended result and boundaries

A later opt-in live preview will show the selected beach's sky across Dashboard,
Beaches and Settings using the application's existing weather request. Data-manager
improvements will provide identity, freshness, cancellation and refresh ownership.
The renderer will not fetch, cache or schedule weather.

Keep the existing normal background and opaque cards as the default throughout
this plan. The accepted 30% panel opacity is a Mac lab appearance, not permission
to change the normal app's cards. Preserve the fixed-fixture lab as a comparison
and regression reference. Do not modify ipma-radar, add GPS, winds aloft, a second
weather endpoint, a particle engine or a new astronomy implementation.
Without a selected beach, retain the normal fallback background and unavailable
readings. Do not invent a location, reuse arbitrary GPS or display a previously
selected beach's weather as current conditions for a new selection.

Physical iPhone/Safari review remains deferred. Mac acceptance does not establish
physical-device performance or readiness to activate the background globally.

## Pre-6A source audit (baseline `0976be3`)

These baseline findings came from source inspection, not live weather calls.
6A resolves the service/query items below. 6B resolves weather request ownership
and binds display reads/results. Full unavailable display and automatic lifecycle
refresh remain for later checkpoints:

| Existing file | Finding and implication |
| --- | --- |
| `src/js/weatherService.js` | Already requests total/low/mid/high cover, weather code and supporting data. No second weather request is necessary. It returns provider grid coordinates and local civil times, without requested beach identity or fetch/condition instants. It has no signal, timeout or HTTP status check, and assumes daily fields exist. |
| `src/js/weatherService.js` request builder | `is_day` is currently a bare query parameter after the current-variable list. Put it in that list when the request builder is repaired; preserve the remaining intended variables and verify the response contract. |
| `src/js/dataManager.js` | Stores one weather slot without a location key. Duplicate calls return false while a request is running; they do not await its result. The pending flag does not retain/drain the latest beach. A failure can leave another beach's old data available, and retry timing is global to that slot. |
| `src/js/dataManager.js` lifecycle | Tracks retry/status fields, but `nextUpdate` is cleared and no automatic weather scheduler runs. Pause/resume only changes a flag. A successful response is labelled fresh from completion, without evaluating condition age. |
| `src/js/display.js` | Waits for weather, reads the unkeyed slot, then waits for marine before publishing `currentDashboardData`. A superseded display call can still publish after those awaits. Marine failure can prevent otherwise usable weather reaching the UI. |
| `src/js/app.js` | Owns selected beach and navigation. Settings changes call `displayBeach()` and therefore load environmental data again. `showPage()` hides/shows existing containers; a shared sky can persist outside them. |
| `src/js/conditions.js` | Dereferences `dashboardData.weather` immediately and needs a real unavailable-state path. Its minute redraw builds civil time from the browser's local clock, which needs a Lisbon-aware boundary for browsers in other zones. |
| `src/js/celestialService.js` | Existing solar calculations and civil-time contract should be reused. Their inputs must remain consistent with the displayed location and clock. |
| `src/js/background.js` | Only changes body classes; startup selects sunny. Keep that behavior as the default until a later activation decision. |

### Time contract checked against provider documentation

The [Open-Meteo Forecast API documentation](https://open-meteo.com/en/docs),
checked 8 November 2026, describes ISO timestamps using the response's fixed
`utc_offset_seconds`, resolved at request time. Unix output is also available;
its documentation recommends timezone conversion for DST-aware times across a
forecast range. `current.time` identifies the condition's valid time.

For the smallest first change, retain ISO output and all existing civil-string
fields. Derive the current condition instant by strictly parsing its components
and subtracting the response offset from a UTC construction. Never interpret a
bare civil string using the browser's timezone. Test repeated/gap hours and
round-trip validation explicitly. If the response cannot support an unambiguous
current instant, expose unavailable freshness instead of inventing one.

Do not migrate the entire hourly/daily contract to Unix timestamps as part of
adding current-weather metadata. Forecast-range DST behavior is a pre-existing
concern to document and test separately if it requires broader changes.

## Ownership and data contract

The service metadata below now exists. Downstream ownership is still the target
for the remaining checkpoints:

```text
weatherService
    one normalized weather response + requested identity + valid/fetch instants
        ↓
dataManager
    active location, reusable snapshots, request generation, timeout,
    cancellation, deduplication, freshness, retry and automatic scheduling
        ↓
application controller
    current selected beach + current Lisbon clock + accepted weather state
        ├── Dashboard and formatters
        └── opt-in sky renderer
```

Metadata added in 6A without removing existing valid weather fields:

```js
{
  // Existing numeric weather and civil strings remain available.
  requestedBeachId,
  requestedLatitude,
  requestedLongitude,
  conditionTimeMs,  // actual valid instant, not a synthetic UI clock
  fetchedAtMs      // successful validated retrieval instant
}
```

Keep returned model-grid coordinates separate from requested coordinates.
Do not use a grid coordinate as a cache/request identity. The controller's
shared astronomical context must explicitly use the selected beach; adapt the
celestial entry point through that context rather than silently changing the
meaning of existing service fields in an unrelated metadata patch.

The manager adapts those additive service fields into the lab-tested envelope
shape (`beachId`, requested `latitude`/`longitude`, `conditionTimeMs`, `fetchedAtMs`,
and nested `weather`). Share the pure evaluator against that envelope; do not
make the renderer guess which timestamp or coordinate fields to use.

Separate freshness from request status: fresh/stale/expired/unavailable and
idle/loading/error are different dimensions. A retry must not reset the age of
retained data. A response with an older condition time must not replace a newer
accepted snapshot for the same identity.

The first live version uses same-session memory. Cold offline startup shows
unavailable weather and solar colours. A new persistent weather cache, installable
offline support or an offline-ready claim is outside this plan.

## Ordered implementation checkpoints

Estimates include local implementation and relevant checks, not user review,
physical-device investigation or provider availability. Each checkpoint ends
with a verified local commit and updated handoff. Start only the authorized one.

| Checkpoint | Estimate | Expected files and behavior | Stop criteria |
| --- | --- | --- | --- |
| 6A — service contract (complete: `fd6722a`) | Verified | `src/js/weatherService.js`, `src/js/weatherTime.js`, `src/js/weatherState.js` and deterministic tests. Requested identity, timestamps, optional signal, HTTP/schema checks and safe values are implemented. Query repaired; no renderer or refresh changes. | Legacy-field, formatter/celestial and actual-main-app checks passed in addition to the fixture suite. Saved and stopped. |
| 6B — weather request ownership (complete: `b7806a7`) | Verified | `dataManager.js`, shared state helpers and request tests. Location-keyed memory, joined same-location requests, latest-location selection, generation guards, 10-second timeout and cancellation. Preserve an explicit result for existing callers. | A/B/A switches, ignored aborts, timeouts and retry isolation cannot publish wrong-beach data. Superseded callers settle; no stranded pending flags. Stop and save. |
| 6C — safe display and unavailable data (complete: `bac0b4f`) | Verified | `display.js`, `conditions.js`, application call sites and display tests. Guard every asynchronous publication; read weather by identity; handle unavailable/expired weather without fixture substitution. Weather publication must survive marine delay/failure. Settings-only changes rerender loaded data. | Fresh, stale and unavailable Dashboard paths work; old marine/weather continuations cannot overwrite the selected beach; translations, units and selection still work. Stop and save. |
| 6D — refresh and lifecycle | 45–75 min | `dataManager.js`, lifecycle wiring in `app.js` and scheduler tests. One weather scheduler, retry/backoff, freshness notifications and resume reconciliation. | No duplicate loops, request storms or accumulated timers after repeated hide/show; expiry occurs without a successful new fetch. Stop and save. |
| 6E — shared location and clock | 30–60 min | Proposed environment-context helper; small controller/celestial entry changes and timezone tests. Use selected-beach coordinates and a Lisbon clock consistently for sky and detailed Conditions. Keep model times immutable. | Lisbon/other-browser-zone, midnight and DST cases agree; existing sunrise/sunset path checks pass. No weather fetch on a solar clock tick. Stop and save. |
| 6F — opt-in live sky preview | 45–75 min | Promote reusable artwork/CSS and pure weather semantics into `src/`; add `labs/sky-live-preview.html` and a small live-preview adapter; update fixture imports. Default app entry stays visually unchanged. | Existing fixture appearance is preserved; live preview consumes only the existing manager snapshot, persists across all views and retains credits, opacity comparison, reduced motion and cleanup. Stop and save. |
| 6G — live Mac verification | 30–60 min | Live-preview checks and acceptance evidence, with a small explicitly authorized live-weather smoke test. No activation change. | One weather owner, correct selected location, failure/expiry behavior and no duplicate fetch on navigation/settings; record actual provider evidence and remaining device checks. Stop for user review. |

Estimated total: **5–8¼ hours**, split across independently stoppable sessions.
6C is complete and stopped. Continue with 6D only after approval; do not
automatically run the remaining checkpoints together.

### 6A completed: compatible service metadata

1. Capture current normalized shape and representative raw responses with fixed
   fixtures. Include missing current/daily fields, non-2xx responses, malformed
   JSON, null/zero values and all three independent cloud bands.
2. Build the query with explicit parameter lists. Include `is_day` as a current
   variable. Keep the same weather endpoint and intended forecasts; do not add
   another provider request to obtain timestamps.
3. Introduce a strict current-time conversion helper and additive metadata.
   Preserve `currentTime`, hourly civil strings, sunrise/sunset and moon fields
   expected by current consumers. Missing optional moon/daily data must not
   discard otherwise valid cloud and condition data.
4. Accept an optional abort signal in the service, with no service-owned refresh
   loop. The next checkpoint will own deadlines and cancellation.
5. Centralize pure condition/freshness semantics for later reuse, avoiding a
   second production transport controller. During extraction, compare the pure
   functions against the fixture lab's accepted cases.

### 6B completed: location and request safety

- Key weather by beach ID plus requested coordinates. Decide active identity at
  selection time; never read an arbitrary retained slot as the new beach's data.
- Join the existing promise for a duplicate request to the same identity. A new
  selected identity supersedes the old request and starts the latest selection.
  Generation/identity checks must remain effective when cancellation is ignored.
- Retry state belongs to the relevant identity; an error at beach A must not
  block beach B. Abort/supersession is not a provider failure to back off.
- Preserve only valid matching snapshots after errors; do not stamp their age
  with the new attempt time. Clear or hide mismatched/expired data immediately.
- Keep the public call outcome explicit. Existing boolean-style callers may use
  a compatibility wrapper, but data returned to `displayBeach()` must be bound
  to the request's identity. Update only audited call sites.

### 6C details: safe display and unavailable data

Completed in the separately authorized 6C checkpoint. See [safe display](weather-display.md)
for behavior, deterministic regression evidence and limitations. Weather and marine
publish independently under display generations; unavailable readings clear without
fixture substitution; settings rerender without requests. No scheduler was added.

### 6D details: one manager scheduler

Use the existing retry policy as the starting point. Normal successful weather
refresh has a 15-minute cadence. Track next attempt independently of condition
age so an old model time cannot cause an immediate refresh loop. Notify the UI
at freshness/expiry boundaries as well as on request completion.

Pause new scheduled work while the document is hidden; allow an in-flight valid
request to settle unless superseded. On visibility restoration, evaluate age
and reconcile one due request, not every missed timer tick. Keep at most one
weather wake-up owner and clear it on shutdown. A separate solar-minute tick
must never fetch weather. Existing marine scheduling behavior stays outside scope.

### 6F details: live preview without default activation

- Proposed shared files: `src/js/skyBackground.js`, `src/css/sky-background.css`,
  plus the pure weather/time helpers introduced earlier. Extract accepted artwork,
  irregular snow fields and the SVG visibility correction without restyling them.
- Keep fixture request simulation, synthetic snapshots, fake clocks and browser
  storage replacement confined to the fixture lab. Do not promote its simulated
  transport controller into production alongside the data manager.
- The new live-preview entry loads actual app layout/services and attaches the
  renderer to application-published environment state. It uses temporary preview
  preferences, but no service replacement or frozen clock.
- Keep lab-only panel transparency and comparison controls out of the default
  app stylesheet. The promoted decorative stylesheet must not automatically
  alter normal cards, body theme or global form controls.
- Avoid duplicating lifecycle/markup code unnecessarily; a small shared preview
  loader is an option if needed. Preserve the existing fixture entry and checks.

## Acceptance and rollback discipline

After each checkpoint, run its focused checks and the applicable existing app/lab
regressions, inspect Git status/diff, update this plan's completion table and save
a local commit. Do not begin the next checkpoint when the user requests a stop.
No requested sky/celestial improvement may leave current normal app functionality
broken at a saved checkpoint.

Keep the accepted fixture branch/history available. Before the first source edit,
record the new exact starting commit. If an increment fails, fix it or revert that
increment before calling the checkpoint complete; avoid broad resets or deleting
user preferences. No deployment, push or merge is implied by local commits.

After 6G, review actual Mac live behavior with the user. Physical iPhone/Safari
rendering and sustained performance remain open until a real device can be tested.
Plan global activation separately, including a reversible fallback, chosen panel
readability treatment and a decision about the inherited narrow navigation layout.

## Exact prompt for the next implementation session

```text
Implement checkpoint 6D only from docs/sky-live-integration-plan.md in
/Users/williamcharash/Documents/GitHub/PraiasPortugal.
First inspect Git status, repository instructions and current source. Read
labs/README.md, docs/weather-display.md and docs/weather-request-ownership.md.
Preserve 6A–6C and user changes; record the starting commit. Add one data-manager
weather scheduler with 15-minute success cadence, retry/backoff, freshness/expiry
notifications, hidden-page pause and one due-request reconciliation on resume.
Keep condition age separate from next-attempt time. Preserve independent marine
loading, settings-only rerenders, cancellation and selected-beach generation guards.
Use deterministic clocks/transports and lifecycle regression tests. Keep the normal
background and accepted artwork; do not begin 6E, connect the sky, modify ipma-radar,
fetch live providers for tests, deploy, publish or push. Update the handoff,
save a verified local checkpoint and stop.
```
