# Shared location and Lisbon clock — checkpoint 6E

Completed 8 November 2026 on `preview/sky-background`.
Starting commit: `f72e71e` (completed 6D handoff).
Implementation commit: `1d52a93`.

Detailed Conditions now uses selected-beach coordinates and a current Lisbon
clock on initial render, subsequent renders and the existing solar-minute tick.
The shared boundary is ready for a future sky consumer; no live sky was connected.

## Interface and implementation

`src/js/environmentContext.js` has no requests, timers, DOM or storage:

- `clock(instantMs = Date.now())` returns the original instant, Lisbon civil time
  and the exact UTC offset for that instant, using `Intl` and Europe/Lisbon.
  The two occurrences of the autumn repeated hour retain distinct offsets.
- `create(beach, weather, instantMs)` returns a selected identity/coordinates,
  the clock and a copied `celestialWeather` input. Coordinates come from the
  selected beach, rather than the provider grid. Only weather with matching
  requested ID/coordinates is copied; otherwise solar context has null model
  fields. Invalid/missing location or clock returns null.
- `parseCivil()` and `civilDate()` provide UTC-backed civil arithmetic containers
  for the existing solar formulas, with civil getters/setters. They are Date
  instances, but their numeric values are **not physical instants**. Keep them
  inside celestial parsing/calculation/rendering/simulation. Never use those
  pseudo epochs for request freshness, provider times or weather scheduling.

`getCelestialState(weather, clock)` accepts an optional display clock without
rewriting `weather.currentTime`. Its legacy one-argument path still uses the
supplied weather/simulation time. Current instant offsets take precedence over
civil-time offset inference, including the repeated autumn hour. Astronomical
formulas and horizon presentation rules are retained. Civil constructors in the
service and formatter now use the shared arithmetic containers so a browser's
own DST gap cannot normalize a valid Lisbon civil time or distort path sampling.

Same-day provider sunrise/sunset values are preserved. Their own calendar dates
must match the displayed Lisbon day; after midnight the existing solar model
calculates the new day's horizon. Labels and the graphic use those same resolved
horizon times. Provider current/valid/fetched timestamps remain unchanged.

`conditions.js` builds this context for full and minute-only celestial rendering,
including unavailable weather. The existing minute timer and visibility redraw
remain the owners of solar redraws; no new solar timer or environmental request
was added. Marine/tide acquisition and formatting were not migrated into this
civil clock work. The 6D weather scheduler remains independent.

The development simulator clones/steps civil containers and seeds from Lisbon
civil time. Explicit simulated dates override the live clock; legacy HHMM input
uses the current display date. A simulated ambiguous civil time retains the
existing inferred-offset convention; it does not select a particular fold.
Production clock instants distinguish both folds explicitly.

The fixture adapter freezes its November clock to a UTC instant matching Lisbon
winter time instead of the reviewer's local timezone. Its Date replacement also
recognizes Date instances created before the adapter, including civil containers.
This preserves fixture time/appearance while avoiding a cross-realm-style
instance check failure. No artwork or fixture weather values were changed.

## Verification

Passed `python3 tests/sky-preview-check.py --screenshot /private/tmp/praias-6E.png`.
All provider data was mocked; no live weather calls were made.

`tests/environment-context-contract.html` forbids network connections and runs
shared clock/service/formatter checks. The runner compares solar positions,
horizon times and complete SVG paths across Lisbon, Los Angeles and Tokyo.
Cases include the US spring gap (valid civil time in Lisbon), Lisbon spring jump,
both occurrences of the autumn hour, summer midnight and year rollover. Tests
also cover selected coordinates versus model grid, mismatched identity, invalid
civil dates, immutable model times, provider horizon preservation and existing
sunrise/sunset disc-reveal rules.

Actual app checks compare Conditions labels and SVGs in all three browser zones,
step the development simulator through midnight and verify that solar redraws
make neither weather nor marine requests or mutate the model snapshot. All 6A–6D
service/request/lifecycle checks and the full 36-fixture suite passed, including
motion, rain/snow, expiry, reduced motion, credits, preferences and normal app
navigation. Inspected the narrow fixture screenshot; interim composition remains.

This is deterministic Chrome evidence, not physical iPhone/Safari acceptance or
live provider validation. Existing narrow navigation overflow remains unchanged.
The service's forecast-range ISO/DST concern and broader marine/tide time handling
remain outside this checkpoint; this change does not migrate those contracts.

## Stop and resume

6E is a separate local rollback unit. Reverting its implementation restores 6D
celestial behavior while retaining earlier checkpoints. No push, deployment,
global background activation or ipma-radar modification was performed.

The separately authorized [6F live preview](sky-live-preview.md) now consumes
existing manager weather and this shared clock, keeping the default entry unchanged
and preserving fixture appearance without a second weather owner.
Next is 6G provider verification (30–60 minutes), requiring approval.
Global activation remains a separate later step.
Use [the exact next-session prompt](sky-live-integration-plan.md#exact-prompt-for-the-next-implementation-session).
