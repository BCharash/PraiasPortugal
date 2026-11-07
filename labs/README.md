# Sky preview checkpoints

This is an isolated lab for evaluating an eventual weather-driven background.
Checkpoint 2 adds a static sky behind the real application layout with synthetic
fixed data. Production `index.html`, services and styles remain unchanged.
Motion, precipitation effects, freshness behavior and live integration are deferred.

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

## Checkpoint 2 review

1. Confirm the toolbar says **Checkpoint 2** and **Show static sky** is checked.
2. Start with Mixed clouds. Check the combined cloud composition behind Dashboard,
   Beaches and Settings. Cards remain solid; exposed controls and metrics receive
   dark backing in the lab only.
3. Uncheck **Show static sky** to compare with the original app background using
   the same beach, weather and settings. The comparison does not reset the app
   or request weather. Recheck it to restore the sky.
4. Compare Clear day, the individual Low/Mid/High 20/60/95% fixtures, Near-overcast,
   Dusk and Clear night. Zero coverage is represented by Clear day. Cloud data
   missing must show neither clouds nor stars, even at night.
5. Change beach, navigate between views and scroll Settings. The background must
   stay fixed to the viewport and continue to represent the selected beach.
6. Review desktop and narrow mobile sizes. Check text readability, cloud edges,
   overlap and repetition. Visual acceptance remains yours; passing technical
   checks does not establish natural-looking clouds.

The renderer reuses the reference's soft artwork, tier opacity, 24-patch growth,
independent activation seeds, shared illumination and 8/7/5 blur. Rows are spread
over a taller 900-unit scene, and the SVGs crop to fill the viewport while keeping
shape proportions. This changes placement for the full-screen canvas; it does
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
precipitation is reserved for checkpoint 4. All sky updates are immediate and
static at this checkpoint; five-second subsequent transitions and independent
320/240/160-second drift belong to checkpoint 3. Preserve the reference's
negative phases (-117/-83/-41 seconds), directions and reduced-motion behavior
when that step is authorized.

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
independent cloud tiers, static/reduced-motion behavior, comparison without state
changes, filter bounds, attribution, unit conversion, desktop/mobile widths,
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

## Durable stop / resume

- Branch: `preview/sky-background`.
- Original app baseline: `476d190922870a39bc76cc91c68e9c9ba0bc20a7`.
- Current stop: checkpoint 2, static composition and readability. No global changes.
- Next checkpoint, after approval: movement and transitions, followed separately
  by precipitation/freshness fixtures and preview acceptance.
- Live-data integration and global activation require later approval.

To run the normal app, simply use `index.html`. To remove this experiment,
remove `labs/` and `tests/sky-preview-check.py`, and its file-map entry.
No production code needs to be reverted.
