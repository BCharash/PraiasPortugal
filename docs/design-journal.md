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