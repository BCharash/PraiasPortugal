# Architecture

## Purpose

This document describes the architectural organization of Praias de Portugal.

The architecture is intended to be simple, modular, and scalable. It separates domain concepts from application logic, presentation, and external services, allowing the application to evolve without major structural changes.

The architecture is intentionally independent of specific APIs, frameworks, databases, and implementation details.

---

# Architectural Principles

The architecture follows these principles:

- The Area is the central environmental domain object.
- Beaches are independent domain entities.
- Areas and Beaches are connected through explicit relationships.
- Domain concepts are independent of data providers.
- User Interface code is separated from business logic.
- Presentation is composed of reusable widgets.
- External services are isolated behind service modules.
- Each module has a single responsibility.
- State is managed centrally.
- Environmental information is associated with Areas.
- Beach-specific characteristics and services are associated with individual Beaches.
- The interface should adapt to available screen width without unnecessary duplication of layout rules.
- The application should remain understandable as it grows.

---

# Architectural Overview

The application is organized around Areas and the Beaches contained within them.

Area
  |
  +-- Weather
  +-- Fog / Mist Conditions
  +-- Marine Forecast
  +-- Tides
  +-- Sea Temperature
  +-- Water Quality
  |
  +-- Beaches
       |
       +-- Facilities
       +-- Accessibility
       +-- Lifeguard Information
       +-- Restaurants
       +-- Parking
       +-- Webcams
       +-- Points of Interest
       +-- Beach Characteristics
       +-- Beach-Specific Safety Information

An Area represents a continuous or geographically coherent stretch of coastline used by Praias de Portugal as a grouping of one or more named Beaches.

An Area is not an official Portuguese administrative designation and should not be confused with an administrative or regulatory entity.

Individual Beaches represent named public beaches within an Area and contain information specific to those locations.

Environmental information such as weather, fog or mist conditions, marine conditions, tides, and sea temperature is associated with the Area.

Beach-specific information such as facilities, accessibility, lifeguard services, physical characteristics, and other beach-specific services is associated with the individual Beach.

This separation minimizes duplication while accurately modelling how visitors experience Portugal's coastline.

---

# Environmental and Sky Model

Praias de Portugal should maintain a normalized environmental state from which different visual representations can be derived.

The detailed Conditions visualization and the simpler application-wide background should use the same underlying environmental state.

The environmental state combines two types of information.

## Astronomical Information

Astronomical information is calculated from the selected location and time.

Examples include:

- Sun position
- Moon position
- Moon phase
- Dawn
- Dusk
- Day and night state
- Stars

These elements should be calculated consistently from the same geographic and temporal context.

## Atmospheric Information

Atmospheric information is obtained from environmental observations and forecasts.

Examples include:

- Low cloud cover
- Mid-level cloud cover
- High-level cloud cover
- Fog and mist
- Rain
- Lightning
- Visibility
- Other relevant atmospheric conditions

The application should preserve the distinction between calculated astronomical information and forecast or observed atmospheric information.

## Visual Representations

The detailed Conditions visualization should use the environmental state to create a realistic representation of the sky.

The visualization may represent:

- The position of the Sun
- The position and phase of the Moon
- Dawn and dusk transitions
- Stars
- Different levels of cloud cover
- Fog and mist
- Rain
- Lightning
- Other relevant atmospheric conditions

The application-wide background should use the same environmental state but provide a simpler and less detailed atmospheric representation.

The detailed Conditions visualization and the application background should not independently calculate or interpret environmental conditions.

Conceptually:

Environmental State
       |
       +-------------------+
       |                   |
       v                   v
Detailed Conditions   Application Background
Realistic sky         Simple atmosphere

This approach ensures that different parts of the application present a consistent representation of the same environmental conditions.

---

# High-Level Architecture

                    User Interface
                           |
                           v
                Application Controller
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
   Domain Model      Application Services   External Providers

---

# Layers

## User Interface

Responsible for presenting information to the user.

The User Interface consists of independent Views.

Examples include:

- Dashboard
- Beach Selector
- Explorer
- Preferences
- About

Each View is composed of independent Widgets.

Examples include:

- Beach Summary Widget
- Alert Widget
- Weather Widget
- Forecast Widget
- Marine Conditions Widget
- Conditions / Sky Widget
- Charts Widget
- Beach Information Widget

Widgets have a single responsibility and should communicate through the Application Controller rather than directly with one another.

The User Interface should contain as little business logic as possible.

---

## Application Controller

Coordinates the application.

Responsibilities include:

- Application startup
- Selecting the initial View
- Navigation
- State management
- Selecting the active Area
- Selecting the active Beach
- Coordinating Application Services
- Updating User Interface widgets
- Persisting user preferences

The Application Controller contains the workflow of the application but does not contain domain-specific business logic.

---

## Domain Model

Represents the concepts within Praias de Portugal.

Examples include:

- Region
- Municipality
- Area
- Beach
- Forecast
- Fog / Mist Conditions
- Marine Conditions
- Tide
- Sea Temperature
- Water Quality
- IPMA Alert
- Beach Safety Information
- Point of Interest

The Domain Model contains no knowledge of APIs, presentation, or user interface implementation.

The Domain Model should distinguish clearly between information that belongs to an Area and information that belongs to an individual Beach.

---

## Application Services

Application Services obtain, process, or transform information.

Examples include:

- Weather Service
- Marine Forecast Service
- Tide Service
- Water Quality Service
- IPMA Alert Service
- Fog / Mist Service or Forecast Processing
- Astronomical Service
- Beach Service
- GPS Service
- Translation Service

Services convert external information into application/domain data.

Application Services are independent of the User Interface.

### Beach-Specific Safety

Potential future services may provide or calculate beach-specific safety information, including rip-current risk.

Rip-current information should be treated as potentially Beach-specific rather than automatically applying it to an entire Area.

A rip-current prediction or risk assessment should only be presented at a level of precision supported by reliable data or an appropriate predictive model.

---

## External Providers

Examples include:

- Weather APIs
- Marine Forecast APIs
- Tide APIs
- IPMA
- Government datasets
- OpenStreetMap
- Browser Geolocation API

The remainder of the application should never depend directly upon provider-specific formats.

Replacing one provider with another should require changes only within the corresponding Service.

---

# Data Flow

External Provider
        |
        v
Application Service
        |
        v
Normalized Application Data
        |
        v
Domain Model
        |
        v
Application Controller
        |
        v
User Interface

External provider-specific field names, structures, and units should be normalized within the appropriate Application Service before being used by the User Interface.

The User Interface should not depend directly on an external provider's data structure.

---

# Application State

The application maintains a small amount of shared state.

Initially this consists of:

- Active Area
- Active Beach
- Last Visited Beach
- Home Beach
- Startup Preference
- Language
- Units
- User Preferences

Additional shared state should only be introduced when necessary.

Application state represents the current condition of the application and provides the information required by User Interface widgets.

The application should avoid storing information that can be derived from the Domain Model or Application Services.

---

# User Interface Philosophy

The Dashboard is the primary user experience.

The application should normally open directly to useful environmental information rather than requiring navigation.

Navigation, search, and exploration are secondary activities.

The Dashboard is composed of independent Widgets.

Widgets are responsible only for displaying information.

Widgets receive updates through the Application Controller rather than communicating directly with one another.

This architecture minimizes coupling while allowing the interface to evolve incrementally.

---

# Responsive Layout Philosophy

The User Interface should adapt to the available screen width as naturally as possible.

Responsive behavior should normally be achieved through the layout system rather than through independent positioning rules for individual widgets.

In particular:

- Parent containers should control the layout of their children.
- Grid and Flexbox should be preferred for structural layout.
- Individual widgets should not independently position themselves unless they represent a genuinely coordinate-based graphic.
- Absolute positioning should be reserved primarily for graphical elements whose position represents a meaningful coordinate.
- Media queries should be used when the design itself changes, rather than as a collection of corrections for individual elements.
- User-adjustable text scaling should be supported without requiring separate versions of each widget.

The responsive architecture should allow the Dashboard to adapt from desktop displays to mobile displays without creating unnecessary duplicate layout systems.

---

# Domain Entity Separation

A Beach should contain information that belongs specifically to that Beach.

Examples include:

- Facilities
- Accessibility
- Lifeguard information
- Physical characteristics
- Beach-specific services
- Beach-specific safety information

A Beach should not unnecessarily contain live environmental information such as:

- Current weather
- Wind
- Marine conditions
- Sea temperature
- Tide conditions
- Fog or mist
- Environmental alerts

Such information should remain associated with the appropriate Area or environmental data service.

This prevents the Beach entity from becoming a large object containing unrelated and frequently changing information.

---

# Future Data Access

Beach data may continue to be stored as JSON.

If the size or complexity of the national beach dataset eventually makes it useful, a repository or other data-access layer may be introduced between the User Interface and the underlying data source.

This is a future option rather than a current requirement.

The purpose of such a layer would be to allow the underlying storage mechanism to change without requiring unrelated User Interface code to change.

---

# Future Modules

As the application grows, responsibilities may be separated into modules such as:

- Beach Service
- Weather Service
- Marine Forecast Service
- Tide Service
- Water Quality Service
- IPMA Alert Service
- Fog / Mist Forecast Service
- Astronomical Service
- Sky / Atmosphere Model
- GPS Service
- Translation Service
- Preferences Service
- Media Service
- Beach Safety Service

The exact implementation remains intentionally flexible.

---

# Design Goals

The architecture should remain:

- Simple
- Modular
- Reusable
- Testable
- Scalable
- Independent of external providers
- Responsive
- Easy to understand

Whenever possible, new features should extend the existing architecture rather than require architectural redesign.

The architecture should encourage incremental development, allowing new functionality to be introduced as independent modules or widgets without disrupting existing functionality.

---

# Platform Independence

Praias de Portugal should be designed so that its domain model, application logic, data contracts, and service boundaries are independent of any particular presentation platform.

The initial web application is one client of the architecture rather than the architecture itself.

Future versions may include native applications for:

- Web — HTML, CSS, and JavaScript
- iOS — Swift and SwiftUI
- Android — Kotlin and Jetpack Compose

The web, iOS, and Android applications do not need to share implementation code.

They should, however, share the same fundamental concepts, including:

- Domain entities
- Application state concepts
- Data structures and contracts
- Service responsibilities
- Data freshness and update policies
- Environmental and astronomical concepts
- Application behavior and business rules

Platform-specific presentation should remain appropriate to each platform.

For example, the web application may use HTML and CSS to present the Conditions visualization, while an iOS application may use SwiftUI and an Android application may use Jetpack Compose.

Platform-specific implementation should not unnecessarily influence the Domain Model or Application Services.

The architecture should therefore allow the same underlying application concepts to be implemented independently on Web, iOS, and Android without requiring the redesign of those concepts for each platform.

This principle is particularly important for major shared systems such as:

- Environmental data
- Automatic data refresh and freshness
- Astronomical calculations
- Sky and atmospheric state
- Beach and Area relationships
- Alerts
- Forecast periods
- User preferences
- Language support

The goal is not to make every platform identical.

The goal is to ensure that each platform can provide an appropriate native user experience while remaining a client of the same underlying application architecture and concepts.

---

# Data Management and Refresh Architecture

Praias de Portugal should maintain current environmental data while minimizing unnecessary network activity, battery consumption, and external service usage.

The application should never rely on uncontrolled or independent polling by individual widgets or services.

A central Data Manager should coordinate data acquisition and refresh.

---

## Data Manager Responsibilities

The Data Manager is responsible for coordinating the acquisition and freshness of external environmental data.

Its responsibilities include:

- Maintaining the current status of managed datasets
- Tracking the last successful update
- Determining whether data is stale
- Applying refresh policies
- Coordinating requests to Application Services
- Preventing duplicate requests
- Supporting automatic refresh
- Supporting manual "Update Now" requests
- Handling failed requests
- Applying retry and backoff policies
- Reporting data freshness and update status
- Responding appropriately when the application becomes inactive or active

The Data Manager should not:

- Manipulate the User Interface
- Format values for display
- Determine how data is visually represented
- Contain provider-specific API logic
- Replace the individual Application Services

---

## Data Refresh Flow

The intended flow is:

Application
    |
    v
Data Manager
    |
    +-- Refresh Policy
    |
    +-- Request Guard
    |
    +-- Update Status
    |
    v
Application Service
    |
    v
External Provider
    |
    v
Normalized Application Data
    |
    v
Application State
    |
    v
User Interface

The Data Manager coordinates when data should be obtained.

The Application Service remains responsible for obtaining and normalizing the data from its external provider.

---

## Refresh Policies

Different datasets may have different natural update intervals.

Examples include:

- Weather
- Marine Forecast
- Tide Predictions
- Sea Temperature
- UV Index
- IPMA Alerts

The refresh interval should reflect the characteristics and update frequency of the underlying source rather than applying one universal interval to all datasets.

Refresh policies should define, as appropriate:

- Normal refresh interval
- Minimum permitted refresh interval
- Maximum acceptable data age
- Retry interval after failure
- Maximum retry frequency
- Behavior when the application becomes active again

The exact values should be determined when the authoritative providers and their update characteristics are established.

---

## Request Safety

Automatic updating must be conservative by default.

The Data Manager should include safeguards against excessive network activity.

These safeguards include:

- A minimum refresh interval
- One active request per dataset at a time
- Prevention of duplicate requests
- Prevention of cascading refreshes
- Exponential or otherwise increasing backoff after repeated failures
- A maximum retry frequency
- Protection against repeated manual refresh requests
- Cancellation or suppression of unnecessary timers
- Cleanup of scheduled refresh operations when the application becomes inactive

If there is uncertainty about whether a dataset needs refreshing, the safer behavior is to avoid making the request.

Slightly stale information is preferable to uncontrolled network activity.

---

## Automatic Refresh

Automatic refresh should be coordinated centrally by the Data Manager.

Individual widgets should not independently create their own polling loops.

For example:

    Data Manager
         |
         +-- Weather refresh policy
         |
         +-- Marine refresh policy
         |
         +-- Tide refresh policy
         |
         +-- IPMA alert refresh policy

This prevents multiple widgets from requesting the same information independently.

---

## Application Lifecycle

The application should distinguish between active and inactive states.

When the application becomes inactive, unnecessary automatic refresh activity should be stopped or reduced.

When the application becomes active again, the Data Manager should not automatically refresh every dataset.

Instead, it should:

1. Determine how long each dataset has been since its last successful update.
2. Compare that age with its refresh policy.
3. Refresh only datasets that are stale or otherwise require updating.
4. Leave sufficiently fresh datasets unchanged.
5. Apply all normal request-safety protections.

Conceptually:

    Application becomes active
             |
             v
       Check data age
             |
       +-----+-----+
       |           |
    Fresh         Stale
       |           |
       v           v
     Keep       Refresh
       |           |
       +-----+-----+
             |
             v
       Update status

Returning to the application therefore means "check whether an update is needed" rather than "download everything again."

This behavior should be preserved across Web, iOS, and Android implementations, while the platform-specific mechanisms used to detect lifecycle changes may differ.

---

## Manual Update

The application should provide a user-accessible "Update Now" function.

Manual updates should still pass through the Data Manager and therefore remain subject to request-safety protections.

Repeated activation of "Update Now" should not create simultaneous or excessive requests.

The Data Manager should determine which datasets actually require updating and should prevent redundant requests.

---

## Update Status

The Data Manager should maintain observable status for each managed dataset.

At minimum, status should be capable of representing:

- Last successful update
- Current update state
- Whether data is considered fresh
- Whether data is stale
- Next scheduled update
- Most recent error
- Retry state

This information should be available to the User Interface.

The purpose is to allow the application to communicate data freshness clearly to the user.

Examples include:

    Weather updated 4 minutes ago

    Marine conditions updated 18 minutes ago

    IPMA alerts checked 3 minutes ago

    Next weather update in 11 minutes

When a service repeatedly fails, the application should be able to communicate that condition rather than silently attempting requests indefinitely.

---

## Celestial Updates

Astronomical information differs from externally retrieved environmental data.

Sun position, Moon position, Moon phase, dawn, dusk, and related astronomical information can be calculated locally from the selected geographic location and time.

Celestial calculations therefore do not require network requests.

The celestial state should be recalculated at a fixed application-defined interval while the relevant view is active.

When the application becomes inactive, unnecessary calculation activity should be reduced or stopped.

When the application becomes active again, the celestial state should be recalculated from the current time rather than simply continuing from the previous state.

The celestial update mechanism should remain independent of external environmental data refresh.

---

## Error Handling and Backoff

A failed data request should not cause immediate repeated retries.

After a failure, the Data Manager should wait before attempting the request again.

Repeated failures should progressively increase the delay between attempts, subject to a defined maximum.

Successful retrieval should reset the failure state and return the dataset to its normal refresh policy.

Errors should be recorded in the dataset's observable update status.

The User Interface may present an appropriate indication of the failure without exposing unnecessary provider-specific technical details.

---

## Data Freshness as Application State

Data freshness should be treated as information about the current application state.

The application may therefore distinguish between:

- Fresh data
- Aging data
- Stale data
- Updating data
- Update failed
- Update unavailable

The exact thresholds for these states should be determined by the refresh policy for each dataset.

This allows the application to communicate the reliability and age of displayed information without requiring individual widgets to implement their own freshness logic.

---

## Platform Independence

The concepts of data freshness, refresh policy, request safety, lifecycle behavior, and update status should be platform-independent.

Web, iOS, and Android implementations may use different mechanisms for:

- Timers
- Background execution
- Network scheduling
- Application lifecycle detection
- Cancellation
- System notifications

However, they should follow the same underlying application rules.

The application should therefore distinguish between:

    Application Refresh Policy

and:

    Platform Refresh Mechanism

The policy defines what should happen.

The platform implementation determines how and when that policy can safely be carried out.

---

## Design Principle

The fundamental principle of the Data Management architecture is:

> Keep data current without making unnecessary requests.

The system should prefer predictable, conservative, observable behavior over aggressive polling.

A small amount of data staleness is preferable to uncontrolled network usage, battery consumption, or repeated requests caused by an application error.