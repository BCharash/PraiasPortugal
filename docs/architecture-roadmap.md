# Architecture Roadmap

## Purpose

This document is the durable architectural record for **Praias de Portugal**.

It records the architectural decisions, ownership boundaries, constraints, future requirements, deliberate deferrals, known problems, planned improvements, and the reasoning behind important decisions.

Its purpose is to prevent architectural reasoning from being lost when development is interrupted and later resumed.

This is intentionally more detailed than a conventional task list.

The application is being developed incrementally. Some capabilities described here are deliberately **not being implemented now**. They are documented because current architectural decisions should not make those capabilities unnecessarily difficult later.

The central principle is:

> **Design today's architecture so that tomorrow's functionality can be added without requiring today's functionality to be rewritten.**

An equally important constraint is:

> **Do not implement future functionality merely because the architecture anticipates it.**

Future requirements should influence architectural boundaries and interfaces, not cause premature implementation.

---

# 1. Architectural Intent

Praias de Portugal is intended to become a scalable environmental-information application for Portuguese beaches.

The application should eventually be able to present information about:

- individual beaches;
- Areas and regions;
- weather;
- wind;
- marine conditions;
- surf;
- sea temperature;
- tides;
- alerts;
- celestial conditions;
- coastal conditions;
- ocean-current behavior;
- current anomalies;
- possible warm-water signals;
- rip-current risk;
- and other environmental interpretation.

The architecture should remain understandable as these capabilities are added.

The application should avoid becoming a collection of interdependent functions in which adding one feature requires modifying several unrelated modules.

The architecture should therefore emphasize:

- clear ownership;
- separation of concerns;
- replaceable external services;
- normalized data;
- explicit application state;
- controlled data refresh;
- independent derived analysis;
- reusable presentation components;
- responsive presentation;
- internationalization;
- and platform-independent business logic wherever practical.

---

# 2. Architectural Philosophy

The architecture should distinguish between:

1. information about the physical domain;
2. raw information obtained from external sources;
3. information derived from those raw observations;
4. and presentation of that information.

This distinction is more important than the exact number of JavaScript files.

The application should be organized around **responsibilities**, not merely around files.

A file may eventually be split if its responsibilities become genuinely different, but files should not be multiplied merely for theoretical purity.

Likewise, a large file should not automatically be rewritten if its current responsibilities are still coherent.

The objective is a stable architecture, not maximum fragmentation.

---

# 3. Fundamental Separation of Responsibilities

## 3.1 Domain Data

Domain data describes what the application knows about places and relatively permanent characteristics.

Examples include:

- Region;
- Area;
- Beach;
- Beach identifier;
- Beach name;
- coordinates;
- municipality;
- district;
- permanent Beach characteristics.

Current domain data is represented primarily by:

```text
data/areas.json
data/beaches.json
```

and accessed through `data.js`.

Domain data is not environmental forecast data.

---

## 3.2 Raw Environmental Data

Raw environmental data is information obtained from an external provider.

Examples include:

- air temperature;
- apparent temperature;
- humidity;
- dew point;
- precipitation;
- visibility;
- wind;
- wave height;
- wave period;
- wave direction;
- swell height;
- swell period;
- swell direction;
- sea-surface temperature;
- ocean-current velocity;
- ocean-current direction;
- tide predictions;
- alerts.

Raw environmental data belongs to appropriate environmental services.

---

## 3.3 Derived Environmental Information

Derived environmental information is calculated or inferred by the application from raw data, domain data, historical data, or combinations of these.

Examples include:

- coastal fog or mist interpretation;
- current anomaly;
- current reversal;
- possible warm-water signal;
- future rip-current risk;
- environmental suitability;
- other modeled assessments.

Derived analysis should not automatically be placed inside the raw service that happens to supply one of its inputs.

For example:

> Marine Service answers: "What is the modeled ocean current?"

A future Current Analysis module answers:

> "How unusual is that current for this coastal sector?"

Similarly:

> Marine Service does not become a Rip Risk Service merely because wave and current data originate there.

---

## 3.4 Presentation

Presentation determines how information is shown.

Examples include:

- Dashboard;
- Conditions page;
- cards;
- widgets;
- labels;
- formatters;
- SVG graphics;
- visual background;
- responsive layout.

Presentation should consume application data rather than becoming responsible for obtaining that data.

---

# 4. Desired High-Level Data Flow

The desired conceptual data flow is:

```text
                    DOMAIN DATA
                   Areas / Beaches
                          │
                          ▼
                  Application State
                          │
                          ▼
                    Data Manager
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
     Weather            Marine             Tide
     Service            Service           Service
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                   Normalized Data
                          │
                          ▼
                   Derived Analysis
                          │
                          ▼
                   Application Data
                          │
                          ▼
                    Presentation
```

The important conceptual direction is:

```text
External Provider
       ↓
Environmental Service
       ↓
Normalized Data
       ↓
Data Manager / Application State
       ↓
Derived Analysis
       ↓
Presentation
```

Not every future capability must use exactly this implementation, but the separation of responsibilities should remain.

---

# 5. Domain Data and Beach Extensibility

Adding a new Beach should ideally require adding domain information rather than modifying application logic.

The desired relationship is:

```text
New Beach
    ↓
Domain Data
    ↓
Existing Services
    ↓
Existing Analysis
    ↓
Existing Presentation
```

A new Beach should not normally require changes to:

- Weather Service;
- Marine Service;
- Tide Service;
- Data Manager;
- Conditions;
- Current Analysis;
- Rip Risk;
- or Dashboard code.

If adding a Beach requires new application logic, the architecture should be examined for unnecessary Beach-specific coupling.

---

# 6. Areas, Regions, and Beaches

`data.js` currently owns:

- Areas;
- Beaches;
- domain-data initialization;
- Beach lookup;
- Area lookup;
- region queries;
- Area queries;
- Beach queries.

This is a coherent responsibility.

`browse.js` uses these domain queries to populate:

```text
Region
   ↓
Area
   ↓
Beach
```

`browse.js` should not:

- load domain data;
- fetch environmental data;
- display environmental conditions;
- start the application.

No major architectural rewrite of `data.js` or `browse.js` is currently required.

---

# 7. Environmental Service Boundaries

The principal environmental services are:

```text
weatherService.js
marineService.js
tideService.js
```

Alerts will eventually have an independent service when actual alert data is introduced.

Services should:

- communicate with external providers;
- construct provider-specific requests;
- interpret provider responses;
- normalize provider-specific information;
- return application-usable data.

Services should not:

- manipulate the DOM;
- decide how data is displayed;
- own page navigation;
- become the general refresh controller;
- contain unrelated UI logic;
- contain future derived environmental models merely because their inputs originate there.

---

# 8. Weather Service

Weather remains an independent environmental service.

It may provide:

- atmospheric conditions;
- temperature;
- apparent temperature;
- wind;
- precipitation;
- visibility;
- cloud information;
- UV information;
- sunrise;
- sunset;
- moonrise;
- moonset;
- moon phase;
- and other weather-related information.

Provider-specific response structures should remain inside Weather Service as much as practical.

The rest of the application should consume normalized Weather data.

---

# 9. Marine Service

Marine remains responsible for raw marine information.

This includes, where available:

- sea-surface temperature;
- wave height;
- wave period;
- wave direction;
- swell height;
- swell period;
- swell direction;
- ocean-current velocity;
- ocean-current direction;
- other marine variables.

Ocean currents deliberately remain part of Marine.

The existence of future Current Analysis does **not** require moving currents out of Marine.

The distinction is:

```text
Marine Service
    ↓
What is the modeled current?

Current Analysis
    ↓
What does that current mean?
```

---

# 10. Tide Service

## Current Decision

Tides are currently obtained from Open-Meteo.

**Do not migrate the tide source now.**

The existing Open-Meteo tide implementation should remain functional while the architecture is cleaned up.

However, Tide should now be treated as a separate service conceptually and architecturally.

The desired separation is:

```text
Open-Meteo
    ├── Marine Service
    └── Tide Service
```

rather than:

```text
Open-Meteo
      ↓
Marine Service
      ↓
Tide
```

The reason for separating Tide now is future flexibility.

---

# 11. Future IH S-104 Tide Migration

The intended future direction is migration to **Instituto Hidrográfico S-104 tide data** when an appropriate S-104 source becomes available and practical for the application.

The desired future change is:

```text
Current:

Tide Service
      ↓
Open-Meteo
```

becoming:

```text
Future:

Tide Service
      ↓
IH S-104
```

The Tide card and Conditions page should not need to know which provider supplies the tide information.

Provider replacement should occur behind the Tide Service boundary.

---

# 12. Tide Datum and Offset

The current tide implementation contains an offset/reference consideration.

The exact offset should not be treated as a permanent architectural constant.

When IH S-104 is eventually introduced, the tide reference/datum relationship should be reassessed against authoritative IH data.

The current implementation is therefore a deliberate temporary solution.

The migration should be designed so that the current offset logic does not become embedded throughout the application.


### Tide Service Data Validation

The Tide Service currently tests `marine.hourly.tide.seaLevel` using JavaScript truthiness.

A value of `0` is a valid sea-level value and must not be interpreted as missing data.

The eventual cleanup should therefore replace truthiness testing with an explicit null/undefined check.

Current pattern:

```javascript
if (!marine.hourly.tide.seaLevel)
    return null;


---

# 13. Data Manager

`dataManager.js` is intended to be the central coordinator of environmental-data freshness and updating.

Its responsibilities include:

- refresh policies;
- update coordination;
- duplicate-request prevention;
- freshness tracking;
- update status;
- retry behavior;
- automatic refresh;
- manual refresh;
- application lifecycle interaction.

It should not:

- manipulate the DOM;
- format data for display;
- construct provider-specific API requests;
- contain provider-specific API logic;
- decide how data is visually presented.

The service communicates with the provider.

The Data Manager decides **when** the service should be called.

---

# 14. Single Refresh Authority

The application should have one authoritative mechanism for deciding whether environmental data should be refreshed.

The following should not independently create competing refresh policies for the same dataset:

- Dashboard;
- Conditions;
- display;
- individual cards;
- formatters.

A component may indicate that it needs current data.

The Data Manager determines whether a network request is actually necessary.

Conceptually:

```text
Component:
"I need Weather."

Data Manager:
"Weather is fresh enough.
No network request is necessary."
```

This prevents presentation code from becoming coupled to provider refresh behavior.

---

# 15. Source Refresh Rate Versus Application Refresh Rate

These are separate concepts.

A source may make new data available every ten minutes.

That does not mean the application must request it every ten minutes for every user.

A user may reasonably prefer:

```text
Hourly
```

even when the source can provide newer information every ten minutes.

The architecture should therefore distinguish:

1. source update availability;
2. application refresh policy;
3. user refresh preference;
4. dataset age;
5. application lifecycle;
6. request state;
7. retry state.

The eventual refresh decision should consider all of these.

---

# 16. User Refresh Preference

A future user setting should allow the user to choose how frequently the application automatically checks for updated environmental data.

The important distinction is:

```text
Source:
How often new information can exist.

User:
How often I want the application to check for it.
```

For example, a user might choose hourly refresh even when a source can provide updates every ten minutes.

The Data Manager should enforce the selected policy.

A manual Update Now should remain available regardless of the normal automatic refresh preference, subject to request-safety rules.

The exact UI and available intervals can be decided later.

---

# 17. Dataset Freshness

The Dashboard should tell the user how old the displayed data is.

At minimum, the application should know:

```text
last successful application retrieval
```

Where the provider supplies useful metadata, the application should also preserve:

```text
source/model update time
```

These are not necessarily identical.

For example:

```text
Retrieved:
14:20

Source/model:
13:00
```

The user-facing presentation should make the distinction understandable without exposing unnecessary technical detail.

---

# 18. Source Metadata

Where available, source metadata should be preserved rather than discarded.

Potential metadata includes:

- source;
- provider;
- dataset;
- retrieval time;
- source update time;
- model run time;
- valid-from time;
- valid-to time;
- generation time;
- quality indicators.

Not every source will provide every field.

The normalized architecture should therefore allow optional metadata rather than requiring every provider to supply identical information.

A conceptual structure might eventually be:

```text
data
metadata
    source
    retrievedAt
    sourceUpdatedAt
    modelRun
    validFrom
    validTo
```

The exact structure should be determined when the source-specific metadata is fully mapped.

---

# 19. Dataset Status

Each managed dataset should eventually have explicit state such as:

```text
unknown
updating
fresh
stale
error
```

It may also contain:

- last successful update;
- source timestamp;
- next eligible update;
- retry time;
- failure count;
- error information.

Freshness and error state belong to the application/data-management layer.

The UI should consume this information rather than reconstructing it independently.

---

# 20. Duplicate Requests

Only one active refresh for a dataset should normally exist at a time.

If a second request arrives while the dataset is already updating:

```text
Request A starts
      ↓
Request B arrives
      ↓
B becomes pending
      ↓
A completes
      ↓
Determine whether B is still necessary
```

The application should not launch duplicate concurrent requests for the same dataset.

If the first request successfully provides sufficiently fresh data, the pending request may no longer be necessary.

If the first request fails, the pending request must still respect retry and backoff rules.

---

# 21. Retry Policy

Failed requests should not create rapid retry loops.

The existing concept of:

- failure count;
- increasing retry delay;
- maximum retry delay;

is appropriate.

A failed refresh should not automatically destroy the last successful dataset.

Prefer:

```text
Last valid data
+
stale/error indication
```

over:

```text
Empty data
```

when a temporary network or provider failure occurs.

---

# 22. Manual Update Now

The application should eventually provide an **Update Now** action.

Its conceptual meaning is:

> Reassess the datasets relevant to the current Beach and update those for which a refresh is appropriate.

It should not mean:

> Ignore every safety mechanism and launch every possible API request.

Manual refresh and automatic refresh should use the same Data Manager machinery.

The difference is the trigger:

```text
Automatic:
Timer / lifecycle
       ↓
Data Manager

Manual:
User presses Update Now
       ↓
Data Manager
```

---

# 23. Application Foreground / Background

The application is currently used as a standalone web app on iPhone.

The web-app/browser lifecycle can detect transitions such as:

```text
foreground
    ↓
background
    ↓
foreground
```

These lifecycle events should eventually inform the Data Manager.

Returning to the foreground should **not** mean:

```text
Refresh everything unconditionally.
```

Instead:

```text
Return to foreground
        ↓
Check dataset freshness
        ↓
Determine what has become stale
        ↓
Refresh only what is appropriate
```

The lifecycle mechanism reports lifecycle state.

The Data Manager decides what data to refresh.

---

# 24. Local Calculation Versus Network Refresh

The architecture must distinguish between:

### Data that becomes newer

Examples:

- Weather;
- Marine;
- Tide;
- Alerts.

and:

### Existing data that needs to be interpreted again because time has passed

Example:

- Celestial position.

This distinction is important because a local calculation should not require an unnecessary network request.

---

# 25. Celestial Architecture

The current conceptual architecture is:

```text
Weather Data
     ↓
celestialService.js
     ↓
Celestial State
     ↓
celestialFormatter.js
     ↓
Visual Graphic
```

`celestialService.js` calculates astronomical state.

`celestialFormatter.js` creates the visual representation.

This separation should be preserved.

---

# 26. Celestial Update Interval

The Celestial display should update internally approximately **every ten minutes**.

This is a local calculation interval.

It does **not** mean Weather data needs to be refreshed every ten minutes.

The distinction is:

```text
Weather:
Network data refresh

Celestial:
Local recalculation using existing data + current time
```

Ten minutes is considered sufficient for the current Celestial display.

---

# 27. Future Celestial Independence

The current Celestial Service receives:

- sunrise;
- sunset;
- moonrise;
- moonset;
- moon phase;

from Weather data.

This is acceptable for now.

In the future, Celestial calculations could become independent of the Weather provider by using:

- latitude;
- longitude;
- date;
- time.

The future conceptual architecture could therefore become:

```text
Beach Coordinates
       +
Current Date / Time
       ↓
Astronomical Calculation
       ↓
Celestial State
       ↓
Celestial Formatter
```

This is a future option only.

Do not redesign the Celestial system now merely to achieve this.

---

# 28. Current Analysis

## Future Capability — Not Now

Ocean-current information has independent value.

The current along the Portuguese coast normally has a prevailing direction, but this can occasionally reverse.

A reversal may be environmentally significant because it can correlate with:

- unusual water movement;
- unusual sea-surface temperature;
- potentially warmer water;
- other coastal conditions.

The application should eventually be able to recognize such changes.

This capability is intentionally deferred.

---

# 29. Automated Current Baselines

The user should not have to manually specify the normal current direction for every Beach.

That would create unnecessary maintenance and would not scale.

The future architecture should allow normal behavior to be derived from data.

A possible future process is:

```text
Historical / modeled current data
             ↓
Geographic coastal grouping
             ↓
Statistical baseline
             ↓
Normal current behavior
             ↓
Current Analysis
```

The baseline may eventually be defined at a meaningful coastal-sector level rather than independently for every Beach.

This is important because many Beaches share the same coastal current regime.

---

# 30. Current Anomaly and Reversal Model

A future Current Analysis module could evaluate:

- current direction;
- current velocity;
- expected direction;
- expected magnitude;
- seasonal variation;
- geographic variation;
- confidence.

It could produce a normalized assessment such as:

```text
normal
slightly unusual
unusual
reversed
strong reversal
```

The exact model should be determined from data later.

Raw current information remains Marine data.

Interpretation belongs to Current Analysis.

---

# 31. Warm-Water Signal

A future model may determine whether current behavior is associated with unusually warm coastal water.

Potential inputs could include:

- current direction;
- current anomaly;
- current velocity;
- sea-surface temperature;
- temperature anomaly;
- historical relationships;
- season;
- geographic location.

The application should distinguish a signal or prediction from certainty.

This capability is intentionally deferred.

---

# 32. Rip-Current Prediction

## Future Capability — Not Now

A future rip-current predictor is expected to combine multiple environmental inputs.

Potential inputs include:

- wave height;
- wave period;
- wave direction;
- swell characteristics;
- currents;
- wind;
- tide;
- Beach characteristics;
- geographic orientation;
- historical risk;
- possibly bathymetry or other coastal data.

The model should not live inside Marine Service.

The desired conceptual architecture is:

```text
Weather
Marine
Tide
Beach Characteristics
Historical / Baseline Data
          ↓
     Rip Risk Model
          ↓
     Risk Assessment
          ↓
     Rip Formatter
          ↓
     Rip Risk Card
```

This allows the model to evolve independently of the providers supplying its inputs.

---

# 33. Automated Rip-Prone Classification

The application should eventually avoid requiring manual classification of every Beach as "rip prone."

Where possible, risk characteristics should be derived from:

- coastal geometry;
- Beach orientation;
- historical observations;
- wave exposure;
- bathymetry;
- modeled conditions;
- geographic relationships.

A future generated dataset could contain derived Beach or coastal-sector characteristics.

This is a future capability.

No such model should be built during the current cleanup.

---

# 34. Generated Supporting Data

The architecture should eventually allow supporting datasets to be generated automatically.

Potential generated information includes:

- coastal sectors;
- normal current behavior;
- seasonal baselines;
- Beach classifications;
- model parameters;
- source metadata;
- derived geographic characteristics.

The desired long-term process is:

```text
Source / Historical Data
        ↓
Processing
        ↓
Generated Structured Data
        ↓
Application
```

rather than manually maintaining large numbers of Beach-specific rules.

---

# 35. Dashboard Architecture

`dashboard.js` is currently a coordinator.

It initializes:

- Beach Header;
- Alerts;
- Conditions.

It then updates those components.

This is a desirable responsibility.

The Dashboard should not become the owner of provider API calls.

The intended pattern is:

```text
Application Data
      ↓
Dashboard Coordinator
      ↓
Dashboard Components
```

---

# 36. Beach Header

`beachHeader.js` has a clear responsibility:

- initialize the Beach name;
- update the Beach name.

It should not:

- search for Beaches;
- fetch environmental data;
- manage refresh;
- own application state.

No major architectural expansion is currently required.

---

# 37. Alerts

`alerts.js` is currently a placeholder.

It displays:

```text
No active alerts
```

When actual alert data is introduced, it should become a presentation component consuming normalized alert data.

The future path should be:

```text
Alert Provider
      ↓
Alert Service
      ↓
Data Manager
      ↓
Application Data
      ↓
Alerts Widget
```

The widget itself should not retrieve alerts.

---

# 38. Display Ownership Conflict

`display.js` is currently a transitional module with mixed responsibilities.

It currently:

- finds the selected Beach;
- requests Weather;
- requests Marine;
- obtains Tide;
- constructs Dashboard data;
- updates Beach information in the DOM;
- assigns `currentDashboardData`.

Its stated responsibility, however, is display/presentation.

This creates an ownership conflict.

In particular, presentation code should not independently acquire environmental data while the Data Manager is intended to coordinate data acquisition.

This conflict should be resolved as part of the ownership cleanup.

It should not be solved by blindly rewriting `display.js` before the surrounding ownership relationships are understood.

---

# 39. Dashboard Data Ownership

`display.js` currently constructs:

```text
dashboardData = {
    beach,
    weather,
    marine,
    tide
}
```

and assigns it to:

```text
currentDashboardData
```

The application needs one authoritative owner for this state.

The long-term architecture should make it explicit whether:

- application state owns the data;
- Data Manager owns environmental datasets;
- Dashboard data is a derived application-state object;
- or another coordinator owns it.

The important rule is:

> **There should not be several competing sources of truth for the same environmental data.**

---

# 40. Conditions Page

The Conditions page is the next major functional cleanup target after ownership conflicts are addressed.

The intention is **not** to redesign it from scratch.

The intention is to:

- preserve existing functionality;
- remove ambiguous ownership;
- use existing services correctly;
- use existing formatters correctly;
- establish clean data paths;
- fix existing cards;
- and only then consider additional functionality.

The immediate goal is architectural cleanup, not feature expansion.

---

# 41. Conditions Card Priorities

The immediate cards to resolve are:

1. Wind
2. Marine temperature
3. Surf
4. Tide

The goal is to establish a clean path for each:

```text
Provider
   ↓
Service
   ↓
Normalized Data
   ↓
Data Manager / Application State
   ↓
Formatter
   ↓
Conditions Card
```

The cards should not know which provider supplied the data.

---

# 42. Formatter Ownership

Dedicated formatter modules already exist:

```text
weatherFormatter.js
marineFormatter.js
tideFormatter.js
celestialFormatter.js
```

Formatting logic should live in these modules where appropriate.

`conditions.js` should not accumulate duplicate formatting rules simply because it is convenient.

The distinction is:

```text
Conditions:
What information should be shown?

Formatter:
How should that information be represented?
```

---

# 43. Conditions Module

`conditions.js` may currently contain more responsibilities than the ideal architecture should eventually permit.

It may contain combinations of:

- DOM initialization;
- card rendering;
- Weather presentation;
- Marine presentation;
- Tide presentation;
- Celestial rendering;
- coastal-condition interpretation;
- formatting;
- layout calculations;
- display helpers.

The file should be cleaned incrementally.

It should not be rewritten wholesale merely to achieve theoretical purity.

Existing functionality should be preserved while individual responsibilities are clarified.

---

# 44. Background Module Versus Lifecycle

`background.js` currently changes CSS classes to represent visual environmental backgrounds.

This is a presentation concern.

It should not be confused with application lifecycle background/foreground handling.

These are separate concepts:

```text
background.js
    ↓
Visual background

Application lifecycle
    ↓
Foreground/background state
```

The current `background.js` is small and does not need expansion merely because lifecycle management exists elsewhere.

---

# 45. Responsive Architecture

## Decision

The application should move toward **one responsive presentation system**.

A separate mobile-specific stylesheet should not be required merely because the application is used on an iPhone.

The goal is:

```text
One HTML structure
       +
One responsive CSS architecture
       ↓
Desktop
Tablet
Phone
Standalone Web App
```

Responsive behavior should be handled through:

- flexible layout;
- CSS media queries where appropriate;
- relative sizing;
- component-specific responsive rules.

A separate mobile version of the application should not be created.

---

# 46. Mobile as a Constraint, Not a Separate Application

The application must work well as a standalone web app on iPhone.

That makes mobile an important design constraint.

It does not make mobile a separate architecture.

The same:

- application state;
- services;
- calculations;
- formatters;
- components;

should be used across screen sizes.

---

# 47. app.js

`app.js` is expected to be one of the larger future refactoring targets.

It may contain multiple responsibilities including:

- initialization;
- application state;
- DOM references;
- preferences;
- persistence;
- navigation;
- Beach selection;
- event handling;
- orchestration.

The goal is not to create a dozen tiny modules merely because decomposition is theoretically possible.

The goal is to identify genuine responsibility boundaries.

---

# 48. Safe app.js Decomposition

`app.js` should be decomposed incrementally.

For each candidate responsibility:

1. identify the existing code;
2. identify its callers;
3. identify dependencies;
4. identify side effects;
5. extract one coherent responsibility;
6. update references;
7. test;
8. confirm behavior;
9. proceed to the next responsibility.

The application should remain functional after each step.

This is particularly important because the project has evolved over time and contains working functionality that should not be accidentally broken.

---

# 49. Application Initialization

There should eventually be one understandable application initialization path.

Individual components may have initialization functions such as:

```text
initializeDashboard()
initializeBeachHeader()
initializeAlerts()
initializeConditions()
```

That is acceptable.

The important distinction is between:

```text
Component initialization
```

and:

```text
Application orchestration
```

The application should have one clear owner for the overall startup sequence.

---

# 50. Data Acquisition Versus Display

The long-term preferred relationship is:

```text
Application / Data Manager
          ↓
        Data
          ↓
     Presentation
```

rather than:

```text
Presentation
      ↓
Data Service
      ↓
Provider
```

Presentation code may indicate that data is needed, but the Data Manager should control the actual retrieval policy.

This becomes increasingly important as:

- automatic refresh;
- manual refresh;
- data-age display;
- multiple datasets;
- retries;
- lifecycle changes;

are introduced.

---

# 51. Offline and Failed-Refresh Behavior

The application should eventually behave sensibly when a provider cannot be reached.

The preferred principle is:

> **Retain useful previous data rather than destroying it merely because a newer request failed.**

The UI can indicate:

- data age;
- stale state;
- update failure.

This is preferable to replacing useful information with empty cards during a temporary network failure.

---

# 52. External Provider Replacement

External providers should be replaceable behind service boundaries.

For example:

```text
Weather Provider A
       ↓
Weather Service
```

can eventually become:

```text
Weather Provider B
       ↓
Weather Service
```

without requiring the Conditions page to know about the change.

Likewise:

```text
Open-Meteo
    ↓
Tide Service
```

can eventually become:

```text
IH S-104
    ↓
Tide Service
```

without rewriting Tide presentation.

This is one of the principal reasons for normalizing provider data.

---

# 53. Source Documentation

The project should maintain explicit source documentation for environmental datasets.

Where information is available, document:

- provider;
- dataset;
- endpoint or data type;
- source update interval;
- application refresh considerations;
- metadata availability;
- timestamp semantics;
- known limitations.

This documentation should be based on verified provider behavior rather than assumptions.

Its purpose is to prevent unexplained refresh values from becoming embedded in the application.

---

# 54. Future Source Metadata Architecture

Where source metadata exists, it should eventually travel with the dataset.

A conceptual normalized structure may contain:

```text
data
metadata
    source
    retrievedAt
    sourceUpdatedAt
    modelRun
    validFrom
    validTo
```

Not every dataset will necessarily contain every field.

Optional metadata is preferable to forcing every provider into an artificial identical structure.

---

# 55. Current Development Sequence

The current development sequence is deliberately conservative.

## Phase 1 — Ownership and Stability

First:

- inspect existing modules;
- identify ambiguous ownership;
- identify conflicting system calls;
- identify duplicate data requests;
- establish which module owns each responsibility;
- avoid unnecessary rewrites.

The objective is architectural clarity.

## Phase 2 — Conditions Cleanup

Next:

- clean the Conditions page;
- preserve existing functionality;
- remove duplicated logic;
- establish clean data paths;
- fix Wind;
- fix Marine Temperature;
- fix Surf;
- fix Tide;
- verify Celestial presentation.

## Phase 3 — Data Manager Completion

After ownership is stable:

- integrate datasets consistently;
- establish freshness policies;
- establish data-age information;
- complete retry behavior;
- complete duplicate-request protection;
- implement lifecycle-aware refresh;
- implement manual Update Now;
- implement safe automatic refresh;
- eventually expose user refresh preferences.

## Phase 4 — Future Enhancements

Only after the foundation is stable should we consider:

- current analysis;
- current anomaly detection;
- current reversal detection;
- warm-water signals;
- rip-current prediction;
- automated Beach/coastal baselines;
- improved tide source;
- advanced celestial calculations;
- other environmental interpretation.

---

# 56. Explicitly Deferred

The following capabilities have been discussed but are intentionally **not being implemented now**.

## Tide

- migration from Open-Meteo to IH S-104;
- final tide datum/offset reassessment.

## Current

- automated normal-current baselines;
- current anomaly analysis;
- current reversal detection;
- warm-water prediction based on current behavior.

## Rip Risk

- rip-prone Beach classification;
- rip-current prediction;
- automated rip-risk modeling.

## Celestial

- independent astronomical calculations;
- substantially more advanced astronomical modeling;
- expanded sky visualization.

## Data Infrastructure

- historical baseline infrastructure;
- automatically generated environmental supporting tables;
- automated coastal-sector classification.

## Platform

- native iOS application;
- native Android application.

These capabilities remain architecturally anticipated but deliberately deferred.

---

# 57. Architectural Safeguards

Before adding code, ask:

### Ownership

> Which module owns this responsibility?

If the answer is unclear, clarify ownership before adding code.

### Data acquisition

> Is this module obtaining data that another module already owns?

If yes, investigate before adding another request.

### Provider dependency

> Does this code know which external provider supplied the data?

If presentation code knows the provider, the boundary may be wrong.

### Derived analysis

> Is this a raw observation or an interpretation of observations?

Raw observations belong to services.

Interpretations belong to analysis.

### Refresh

> Is this code deciding when to fetch data?

Refresh decisions belong to the Data Manager.

### Presentation

> Is this code deciding how information is displayed?

That belongs to presentation/formatting.

### Extensibility

> Will adding another Beach require new application logic?

If yes, determine whether the requirement can instead be represented as domain data or derived from existing information.

### Future functionality

> Are we implementing a future feature now merely because we have discussed it?

If yes, defer it unless it is necessary for the current architecture.

---

# 58. Most Important Architectural Boundaries

The following distinctions should remain especially clear:

```text
Domain
  ≠
Environmental Data


Environmental Data
  ≠
Derived Analysis


Data Acquisition
  ≠
Presentation


Refresh Policy
  ≠
Provider API Logic


Celestial Calculation
  ≠
Celestial Rendering


Marine Data
  ≠
Current Analysis


Tide Data
  ≠
Marine Presentation


Application Lifecycle
  ≠
Visual Background
```

These boundaries matter more than the precise number of JavaScript files.

---

# 59. Development Method

Because this application is already functioning and has evolved through many iterations, architectural improvement should be incremental.

For each change:

1. identify the current behavior;
2. identify the intended ownership;
3. make the smallest coherent change;
4. test immediately;
5. verify the browser console;
6. verify the affected UI;
7. only then proceed.

Do not combine several architectural changes simply because they are conceptually related.

For example, separating Tide from Marine does not require simultaneously implementing IH S-104.

Likewise, designing for future Current Analysis does not require implementing Current Analysis.

This reduces the chance that an architectural cleanup breaks unrelated working functionality.

---

# 60. Working Rule for Future Conversations

When development resumes after an interruption, this document should be consulted before making architectural changes.

If a new requirement appears to conflict with something recorded here, do not silently override the earlier decision.

Instead determine whether:

1. the old decision is still appropriate;
2. the new requirement changes the architecture;
3. the roadmap should be updated before code changes are made.

Architectural decisions should be recorded when they become significant enough that forgetting them would cause future rework.

The roadmap should therefore evolve along with the application.

---

# 61. Final Architectural Principle

The goal is not to create the most abstract architecture possible.

The goal is to create an architecture that remains understandable as Praias de Portugal grows.

The application should be able to evolve from:

```text
Beach
  ↓
Weather / Marine / Tide
  ↓
Conditions
```

into:

```text
Beach
  ↓
Environmental Data
  ↓
Derived Environmental Intelligence
  ↓
User-facing Information
```

without requiring the original foundation to be discarded.

The future Current Analysis model should be able to consume Marine data without taking ownership of Marine.

The future Rip Risk model should be able to consume Weather, Marine, Tide, and Beach information without taking ownership of those systems.

The future IH S-104 Tide Service should replace Open-Meteo without requiring the Tide card to know about the change.

A new Beach should be added primarily through domain data rather than new application code.

The Celestial system should be able to become more independent in the future without requiring the Conditions page to be redesigned.

The refresh system should be able to become more sophisticated without allowing individual components to create uncontrolled network activity.

Most importantly:

> **Architectural flexibility should come from clear boundaries, not from implementing every future feature in advance.**

And:

> **Whenever a future capability is discussed but deliberately deferred, its architectural implications should be recorded here so that the reasoning does not have to be reconstructed later.**

> **Whenever a future capability is discussed but deliberately deferred, its architectural implications should be recorded here so that the reasoning does not have to be reconstructed later.**
62. Celestial Rise and Set Ownership
Sun and Moon rise/set information are related concepts, but they are not interchangeable data.
The application should treat them as separate celestial properties:
```text
Sun
    sunrise
    sunset

Moon
    moonrise
    moonset
    moon phase
```
The current Weather Service already supplies these values separately, and the Celestial Service should preserve that distinction.
The Celestial Service should therefore not use a generic pair such as:
```text
rise
set
```
for both objects without explicitly identifying which celestial body the values belong to.
The intended conceptual state remains:
```text
celestialState

    sun
        isVisible
        position
        sunrise
        sunset

    moon
        isVisible
        position
        moonrise
        moonset
        phase
        illumination
        phaseName
```
This separation prevents ambiguity when the Sun and Moon are simultaneously relevant.
It also allows the Moon to be above the horizon when the Sun is below it, and vice versa.
No new external service is required merely to achieve this separation.
---
63. Celestial Visibility Intervals
Sun visibility and Moon visibility should be calculated independently.
The Sun normally has a same-day interval:
```text
sunrise → sunset
```
The Moon may have an interval that crosses midnight:
```text
moonrise → midnight → moonset
```
The Celestial Service should therefore use a visibility test appropriate to each body's actual rise/set interval.
A future implementation must not assume that every celestial interval is a same-day interval.
The existing conceptual distinction is:
```text
Sun:
    now between sunrise and sunset

Moon:
    now between moonrise and moonset
    including intervals crossing midnight
```
This is a service-layer calculation.
The formatter should not determine celestial visibility itself.
---
64. Celestial Position Model
The Sun and Moon should each have an independently calculated position.
The current abstract position model is intentionally simple:
```text
rise
  ↓
position along arc
  ↓
set
```
It is not intended to represent a physically exact azimuth/elevation model.
The current visual representation should therefore be understood as an abstract sky-position graphic.
The architecture should nevertheless allow the calculation to become more sophisticated later.
A future implementation may use:
latitude;
longitude;
date;
time;
astronomical calculations;
azimuth;
elevation;
lunar phase;
and other astronomical parameters.
That future precision should be introduced inside the Celestial Service rather than forcing presentation code to understand astronomy.
---
65. Celestial Graphic Responsibility
`celestialFormatter.js` owns the visual representation of celestial state.
It should receive calculated state and convert that state into presentation.
Conceptually:
```text
Celestial Service
        ↓
Celestial State
        ↓
Celestial Formatter
        ↓
SVG / Visual Graphic
```
The formatter should not:
fetch Weather data;
calculate network refresh timing;
determine application state;
obtain sunrise/sunset data from an API;
or decide when astronomical calculations should occur.
If the Celestial Service eventually becomes independent of Weather, the formatter should not need to change merely because the source of the celestial state changed.
---
66. Celestial Recalculation Versus Weather Refresh
Celestial position is time-dependent even when the underlying source data has not changed.
This creates an important architectural distinction:
```text
Weather data:
    may require network retrieval

Celestial position:
    may require only local recalculation
```
For example, if the Weather dataset was retrieved at 14:00, the Sun's visual position at 14:10 should not require another Weather API request merely because ten minutes have elapsed.
The application may instead recalculate:
```text
existing celestial inputs
        +
current time
        ↓
new celestial state
```
The approximate ten-minute Celestial update interval therefore belongs to local presentation/state recalculation, not to the environmental data refresh policy.
---
67. Tide Height and Wave Height Are Distinct Concepts
Wave height and tide height are both measured in units of length, but they represent fundamentally different physical quantities.
They should therefore remain conceptually separate.
```text
Wave Height
    physical quantity:
    wave amplitude/height

Tide Height
    physical quantity:
    water level relative to a stated datum
```
They should not be represented internally as one generic application value merely because both may be displayed in metres or feet.
The application may use common conversion infrastructure where appropriate, but the domain properties should remain distinct.
For example:
```text
marine.waves.height

tide.currentHeight
tide.nextHigh.height
tide.nextLow.height
```
This is preferable to a single generic:
```text
height
```
whose meaning depends on context.
The same principle applies to future environmental measurements.
A shared physical unit does not imply a shared domain variable.
---
68. Height Unit Setting
The user-facing unit preference should represent the concept being configured rather than the implementation history of the variable.
The current setting is:
```text
waveHeightUnit
```
The setting is currently also used by tide formatting because tide heights and wave heights share the application's metric/imperial length preference.
This works functionally, but the naming is narrower than the actual responsibility.
The preferred long-term concept is therefore:
```text
heightUnit
```
with values such as:
```text
meters
feet
```
The corresponding UI control should eventually be:
```text
heightUnitSelect
```
rather than:
```text
waveHeightUnitSelect
```
This is a naming/architecture cleanup, not a change to the physical meaning of either measurement.
The important rule is:
> Wave height and tide height remain separate data properties even if they share one user-facing length-unit preference.
---
69. Height Unit Migration
The `waveHeightUnit` → `heightUnit` change should be treated as a controlled rename.
It should not be performed casually in one formatter while leaving the rest of the application using the old name.
When the migration is eventually performed, all references should be updated consistently, including:
application-state initialization;
preference controls;
preference loading;
preference saving;
preference event handlers;
marine formatters;
tide formatters;
any future height formatters;
documentation;
tests, if present.
A repository-wide search should be used to identify every reference before making the change.
The migration should be performed as one coherent change and tested immediately afterward.
No behavior change is intended by the rename.
The application should continue to mean:
```text
heightUnit = meters
```
or:
```text
heightUnit = feet
```
while retaining separate wave and tide data.
---
70. Height Conversion Ownership
The application should avoid duplicating the same length conversion logic in multiple modules.
The conceptual responsibility is:
```text
raw value
    ↓
height conversion
    ↓
formatted value
```
Both wave and tide formatters may use the same height conversion mechanism because the conversion itself is unit conversion rather than domain interpretation.
This does not make wave height and tide height the same data.
The distinction is:
```text
Shared:
    unit preference
    metres ↔ feet conversion

Separate:
    wave data
    tide data
    domain meaning
    formatting context
```
If a future environmental quantity requires a different datum or physical conversion, it should not automatically use the generic height conversion merely because its value is measured in metres.
---
71. Compass Direction Standard
The application should use a 16-point compass system consistently across the application.
The canonical directional labels are:
```text
N
NNE
NE
ENE
E
ESE
SE
SSE
S
SSW
SW
WSW
W
WNW
NW
NNW
```
The corresponding angular sectors are approximately 22.5° wide.
The same 16-point convention should be used for:
wind direction;
wave direction;
swell direction;
wind-wave direction;
ocean-current direction;
future directional environmental data.
This replaces inconsistent directional granularity between modules.
For example, Weather currently uses 16-point directions, while the existing Marine formatter uses 8-point directions.
The architectural target is to eliminate that inconsistency.
---
72. Direction Arrows
Directional arrows should follow the same 16-sector convention as compass labels.
The application should not use one directional resolution for the text label and another for the arrow.
Conceptually:
```text
direction in degrees
        ↓
16-point sector
        ├── compass label
        └── directional arrow
```
The exact visual glyphs may differ between wind, waves, and currents if presentation requires it, but the underlying directional sector should remain consistent.
---
73. Current Direction Semantics
The application must preserve the distinction between directions describing where something comes from and directions describing where something is going.
For example:
```text
Wind direction:
    meteorological convention
    direction the wind comes FROM

Wave direction:
    direction the waves come FROM

Ocean current direction:
    direction the current is moving TO
```
This distinction must not be lost during normalization or formatting.
The 16-point compass standard does not change these semantics.
It only standardizes directional representation.
A formatter should therefore not mechanically describe every direction as "from" or every direction as "toward."
---
74. Direction Normalization
Directional values should remain numeric internally whenever possible.
For example:
```text
wave.direction = 247
```
is preferable as application data to:
```text
wave.direction = "WSW"
```
The numeric value preserves precision and allows future calculations.
The formatter may then derive:
```text
247°
WSW
↙
```
from the numeric direction.
This is particularly important for future analysis such as:
current reversal;
wave exposure;
beach orientation;
directional mismatch;
swell alignment;
rip-risk modeling.
Presentation labels should therefore remain derived representations rather than replacing the underlying directional value.
---
75. Marine Direction Consistency
Marine Formatter should adopt the same 16-point directional resolution already used by Weather Formatter.
The existing conceptual difference should be removed:
```text
Weather:
    16 points

Marine:
    8 points
```
The desired state is:
```text
Weather:
    16 points

Marine:
    16 points

Tide:
    directional information only if applicable

Future Analysis:
    numeric degrees + 16-point presentation
```
This is a presentation consistency improvement and does not require changing the Marine Service's raw numeric direction data.
---
76. Unit Preferences Versus Domain Variables
Application preferences should describe how the user wants quantities displayed.
They should not redefine what the underlying data means.
For example:
```text
temperatureUnit
windSpeedUnit
heightUnit
```
are presentation preferences.
They do not change:
```text
weather.airTemperature
marine.waves.height
tide.currentHeight
marine.current.velocity
```
The services should continue returning normalized values in their defined internal units.
Formatters should apply the user's display preference when producing user-facing values.
This separation allows the same normalized dataset to support different user preferences without re-fetching data.
---
77. Normalized Internal Units
Environmental services should preferably return normalized numeric values in clearly defined internal units.
Examples:
```text
temperature:
    °C

wave height:
    metres

tide height:
    metres

wind speed:
    km/h

current velocity:
    provider-defined normalized unit,
    documented explicitly
```
User preferences should be applied after normalization.
This avoids provider-specific unit handling leaking into presentation or analysis.
It also prevents the application from needing to request the same data again merely because the user changes a display preference.
---
78. Preference Changes Must Not Trigger Environmental Retrieval
Changing a display unit should normally require:
```text
preference change
        ↓
application state update
        ↓
re-render / reformat
```
not:
```text
preference change
        ↓
network request
```
For example, changing:
```text
heightUnit:
    meters → feet
```
should not require another Marine or Tide API request.
The existing normalized numeric values are sufficient.
This principle should apply to:
temperature units;
wind-speed units;
height units;
future display-only preferences.
---
79. Current Code State Versus Architectural Target
The roadmap documents architectural intent, not a claim that the current code already conforms perfectly to that intent.
In particular, the current code may still contain:
duplicate helper functions;
transitional ownership;
display-layer data acquisition;
legacy setting names;
inconsistent directional resolution;
temporary tide-datum handling;
duplicated formatter logic.
These should be treated as known migration points rather than reasons to rewrite the application wholesale.
The preferred approach remains:
```text
identify
    ↓
change one coherent boundary
    ↓
test
    ↓
verify
    ↓
continue
```
---
80. Current Audit Priorities
Before making broad architectural changes, the application should be audited for the following:
Data acquisition ownership.
Application-state ownership.
Duplicate environmental requests.
Refresh control.
Tide data and datum handling.
Celestial Sun/Moon separation.
Height-unit naming.
Directional resolution.
Formatter duplication.
Conditions-page ownership.
Display-layer dependencies.
Script loading order.
Initialization sequence.
Error handling and stale-data behavior.
The audit should distinguish between:
```text
architectural problem
```
and:
```text
working code that merely could be cleaner
```
Only the former necessarily requires immediate intervention.
---
81. Audit Before Rename
The `waveHeightUnit` setting should not be renamed merely because `heightUnit` is architecturally cleaner.
The rename should occur after the audit confirms:
where the setting is initialized;
where it is read;
where it is written;
which controls depend on it;
which formatters depend on it;
whether any other modules depend on it;
and whether the current value is persisted.
The goal is to avoid introducing a naming cleanup that accidentally becomes a behavioral change.
Once the audit is complete, the rename can be performed as a small, repository-wide, mechanically verifiable change.
---
82. Architectural Interpretation of the Current Marine/Tide Relationship
The fact that Tide currently derives its data from Marine data does not mean Tide and Marine must be the same architectural responsibility.
The important distinction is between:
```text
source provider
```
and:
```text
application service boundary
```
A single provider may supply several datasets.
Therefore:
```text
Open-Meteo
    ├── Marine Service
    └── Tide Service
```
remains architecturally preferable to treating Tide as merely a formatting operation on Marine.
This allows the provider to change independently for either dataset later.
---
83. Architectural Interpretation of Celestial Data
Likewise, the fact that Weather currently supplies:
sunrise;
sunset;
moonrise;
moonset;
moon phase;
does not make celestial information fundamentally part of Weather presentation.
Weather is currently a convenient source of astronomical inputs.
Celestial Service owns the interpretation of those inputs.
The future possibility remains:
```text
Beach Coordinates + Time
            ↓
     Celestial Service
            ↓
      Celestial State
```
No immediate migration is required.
---
84. Preserve Working Behavior During Architecture Work
The application has already accumulated working behavior through iterative development.
Architectural cleanup must therefore be conservative.
A change should not be considered successful merely because the new code looks cleaner.
It must also preserve intended existing behavior.
After each meaningful change, verify:
application startup;
Beach selection;
Weather display;
Marine display;
Tide display;
Celestial display;
unit preferences;
responsive layout;
browser console;
and any affected navigation.
If a cleanup breaks an unrelated feature, stop and resolve that regression before continuing.
---
85. Documentation as an Architectural Control
This roadmap should be updated when a decision becomes important enough that forgetting it would create future rework.
Examples include:
choosing a data provider;
changing service ownership;
changing a normalized data structure;
defining unit semantics;
defining directional semantics;
deciding when data is refreshed;
deciding how stale data is handled;
deliberately postponing a migration;
establishing a future analysis boundary.
The roadmap should not become a changelog containing every small implementation detail.
Its purpose is to preserve architectural decisions and reasoning.
---
86. Immediate Next Step After This Roadmap Update
The immediate next step is audit, not broad refactoring.
The audit should establish the actual current state of:
```text
app.js
data.js
weatherService.js
marineService.js
tideService.js
weatherFormatter.js
marineFormatter.js
tideFormatter.js
celestialService.js
celestialFormatter.js
display.js
conditions.js
dashboard.js
browse.js
preferences.js
background.js
beachHeader.js
alerts.js
```
The audit should compare actual ownership with the architectural targets recorded in this document.
Only after that comparison should code changes be selected.
In particular:
```text
Do not rename waveHeightUnit yet.

Do not split additional services yet.

Do not implement Current Analysis yet.

Do not implement IH S-104 yet.

Do not implement advanced astronomical calculations yet.

Do not redesign the application wholesale.
```
The immediate objective is to understand the existing system accurately enough to make the next small change safely.
---
87. Architectural Decisions Established During the Current Audit
The following decisions are now considered established architectural direction:
Height
Wave height and tide height remain separate domain quantities.
They may share a single user-facing `heightUnit` preference.
Direction
The application uses a 16-point compass system consistently.
Numeric degrees remain the underlying directional data.
Celestial
Sunrise/sunset and moonrise/moonset remain separate properties.
Sun and Moon visibility and position are calculated independently.
Tide
Tide remains a separate service boundary even while Open-Meteo supplies its current source data.
Refresh
Local celestial recalculation is distinct from network environmental refresh.
Analysis
Current anomaly, reversal, warm-water interpretation, and rip-risk modeling remain future analysis responsibilities rather than Marine Service responsibilities.
Refactoring
Architectural changes are performed incrementally and tested after each coherent change.
---
88. Final Rule for Architectural Changes
When considering a proposed change, ask two questions:
> **Does this make the current system clearer and safer?**
and:
> **Does it preserve the ability to evolve later without unnecessary rewriting?**
If the answer to both is yes, the change is probably aligned with the architecture.
If a change improves theoretical elegance but introduces unnecessary risk to working functionality, defer it.
The architecture of Praias de Portugal should be allowed to mature incrementally.
The objective is not architectural perfection.
The objective is a system whose boundaries remain understandable, whose data has clear ownership, whose presentation remains replaceable, and whose future environmental intelligence can be added without dismantling the foundation.
---


# END OF ARCHITECTURE ROADMAP
