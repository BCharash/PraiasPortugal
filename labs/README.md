# Sky preview checkpoints

This is an isolated lab for evaluating an eventual weather-driven background.
Checkpoint 1 provides the real application layout with synthetic fixed data.
It deliberately retains the original app background; sky artwork starts at
checkpoint 2, after approval.

## Open the preview

From the repository root:

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

## Checkpoint 1 review

1. Confirm the initial Dashboard shows Santa Rita Norte with the Mixed clouds
   fixture. Clouds are **data only** at this checkpoint.
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
It exercises real navigation and beach-selection controls, all five fixtures,
unit conversion, desktop/mobile widths, largest text size, reset and isolation
from normal app preferences. It also checks ordinary app startup/navigation.
Set `CHROME_BIN` to use another Chrome executable.

These checks do not validate live provider responses or physical iPhone/Safari.
The normal app's current weather-fetch and refresh behavior is unchanged.

Checkpoint 1 was verified in isolated Chrome on 7 November 2026. All checks
passed. A mobile screenshot was also inspected. The unchanged app has a small
navigation overflow at 390px: content width is 394px at normal text and 421px at
extra-large text. The preview matches those existing widths; it does not add
horizontal overflow. This layout limitation is recorded for later review.

## Durable stop / resume

- Branch: `preview/sky-background`.
- Original app baseline: `476d190922870a39bc76cc91c68e9c9ba0bc20a7`.
- Stop after checkpoint 1: fixture shell only; no sky renderer or global changes.
- Next authorized checkpoint would be static sky composition and readability,
  followed separately by movement, precipitation/freshness and preview acceptance.
- Live-data integration and global activation require later approval.

To run the normal app, simply use `index.html`. To remove this experiment,
remove `labs/` and `tests/sky-preview-check.py`, and its file-map entry.
No production code needs to be reverted.
