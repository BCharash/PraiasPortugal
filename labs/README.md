# Sky preview checkpoints

This is an isolated lab for evaluating an eventual weather-driven background.
Checkpoint 3 adds independent cloud drift and gentle coverage updates behind
the real application layout with synthetic fixed data. Production `index.html`,
services and styles remain unchanged. Precipitation effects, freshness behavior
and live integration are deferred.

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

The fixed civil date is 7 November 2026, at 12:00 or 22:00 for the night fixture.
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
