# Safe dashboard display — checkpoint 6C

Completed 8 November 2026 on `preview/sky-background`.
Starting commit: `11e84eb` (completed 6B handoff).
Implementation commit: `bac0b4f`.

The selected beach now publishes weather and marine results independently.
A weather failure cannot hide valid sea conditions; a slow or failed marine
request cannot hold back weather or navigation. The sky remains a fixture lab;
the normal background and panel opacity have not been activated or changed.

## Implementation

- `display.js` assigns each display a generation and verifies selected beach ID
  and coordinates before either asynchronous branch publishes. This also rejects
  older same-beach marine continuations when weather comes from the same cache.
  Selecting a beach immediately clears previous marine/tide readings and displays
  only matching usable cached weather, then starts both requests concurrently.
- `weatherRequests.js` / `dataManager.js` expose ownership checks for failed empty
  results separately from the existing usable-result check. Current failures can
  publish explicit unavailable state without admitting superseded results.
- `conditions.js` clears missing/expired measurements, min/max labels, UV values,
  lunar values and obsolete marker positions. Unknown values display `--`.
  Selected-beach solar context remains available independently of measurements.
  Localized loading, expired, stale and unavailable states describe weather;
  a separate sea status describes marine loading/failure.
- `app.js` rerenders loaded state for units, language and text size without
  weather or marine requests. Showing Dashboard rechecks weather age. Startup
  restores the selected ID before loading and wires navigation before awaiting
  the pending datasets. No new refresh timer was introduced.
- `weatherState.js` owns condition categories and translation keys; service
  description/icon wrappers and formatters reuse them, preserving legacy fields.
- `conditions.css` lets the middle column stack condition/advisory text and wrap
  within its full width. Compact unavailable labels use secondary metric text
  size, including the user's text-size setting. `index.html` adds a sea-status node.
- The fixture adapter passes null unavailable weather through this real renderer;
  its old fake-measurement payload and renderer override were removed.

## Verification

Passed `python3 tests/sky-preview-check.py --screenshot /private/tmp/praias-6C.png`.
All provider responses were fixed test responses; no live weather was requested.

The suite checks service semantics in Lisbon, Los Angeles and Tokyo, request
ownership/timeouts/retries, late cross-beach and same-beach marine responses,
weather failure with valid marine, marine failure with valid weather, weather
pending with usable marine, missing fields and hidden markers, and startup
navigation while marine is pending. Fahrenheit/knots/feet, Portuguese and largest
text rerender without requests; a later Dashboard render expires weather while
retaining marine. The Portuguese expiry label fits above the celestial panel at
390px. Saved beach identity overrides the alternate startup default correctly.

All 36 sky fixtures, motion, precipitation, freshness scenarios, reduced motion,
provider credits, reset cleanup, stored preferences and normal app navigation
also passed. Inspected the narrow Portuguese expired-state screenshot after the
layout correction. Existing navigation overflow remains: 394px content at 390px
normal text and 421px at extra-large text. Chrome viewport emulation does not
establish physical iPhone/Safari acceptance; that review remains deferred.

## Stop boundary and reversal

6C added no scheduler. The separately authorized [6D](weather-refresh-lifecycle.md)
now supplies automatic boundary notifications and visibility/resume reconciliation.
Marine transport has no new cancellation/deadline policy; its display publication
is guarded, but a slow request can remain pending. Shared Lisbon celestial clock
consistency remains 6E. Live sky preview remains 6F and live-provider review 6G.

The local 6C implementation commit is a separate rollback unit; reverting it
restores the 6B implementation while retaining earlier checkpoints. Documentation
is saved separately. No push, deployment, global sky activation or ipma-radar
modification was performed. The current next checkpoint is 6E, requiring approval; use
[the exact resume prompt](sky-live-integration-plan.md#exact-prompt-for-the-next-implementation-session).
