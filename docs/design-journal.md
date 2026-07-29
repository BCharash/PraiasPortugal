# DJ001 — Beach Complexes are Geographic Abstractions

**Date:** 2026-07-29

## Decision

Introduce the concept of a Beach Complex as a first-class domain object.

A Beach Complex is a continuous stretch of coastline that can normally be traversed on foot without crossing a significant natural or artificial barrier.

Beach Complexes are a conceptual abstraction defined by Praias de Portugal rather than an official Portuguese administrative entity.

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

Portugal officially recognises individual beaches but does not generally define larger groupings that correspond to how visitors experience continuous stretches of coastline.

Many environmental characteristics are common across a continuous coastline:

- Weather
- Marine forecast
- Tides
- Sea temperature

Conversely, facilities and services are specific to individual beaches:

- Lifeguards
- Swimming areas
- Restaurants
- Snack bars
- Parking
- Accessibility
- Toilets

Introducing Beach Complexes separates shared environmental information from beach-specific infrastructure.

## Consequences

The application distinguishes between:

- Beach Complexes
- Beaches

Beach Complexes own shared environmental information.

Beaches own facilities, services, accessibility information, and points of interest.

This architecture supports future expansion without duplicating environmental data while accurately modelling the Portuguese coastline.

## Status

Accepted