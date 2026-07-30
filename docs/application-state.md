# Application State

## Purpose

This document defines the information maintained by **Praias de Portugal** while the application is running.

Application State is independent of implementation and applies equally to the web, iOS, and Android versions.

It describes what the application knows at any given moment, not how that information is stored.

---

# Principles

Application State represents the user's current interaction with the application.

It should not duplicate permanent information contained within the Domain Model.

Whenever possible, state should be derived rather than duplicated.

Application State should remain small, predictable, and easy to understand.

---

# Guiding Principle

Application State contains only information that may change during a user's interaction with the application.

Permanent information belongs to the Domain Model.

Transient information belongs to Application State.

---

# Core State

The application maintains a small set of shared state.

Examples include:

- Active Beach Complex
- Active Beach
- Active View
- Active Language
- Preferred Units
- User Preferences

These values define the application's current context.

---

# Navigation State

Navigation State records where the user is within the application.

Examples include:

- Current View
- Previous View
- Selected Beach
- Selected Beach Complex
- Selected Chart
- Selected Forecast Period

Navigation State changes frequently as the user explores the application.

---

# User Preferences

Some state persists between application sessions.

Examples include:

- Home Beach
- Last Visited Beach
- Startup Preference
- Preferred Language
- Preferred Units
- Favorite Beaches

Although these values are stored permanently, they become part of Application State after being loaded.

---

# Widget State

Individual widgets may maintain small amounts of temporary state.

Examples include:

- Expanded or collapsed sections
- Selected chart point
- Active graph tooltip
- Selected tab
- Scroll position

Widget State should remain local to the widget whenever possible.

Only information required by multiple parts of the application should become shared Application State.

---

# State Flow

Changes to Application State are coordinated through the Application Controller.

```
User Action
      │
      ▼
Application Controller
      │
      ▼
Application State
      │
      ├── Dashboard
      ├── Beach Selector
      ├── Explorer
      ├── Preferences
      └── Other Widgets
```

Views and widgets observe Application State.

They should display state rather than own it.

---

# Design Principles

The application should maintain a single source of truth.

Each piece of information should have exactly one authoritative location.

State should be:

- Minimal
- Consistent
- Predictable
- Easy to update
- Easy to observe

Derived information should be calculated when needed rather than stored.

---

# Future Expansion

As the application evolves, additional state may include:

- Offline status
- Download progress
- Synchronization status
- Notification settings
- Cached forecasts
- User authentication

New state should only be introduced when it cannot be derived from existing information.

---

# Summary

The purpose of Application State is to describe the application's current situation rather than the world itself.

The Domain Model describes Portugal's coastline.

Application State describes the user's current interaction with that coastline.