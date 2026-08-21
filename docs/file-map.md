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
│   │   └── weatherService.js
│   │
│   └── ui/
│       └── dashboard.html
│
├── .gitignore
├── index.html
├── manifest.json
└── README.md

