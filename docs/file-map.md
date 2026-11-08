# File Map

## Purpose

This document provides a practical map of the current **Praias de Portugal** codebase.

`architecture.md` describes the conceptual architecture of the application.

`file-map.md` describes where the major responsibilities are implemented and provides a quick way to locate the relevant part of the project.

`module-guide.md` describes the detailed responsibilities and boundaries of the JavaScript modules.

`design-journal.md` records important design decisions and the reasoning behind them.

This file should be updated whenever the project structure changes or an existing file changes its primary responsibility.

---

# Project Structure

The opt-in sky experiment has fixed-fixture and live-data entries:
`labs/sky-preview.html` and `labs/sky-live-preview.html`; see `labs/README.md`.
Both load shared artwork from `src/js/skyBackground.js` and
`src/css/sky-background.css`, with preview-only panel opacity/contrast styles in
`labs/sky-background.css`. The normal entry loads none of those sky assets.
`labs/preview-frame.js` loads actual app markup for both entries. Fixture services,
clock and scenario simulation stay in the fixture adapter/state module; the live
adapter only isolates preferences and subscribes to published app environment.
`docs/sky-live-preview.md` records 6F behavior, run instructions and verification.
`labs/sky-inputs.js` reports actual normalized renderer inputs in both previews;
its readout is preview-only and owns no requests/timers.
`tests/sky-preview-check.py` and `tests/sky_live_preview_check.py` verify both previews
with a temporary browser profile.
`labs/README.md` is the authoritative experiment handoff, including saved commits,
verification evidence, limitations and the remaining checkpoint plan.
`labs/ACCEPTANCE.md` records checkpoint 5 evidence, interim Mac acceptance and deferred device review.
`docs/sky-live-integration-plan.md` contains the audit and remaining live-data
checkpoints. 6A–6F are implemented; 6G has not started.
`src/js/environmentContext.js` supplies the selected-beach/Lisbon clock boundary
and civil arithmetic for Conditions and celestial rendering.
`docs/environment-context.md` records its 6E interface and cross-zone/DST tests.
`src/js/weatherScheduler.js` owns the data manager's weather wake-up and refresh/
freshness reconciliation. `docs/weather-refresh-lifecycle.md` documents 6D behavior
and deterministic lifecycle verification.
`docs/weather-display.md` records independent dataset publication, display generations,
unavailable-state rendering and settings-only rerenders introduced by 6C.
`docs/weather-service-contract.md` records the implemented service contract and
verification. `src/js/weatherTime.js` and `src/js/weatherState.js` are shared pure
helpers loaded by the normal app. The contract page/scripts under `tests/` use
mocked provider responses and do not fetch live weather.
`src/js/weatherRequests.js` is the data-manager-owned weather request/cache module;
`docs/weather-request-ownership.md` documents it. The request contract page under
`tests/` checks races, retry isolation and timeout using injected clocks/transports.

```text
PraiasPortugal/

│
├── data/
│   ├── areas.json
│   └── beaches.json
│
├── docs/
│   ├── application-navigation.md
│   ├── application-state.md
│   ├── architecture.md
│   ├── data-sources.md
│   ├── design-journal.md
│   ├── development-rules.md
│   ├── domain-model.md
│   ├── file-map.md
│   ├── module-guide.md
│   └── vision.md
│
├── icons/
│   ├── apple-touch-icon.png
│   ├── favicon.png
│   ├── icon-192.png
│   └── icon-512.png
│
├── src/
│   │
│   ├── css/
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── conditions.css
│   │   ├── dashboard.css
│   │   ├── layout.css
│   │   └── styles.css
│   │
│   ├── images/
│   │
│   ├── js/
│   │   ├── alerts.js
│   │   ├── app.js
│   │   ├── background.js
│   │   ├── beachHeader.js
│   │   ├── browse.js
│   │   ├── celestialFormatter.js
│   │   ├── celestialService.js
│   │   ├── coastalConditions.js
│   │   ├── conditions.js
│   │   ├── dashboard.js
│   │   ├── data.js
│   │   ├── display.js
│   │   ├── marineFormatter.js
│   │   ├── marineService.js
│   │   ├── preferences.js
│   │   ├── tideFormatter.js
│   │   ├── tideService.js
│   │   ├── weatherFormatter.js
│   │   ├── skyBackground.js
│   │   ├── environmentContext.js
│   │   ├── weatherScheduler.js
│   │   ├── weatherRequests.js
│   │   ├── weatherService.js
│   │   ├── weatherState.js
│   │   └── weatherTime.js
│   │
│   └── ui/
│       └── dashboard.html
│
├── .gitignore
├── index.html
├── manifest.json
└── README.md

