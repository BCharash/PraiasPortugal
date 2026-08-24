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