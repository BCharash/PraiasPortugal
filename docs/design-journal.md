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