# Architecture Roadmap

## Purpose

This document records the architectural thinking, decisions, constraints, future requirements, deliberate deferrals, and planned improvements for **Praias de Portugal**.

It exists so that architectural decisions do not have to be reconstructed from previous conversations when development resumes after an interruption.

This is intentionally more detailed than a conventional task list.

The application is being developed incrementally. Some capabilities discussed in this document are deliberately **not being implemented now**. Their presence here means that current architectural decisions should avoid making those capabilities unnecessarily difficult later.

The central principle is:

> **Design today's architecture so that tomorrow's functionality can be added without requiring today's functionality to be rewritten.**

At the same time:

> **Do not implement future functionality merely because the architecture anticipates it.**

---

# 1. Architectural Intent

Praias de Portugal is intended to become a scalable environmental information application for Portuguese beaches.

The application should eventually be able to present information about:

- individual beaches;
- Areas and regions;
- weather;
- marine conditions;
- tides;
- wind;
- surf;
- sea temperature;
- alerts;
- celestial conditions;
- coastal conditions;
- and eventually more sophisticated environmental interpretation.

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

# 2. The Fundamental Separation

A useful way to understand the architecture is to distinguish four kinds of responsibility.

## 2.1 Domain Data

This describes what the application knows about places and permanent characteristics.

Examples:

- Area;
- Beach;
- coordinates;
- municipality;
- district;
- region;
- beach characteristics.

---

## 2.2 Raw Environmental Data

This is information obtained from an external provider.

Examples:

- air temperature;
- wind;
- wave height;
- wave period;
- sea-surface temperature;
- ocean-current velocity;
- ocean-current direction;
- tide predictions;
- alerts.

Raw environmental data belongs to services.

---

## 2.3 Derived Environmental Information

This is information the application calculates or infers from raw data and domain characteristics.

Examples:

- coastal fog risk;
- whether the current is behaving unusually;
- current reversal;
- potential warm-water signal;
- future rip-current risk.

Derived information should not automatically be placed inside the raw data service that supplies one of its inputs.

---

## 2.4 Presentation

Presentation determines how information is shown.

Examples:

- Dashboard;
- Conditions page;
- cards;
- widgets;
- labels;
- formatting;
- responsive layout.

Presentation should consume data rather than become responsible for obtaining that data.

---

# 3. Desired High-Level Data Flow

The desired architecture is approximately:

```text
                    DOMAIN DATA
                         │
                  Areas / Beaches
                         │
                         ▼
                 Application State
                         │
                         ▼
                   Data Manager
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     Weather           Marine            Tide
     Service           Service          Service
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                  Normalized Data
                         │
                         ▼
                 Derived Analysis
                         │
                         ▼
                  Dashboard Data
                         │
                         ▼
                   Presentation