# Architecture

## Purpose

This document describes the architectural organization of **Praias de Portugal**.

The architecture is intended to be simple, modular, and scalable. It separates domain concepts from application logic, presentation, and external services, allowing the application to evolve without major structural changes.

The architecture is intentionally independent of specific APIs, frameworks, databases, and implementation details.

---

# Architectural Principles

The architecture follows these principles:

- The Beach Complex is the central environmental domain object.
- Beaches are independent domain entities.
- Domain concepts are independent of data providers.
- User Interface code is separated from business logic.
- Presentation is composed of reusable widgets.
- External services are isolated behind service modules.
- Each module has a single responsibility.
- State is managed centrally.
- The application should remain understandable as it grows.

---

# Architectural Overview

Everything in the application revolves around a Beach Complex.

```
Beach Complex
      │
      ├── Weather
      ├── Marine Forecast
      ├── Tides
      ├── Water Quality
      ├── Beaches
      │      ├── Facilities
      │      ├── Accessibility
      │      ├── Restaurants
      │      ├── Parking
      │      ├── Webcams
      │      └── Points of Interest
      │
      └── Media
```

The Beach Complex represents a continuous stretch of coastline sharing common environmental conditions.

Individual Beaches represent named public beaches within that Beach Complex and contain information specific to those locations.

Environmental information belongs to the Beach Complex.

Operational information belongs to individual Beaches.

This separation minimizes duplication while accurately modelling how visitors experience Portugal's coastline.

---

# High-Level Architecture

```
                    User Interface
                           │
                           ▼
                Application Controller
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   Domain Model      Application Services   External Providers
```

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
- Charts Widget

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
- Selecting the active Beach Complex
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
- Beach Complex
- Beach
- Forecast
- Tide
- Water Quality
- Point of Interest

The Domain Model contains no knowledge of APIs, presentation, or user interface implementation.

---

## Application Services

Application Services obtain, process, or transform information.

Examples include:

- Weather Service
- Tide Service
- Marine Forecast Service
- GPS Service
- Water Quality Service
- Translation Service

Services convert external information into Domain objects.

Application Services are independent of the User Interface.

---

## External Providers

Examples include:

- Weather APIs
- Marine Forecast APIs
- Government datasets
- OpenStreetMap
- Browser Geolocation API

The remainder of the application should never depend directly upon provider-specific formats.

Replacing one provider with another should require changes only within the corresponding Service.

---

# Data Flow

```
External Provider
        │
        ▼
Application Service
        │
        ▼
Domain Model
        │
        ▼
Application Controller
        │
        ▼
User Interface
```

The User Interface never communicates directly with external providers.

---

# Application State

The application maintains a small amount of shared state.

Initially this consists of:

- Active Beach Complex
- Active Beach
- Last Visited Beach
- Home Beach
- Startup Preference
- Language
- Units
- User Preferences

Additional shared state should only be introduced when necessary.

Application state represents the current condition of the application and provides the information required by User Interface widgets.

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

# Future Modules

As the application grows, responsibilities may be separated into modules such as:

- Beach Service
- Weather Service
- Marine Forecast Service
- Tide Service
- Water Quality Service
- GPS Service
- Translation Service
- Preferences Service
- Media Service

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
- Easy to understand

Whenever possible, new features should extend the existing architecture rather than require architectural redesign.

The architecture should encourage incremental development, allowing new functionality to be introduced as independent modules or widgets without disrupting existing functionality.