# File Map

## Purpose

This document provides a practical map of the Praias de Portugal
codebase.

`architecture.md` describes the conceptual architecture of the
application.

This document describes where those responsibilities are implemented.

The map should be updated whenever a new module is added or an existing
module changes responsibility.

---

# Project Structure

```text
PraiasPortugal/
│
├── data/
│   └── Application data
│
├── docs/
│   ├── application-navigation.md
│   ├── application-state.md
│   ├── architecture.md
│   ├── data-sources.md
│   ├── design-journal.md
│   ├── domain-model.md
│   ├── file-map.md
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
│
├── .gitignore
├── index.html
├── manifest.json
└── README.md