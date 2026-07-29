# Architecture

## Purpose

This document describes the architectural organization of **Praias Portugal**.

The architecture is intended to be simple, modular, and scalable. It separates domain concepts from application logic and external services, allowing the application to evolve without major structural changes.

The architecture is independent of specific APIs, frameworks, and implementation details.

---

# Architectural Principles

The architecture follows these principles:

- The Beach Complex is the central domain object.
- Domain concepts are independent of data providers.
- User interface code is separated from business logic.
- External services are isolated behind service modules.
- Each module has a single responsibility.
- The application should remain understandable as it grows.

---

# Architectural Overview

Everything in the application revolves around a single **Beach Complex**.

```
Beach Complex
      │
      ├── Weather
      ├── Marine Forecast
      ├── Tides
      ├── Water Quality
      ├── Beach Sections
      │      ├── Facilities
      │      ├── Accessibility
      │      └── Points of Interest
      └── Media
```

The Beach Complex is the primary object selected by the user.

Most information—such as weather, marine forecasts, tides, and water quality—belongs to the Beach Complex because it generally applies across the entire beach area.

Information that differs within a beach, such as facilities, restaurants, parking, accessibility, or webcams, belongs to individual Beach Sections.

This separation avoids duplication while accurately modelling large beaches that contain multiple named or managed areas.

---

# High-Level Architecture

```
                 User Interface
                        │
                        ▼
              Application Controller
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
 Domain Model      Application      External
                   Services         Providers
```

---

# Layers

## User Interface

Responsible for presenting information to the user.

Responsibilities:

- Display current beach
- Display forecasts
- Display tides
- Display facilities
- Display settings
- Handle user interaction

The User Interface should contain as little business logic as possible.

---

## Application Controller

Coordinates the application.

Responsibilities:

- Application startup
- Navigation
- State management
- Selecting the active Beach Complex
- Coordinating services
- Updating the User Interface

---

## Domain Model

Represents the concepts within Praias Portugal.

Examples include:

- Region
- Municipality
- Beach Complex
- Beach Section
- Point of Interest
- Forecast
- Tide
- Water Quality

The Domain Model contains no knowledge of APIs or presentation.

---

## Application Services

Services obtain or process information.

Examples:

- Weather Service
- Tide Service
- GPS Service
- Water Quality Service
- Translation Service

Services convert external data into Domain objects.

---

## External Providers

Examples include:

- Weather APIs
- Marine forecast APIs
- Government datasets
- OpenStreetMap
- Browser Geolocation API

The rest of the application should not depend directly upon provider-specific formats.

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

---

# State

The application maintains a small amount of shared state.

Initially this consists of:

- Selected Beach Complex
- Language
- Units
- User Preferences

Additional state should only be introduced when necessary.

---

# Future Modules

As the application grows, responsibilities may be separated into modules such as:

- Beach Service
- Weather Service
- Tide Service
- Water Quality Service
- GPS Service
- Translation Service
- Settings Service

The exact implementation is intentionally left open.

---

# Design Goals

The architecture should remain:

- Simple
- Modular
- Testable
- Scalable
- Independent of external providers
- Easy to understand

Whenever possible, new features should extend the existing architecture rather than requiring architectural redesign.