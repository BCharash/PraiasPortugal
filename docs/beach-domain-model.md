# Domain Model

## Purpose

This document defines the conceptual domain model for **Praias Portugal**.

The objective is to separate **natural geography** from **visitor infrastructure**, allowing the application to scale from small beaches to large coastal areas without duplicating information.

The domain model is independent of programming language, storage format, implementation details, and external data sources.

---

# Hierarchy

```text
Portugal
    ↓
Region
    ↓
Municipality
    ↓
Beach Complex
    ↓
Beach Section
    ↓
Point of Interest
```

---

# Region

A Region is a broad geographical grouping used primarily for browsing and navigation.

Examples:

- Algarve
- Oeste
- Costa Vicentina
- Costa de Lisboa

---

# Municipality

A Municipality corresponds to the Portuguese administrative division responsible for many public beach services.

Examples:

- Torres Vedras
- Nazaré
- Lagos
- Cascais

A Municipality contains one or more Beach Complexes.

---

# Beach Complex

A Beach Complex represents the natural beach area that visitors commonly recognise as a single destination.

Examples:

- Praia de Santa Rita
- Santa Cruz
- Praia da Rocha

A Beach Complex owns information that is generally common across the entire area.

Typical information includes:

- Name
- Alternative names
- Geographic location
- Description
- Weather
- Marine forecast
- Tide predictions
- Water temperature
- Nearby beaches

A Beach Complex contains one or more Beach Sections.

---

# Beach Section

A Beach Section represents an individually managed or commonly recognised portion of a Beach Complex.

Examples:

```text
Praia de Santa Rita

    • Norte
    • Sul
```

```text
Santa Cruz

    • Praia da Física
    • Praia do Centro
    • Praia Formosa
    • Praia Azul
    • Praia do Pisão
    • Praia da Vigia
```

Each Beach Section may have different visitor facilities and services.

Typical information includes:

- GPS coordinates
- Parking
- Toilets
- Showers
- Accessibility
- Beach wheelchair
- Lifeguard
- Blue Flag
- Restaurants
- Cafés
- Webcams
- Photos

A Beach Section contains zero or more Points of Interest.

---

# Point of Interest

A Point of Interest represents an individual location associated with a Beach Section.

Examples include:

- Restaurant
- Café
- Beach bar
- Surf school
- Car park
- Viewpoint
- Lifeguard station
- First aid station
- Public toilets

Points of Interest should remain independent objects rather than being embedded directly into the Beach Section.

---

# Design Principles

## Separate Geography from Infrastructure

Natural geographic information belongs to the Beach Complex.

Visitor infrastructure belongs to individual Beach Sections.

This avoids unnecessary duplication while accurately modelling real beaches.

---

## Avoid Duplication

Environmental information should be stored only once whenever possible.

Examples include:

- Weather
- Forecast
- Tide data
- Water temperature

These typically apply to the entire Beach Complex.

Facilities should be stored only within the Beach Section that actually provides them.

---

## User Experience

Users should normally interact with Beach Complexes.

Beach Sections should only become visible when more detailed information is required.

For example:

```
Praia de Santa Rita

▼ Sections

• Norte
• Sul
```

Most users should not need to understand the internal hierarchy.

---

## Scalability

This model supports:

- Small beaches consisting of a single section.
- Beaches with multiple managed sections.
- Large coastal destinations such as Santa Cruz.
- Future expansion without requiring structural changes.

---

# Example

```text
Portugal
└── Oeste
    └── Torres Vedras
        └── Santa Cruz
            ├── Praia da Física
            │     ├── Restaurant
            │     ├── Parking
            │     └── Webcam
            │
            ├── Praia do Centro
            │     ├── Toilets
            │     ├── Showers
            │     └── Lifeguard
            │
            └── Praia Formosa
                  ├── Restaurant
                  ├── Blue Flag
                  └── Beach Wheelchair
```

---

# Future Expansion

The hierarchy has been intentionally designed to support future features including:

- Weather
- Marine forecasts
- Tide predictions
- Water quality
- Accessibility
- Facilities
- Webcams
- Historical information
- Geological information
- Nearby attractions
- AI-powered recommendations

These features should extend the existing domain model rather than changing it.

---

# Guiding Principle

The fundamental object within Praias Portugal is **not** the weather forecast.

It is the **Beach Complex**.

Everything else—including forecasts, facilities, tides, media, accessibility, and points of interest—exists to describe the user's experience of that beach.