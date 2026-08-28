# DJ001 — Beach Complexes are Geographic Abstractions

**Date:** 2026-07-29

## Decision

Introduce the concept of a **Beach Complex** as a first-class domain object.

A Beach Complex is a continuous stretch of coastline that can ordinarily be traversed on foot without crossing a significant natural or human-made barrier.

Beach Complexes are a conceptual abstraction defined by **Praias de Portugal**. They are not official Portuguese administrative entities.

A Beach Complex contains one or more named Beaches.

Examples:

- Praia de Santa Rita
  - Praia de Santa Rita Norte
  - Praia de Santa Rita Sul

- Santa Cruz
  - Praia da Física
  - Praia do Centro
  - Praia Formosa

## Motivation

During development it became clear that Portugal officially recognises individual beaches, but does not generally define larger groupings that correspond to how visitors experience continuous stretches of coastline.

A visitor walking along the shoreline often moves seamlessly between multiple named beaches without recognising any meaningful transition. These continuous stretches of coastline share common environmental characteristics while individual beaches retain their own facilities and services.

Environmental information is naturally associated with the Beach Complex, including:

- Weather
- Marine forecast
- Tide predictions
- Sea temperature
- General coastal conditions

Individual Beaches remain the operational units responsible for visitor services, including:

- Lifeguards
- Swimming areas
- Restaurants
- Snack bars
- Parking
- Accessibility
- Toilets
- Beach support infrastructure

This distinction reflects both the physical geography of the coastline and how visitors experience beaches.

## Consequences

The domain model now distinguishes between two different concepts:

- **Beach Complex** — a geographic abstraction representing a continuous coastline.
- **Beach** — an individual named public beach within that coastline.

To support this separation, the application stores the concepts independently.

Beach Complexes and Beaches are stored as separate entity sets linked by explicit relationships. The current implementation represents these using separate data files, but the separation is an architectural property rather than an implementation detail.

This architecture separates relationships from entities, reduces duplication, and allows Beaches to evolve independently of Beach Complexes.

Future information such as facilities, accessibility, water quality, photographs, webcams, and points of interest will belong to individual Beaches, while environmental information will belong to Beach Complexes.

## Alternatives Considered

### Flat list of Beaches

A single list of Beaches without Beach Complexes was considered.

This was rejected because environmental information such as weather, tides, and marine forecasts would need to be duplicated across neighbouring beaches that share identical conditions.

### Nested Beaches inside Beach Complexes

Embedding complete Beach objects inside Beach Complexes was considered.

This was rejected because Beaches are independent real-world entities. Storing them independently avoids duplication, allows them to be referenced by multiple datasets, and cleanly separates entities from relationships.

## Status

Accepted


# DJ002 — Domain Entities are Normalized

**Date:** 2026-07-29

## Decision

Represent each domain concept as an independent entity with its own identity.

Beach Complexes and Beaches are stored independently and connected through explicit relationships rather than by embedding one inside the other.

## Motivation

Beach Complexes and Beaches represent fundamentally different concepts.

A Beach Complex describes a continuous geographic feature of the coastline, while a Beach represents an individual named public beach with its own facilities, services, and operational characteristics.

Treating these as independent entities avoids duplication, preserves the identity of each concept, and allows them to evolve independently as the application grows.

The architecture also follows the principle that entities should be modeled independently from the relationships that connect them.

## Consequences

Each Beach has a unique identity independent of its Beach Complex.

Relationships between Beach Complexes and Beaches are represented explicitly rather than by nesting complete Beach objects.

This allows future datasets—such as photographs, accessibility information, Blue Flag status, webcams, historical information, environmental monitoring, and user-generated content—to reference Beaches directly without duplicating data.

The storage mechanism may change over time, but the normalized domain model remains unchanged.

## Alternatives Considered

### Nested Beach objects

Embedding complete Beach objects inside Beach Complexes was considered.

This approach was rejected because it couples the lifecycle of Beaches to their parent Beach Complex, increases duplication, and makes future relationships with other datasets more difficult.

## Status

Accepted

# DJ003 — Dashboard Becomes the Primary User Interface

**Date:** 2026-07-30

## Decision

The Dashboard becomes the primary entry point to the application.

Rather than navigating through lists of beaches before viewing information, users should normally arrive immediately at a dashboard showing the current conditions for a beach.

The dashboard is designed to answer the question:

> "Should I go to this beach today?"

Navigation, search, and exploration become secondary activities.

## Motivation

Most users repeatedly visit the same beach or a small number of nearby beaches.

Opening directly to a useful dashboard minimizes interaction and allows the application to communicate meaningful information within a few seconds.

The application should optimize for immediate access to useful information rather than requiring navigation before displaying data.

Startup behaviour will eventually become configurable through user preferences.

Possible startup modes include:

- Last visited beach
- Home beach
- Beach selector
- Current location

## Dashboard Architecture

The Dashboard is composed of independent widgets.

Examples include:

- Beach Summary
- Alerts
- Weather
- Forecast
- Charts

Each widget has a single responsibility.

Widgets do not communicate directly with one another. They receive updates from the application through well-defined interfaces.

For example:

```
displayBeach()
    ├── updateDashboardBeachName()
    ├── updateWeatherWidget()
    ├── updateForecastWidget()
    ├── updateChartsWidget()
    └── updateAlertWidget()
```

This minimizes coupling between modules and allows widgets to evolve independently.

## Widget Design

The dashboard is composed of reusable widgets rather than a single monolithic page.

Metric displays such as:

- Air Temperature
- Sea Temperature
- Wind
- Surf Swell
- Tide
- UV Index

share a common visual structure.

These should eventually be implemented as reusable Metric Widgets populated with different data rather than as independent implementations.

This promotes consistency while minimizing duplicated code.

## User Experience Principles

The Dashboard should:

- Display useful information immediately.
- Minimize taps and navigation.
- Avoid unnecessary scrolling.
- Present high information density without appearing cluttered.
- Work equally well on mobile devices and desktop browsers.
- Present environmental conditions before detailed exploration.
- Allow progressive disclosure through interactive elements such as charts and tooltips.

## Consequences

The existing selection interface becomes an implementation detail rather than the primary user experience.

Information currently displayed elsewhere in the application will gradually migrate into Dashboard widgets until the dashboard becomes the principal interface.

Navigation views such as:

- Beach Selector
- Explorer
- Preferences
- About

become secondary views.

## Alternatives Considered

### Beach Selection as the primary interface

Opening directly to the Beach Selector was considered.

This was rejected because most users repeatedly visit the same beaches. Requiring navigation before displaying useful information introduces unnecessary interaction.

### Dashboard as a single monolithic page

Building the dashboard as one large page without internal widget boundaries was considered.

This was rejected because it tightly couples unrelated functionality, increases maintenance complexity, and makes future enhancements more difficult.

A widget-based architecture allows each portion of the dashboard to evolve independently while maintaining a consistent user experience.

## Status

Accepted

# DJ004 — Dashboard Metrics Support Composite Environmental Metrics

**Date:** 2026-07-31

## Decision

Dashboard metrics may display multiple related values rather than a single measurement.

Each metric presents one primary value together with zero or more secondary values that provide additional context for interpreting the measurement.

Examples include:

- Air
  - Current Temperature
  - Relative Humidity
  - Feels Like Temperature
  - Daily High / Low

- Wind
  - Current Speed
  - Gust Speed
  - Direction

- UV
  - Current UV Index
  - Daily Maximum UV Index

- Tide
  - Current Height
  - Rising / Falling
  - Next High or Low Tide

The primary value should remain immediately recognizable while secondary values provide additional information without requiring navigation to another screen.

## Motivation

Users make decisions based on environmental conditions rather than isolated measurements.

A single value often lacks sufficient context.

For example, air temperature is better interpreted when accompanied by relative humidity, apparent temperature, and the expected daily temperature range.

Displaying related information together increases information density while reducing navigation and supporting the Dashboard's goal of answering the question:

> "Should I go to this beach today?"

## Consequences

Dashboard widgets become capable of presenting multiple related measurements within a single logical metric.

Formatters remain responsible for formatting individual measurements rather than constructing complete dashboard layouts.

Widgets are responsible for presenting those formatted values.

This separation preserves modularity while allowing widgets to evolve independently.

Future metric enhancements can be added without changing the overall dashboard architecture.

Examples include:

- Wind Gusts
- Maximum UV Index
- Sunrise and Sunset
- Water Quality Indicators
- Swell Components
- Tide Predictions

## Alternatives Considered

### Single Value Metrics

Displaying only one value for each metric was considered.

This approach was rejected because it omits contextual information that users routinely consider when making beach decisions and would require additional navigation to obtain related data.

### Concatenated Text Strings

Combining all related information into a single formatted string was considered.

This approach was rejected because it mixes presentation with formatting, reduces flexibility, and complicates future enhancements such as user-selectable units and responsive layouts.

## Status

Accepted

# DJ005 — Dashboard Accessibility and Visual Hierarchy

**Date:** 2026-08-11

## Decision

The Dashboard visual design will prioritize readability and accessibility as
fundamental design requirements rather than treating accessibility as a later
enhancement.

The Dashboard must remain comfortably usable by users with color-vision
deficiency and reduced near-vision acuity, including under less-than-ideal
lighting conditions.

## Accessibility Principles

Color must not be the sole means of communicating information.

Important distinctions should remain understandable through a combination of:

- Text
- Position
- Labels
- Line style
- Icons
- Markers
- Contrast
- Color

The color palette should be selected and evaluated for compatibility with
protan color-vision deficiency.

Luminance contrast is more important than relying on differences in hue alone.

## Visual Hierarchy

Dashboard information should have a deliberate hierarchy.

Primary measurements should be visually dominant.

Secondary measurements should provide context without competing with the
primary value.

Examples include:

- Air temperature as the primary value, with humidity, feels-like
  temperature, and daily range as secondary information.
- Wind speed as the primary value, with gust speed and direction as secondary
  information.
- UV index as the primary value, with daily maximum and risk classification
  as secondary information.

This is consistent with DJ004's decision that dashboard metrics may contain
multiple related values.

## Typography

Font sizes should be chosen according to information hierarchy rather than
using a single global size.

Primary dashboard values should be substantially larger than labels and
secondary information.

Selectors and other interactive controls should remain comfortably readable.

The application should eventually support user-selectable display scaling so
that users can increase text size without requiring a redesign of individual
widgets.

## Charts

Charts must remain interpretable without depending solely on color.

Where multiple data series are displayed, visual distinctions should include
one or more of:

- Line style
- Line weight
- Markers
- Direct labels
- Explicit legends

Color may reinforce these distinctions but should not be their only mechanism.

## Consequences

Accessibility becomes part of the visual design system for Praias de Portugal.

Future Dashboard widgets should be evaluated against these principles before
being considered complete.

The existing Dashboard typography and color palette should be treated as a
starting point rather than a fixed standard.

Future visual refinement should establish a consistent application-wide
typography and color system that applies to:

- Dashboard
- Beach selector
- Settings
- Charts
- Alerts
- Navigation

## Status

Accepted

# DJ006 — Beach Complex Renamed Area

**Date:** 2026-08-18

## Decision

Rename the application concept **Beach Complex** to **Area**.

An Area represents a continuous or geographically coherent stretch of coastline used by *Praias de Portugal* as a grouping of one or more named Beaches.

The term **Area** is used throughout the application's user interface, domain terminology, data structures, and internal code rather than Beach Complex.

## Motivation

During development it became clear that **Beach Complex** was unnecessarily technical and potentially misleading as a user-facing concept.

The grouping represents a geographic area containing one or more named beaches. It is not an official Portuguese administrative designation and should not be confused with an administrative or regulatory entity.

**Area** is simpler, more intuitive, and better suited to the eventual Beach Selector interface.

The distinction between an Area and an individual Beach remains important:

- **Area** — a geographic grouping used to associate beaches sharing environmental conditions and other area-level information.
- **Beach** — an individual named beach with its own facilities, services, accessibility characteristics, and other beach-specific information.

## Consequences

The application's terminology and internal model will use **Area** rather than **Beach Complex**.

This includes:

- Data files
- Variables
- Functions
- Selectors
- Navigation and user interface terminology
- Documentation
- Future datasets and relationships

The underlying architectural principle remains unchanged: Areas and Beaches are independent entities connected through explicit relationships.

Environmental information such as weather, marine conditions, tides, and sea temperature remains associated with Areas, while beach-specific characteristics remain associated with individual Beaches.

## Alternatives Considered

### Retain Beach Complex

Rejected because the term is unnecessarily technical and does not accurately communicate the concept to users.

### Region

Rejected because Region already represents a higher-level geographic classification within the application.

### Location

Rejected because Location is too generic and could refer to either an Area or an individual Beach.

## Status

Accepted


# DJ007 — Global User-Adjustable Text Scaling

**Date:** 2026-08-18

## Decision

Introduce a global, user-adjustable text-size control accessible from the application's primary navigation.

The control uses a compact **A–A slider** with four discrete text-size settings:

- Small
- Normal
- Large
- Extra-large

The control is available from the primary navigation rather than being confined to Settings.

## Motivation

The Dashboard accessibility work established that typography must support users with different levels of visual acuity and that font sizes should reflect information hierarchy. DJ005 specifically identified user-selectable display scaling as a future requirement.

A global control is preferable to placing this preference only within Settings because text scaling affects the entire application and may need to be adjusted while viewing any page.

The compact A–A representation was chosen because it communicates the function without requiring a textual label and occupies minimal navigation space.

## Design

The control uses four discrete positions rather than continuous scaling.

The smallest and largest A markers visually represent the approximate lower and upper bounds of the available text sizes.

The slider is intentionally compact so that it can remain in the primary navigation on mobile devices.

The current implementation uses a 100px slider and applies the selected scale throughout the application.

Text scaling is applied globally while preserving the existing hierarchy between primary values, secondary values, labels, controls, and other interface elements.

## Interaction

The slider uses discrete detents corresponding to the four supported sizes.

The selected size is applied when the user finishes moving the control rather than continuously during touch movement.

This avoids repeated dashboard rendering and data refreshes while a user is dragging the control on a touch device.

This behavior is particularly important on mobile devices, where continuous layout changes during a finger drag can make the control difficult to operate.

## Consequences

Text scaling becomes an application-wide accessibility feature rather than a Settings-only preference.

The typography system must therefore support scaling without destroying the intended visual hierarchy.

Future refinement should ensure that:

- Primary measurements remain visually dominant.
- Secondary measurements remain subordinate.
- Navigation remains usable at the largest size.
- Charts, axes, labels, and other graphical text scale appropriately.
- Mobile layouts do not develop horizontal overflow.
- The selected size persists between application sessions.

The A–A control itself should remain accessible regardless of which application page is currently displayed.

## Alternatives Considered

### Text-size dropdown in Settings

Rejected because the control is less discoverable and requires navigating to Settings before the user can adjust readability.

### Continuous text scaling

Rejected because the application currently has four deliberate typography levels and a continuous scale could produce awkward intermediate sizes and inconsistent visual hierarchy.

### Continuous updating while dragging

Rejected because changing the entire application layout repeatedly during touch interaction causes visible reflow and makes precise slider manipulation difficult.

## Status

Accepted

# DJ008 — Conditions Panel CSS Refactor and Temperature Graphic

**Date:** 2026-08-21  
**Project:** Praias de Portugal  
**Focus:** Conditions panel architecture, CSS modularization, typography scaling, temperature-range graphic

---

## 1. Purpose of today's work

We returned to the Conditions panel work and first addressed the growing size of `styles.css`.

The original `styles.css` had grown to approximately 2,400 lines, making it increasingly difficult to manage safely. We decided to divide the CSS into functional modules before continuing visual refinement.

The Conditions panel itself is intended to be the dominant visual element of the Dashboard and eventually will contain:

- Current weather condition text
- Temperature range/current temperature
- Feels-like temperature
- Relative humidity
- UV index/current and daily maximum
- Celestial/weather graphic
- Sunrise
- Sunset
- Moon phase and illumination
- Eventually solar and lunar celestial arcs
- Eventually cloud-layer and fog/mist representation

The four lower Dashboard tiles (Wind, Sea, Tide, Surf) are **not being refined yet**.

---

## 2. Current CSS architecture

The CSS is now divided as follows:

```text
src/css/
├── base.css
├── layout.css
├── components.css
├── conditions.css
├── dashboard.css
└── styles.css

# DJ009 — Conditions Section Divided into Upper and Lower Panels

**Date:** 2026-08-22

**Project:** Praias de Portugal

**Focus:** Conditions Section architecture, Upper Conditions Panel, Lower Weather/Celestial Panel

---

## 1. Decision

The Dashboard Conditions Section is defined as two distinct visual panels:

1. **Upper Conditions Panel**
2. **Lower Weather/Celestial Panel**

The two panels are conceptually and architecturally independent.

The term **Conditions Section** refers to the complete combined area.

The term **Upper Conditions Panel** refers specifically to the compact environmental metrics displayed above the graphical weather/celestial area.

The term **Lower Weather/Celestial Panel** refers specifically to the graphical representation of the current sky, weather, sun, and moon.

This terminology should be used consistently in future design and development discussions.

---

## 2. Upper Conditions Panel

The Upper Conditions Panel uses a three-column layout.

### Left — Temperature

The temperature area contains:

- Daily minimum temperature
- Horizontal temperature-range bar
- Current temperature marker
- Daily maximum temperature
- Feels-like temperature below the range
- Relative humidity below the range

The current temperature marker should represent the current temperature's actual position within the daily minimum/maximum range.

Conceptually:

```text
minimum ───────────●────────── maximum
                         current temperature

                    Feels like
                    Relative humidity



I think this is the right level for the **design journal**: it captures the design decision and its consequences without trying to specify implementation details prematurely.

One thing I deliberately **did not specify** is exactly how we will implement the solar/lunar arcs, cloud layers, or the upper-panel grid. Those are implementation decisions we'll make later. The journal should preserve **what we want the application to mean and communicate**, without prematurely locking us into a particular CSS or JavaScript solution.

And this gives us a much better foundation for the next step: **we can redesign the Conditions Section around this architecture rather than continuing to repair the current positioning system.**

## Status

Accepted


