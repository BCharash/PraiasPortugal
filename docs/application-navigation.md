# Application Navigation

## Purpose

This document defines how users navigate through **Praias de Portugal**.

Navigation is independent of the application's visual design and should remain consistent across web, iOS, and Android implementations.

The objective is to allow users to reach useful environmental information as quickly as possible while preserving a single underlying application model.

---

# Navigation Philosophy

The Dashboard is the primary destination of the application.

Users may arrive at the Dashboard through multiple navigation methods, but once a Beach has been selected the application presents a consistent Dashboard experience.

Navigation methods provide different journeys to the same destination.

---

# Primary Navigation Methods

## Startup

Depending upon user preferences, the application may initially display:

- Last Visited Beach
- Home Beach
- Beach Selector
- Nearby Beaches

Regardless of the startup method, the objective is to present the Dashboard as quickly as possible.

---

## Browse

Allows users to explore Portugal's coastline hierarchically.

```
Region
    ↓
Beach Complex
    ↓
Beach
```

Browse is best suited for exploration and discovery.

---

## Search

Allows users to locate Beaches and Beach Complexes by name.

Search should support:

- Partial names
- Case-insensitive matching
- Accent-insensitive matching
- Fast incremental search

Examples:

```
Santa

↓

Praia de Santa Rita Norte
Praia de Santa Rita Sul
Santa Cruz
```

---

## Favorites

Users may save Beaches for rapid access.

Favorites are personal to the user and may be stored locally or synchronized with a user account.

---

## Nearby

Uses the device's location to display nearby Beaches.

Results may be ordered by:

- Distance
- Travel time
- User preferences

---

## Recent

Displays Beaches recently viewed by the user.

This allows rapid return to frequently visited locations.

---

# Common Destination

All navigation methods ultimately resolve to a Beach.

The selected Beach determines the Beach Complex and the environmental information displayed by the Dashboard.

```
Browse ─────┐
Search ─────┤
Favorites ──┤
Nearby ─────┤
Recent ─────┤
Startup ────┘
            │
            ▼
         Beach
            │
            ▼
       Dashboard
```

---

# Dashboard

The Dashboard is the primary operational view of the application.

It provides immediate access to:

- Current Conditions
- Alerts
- Weather
- Marine Forecast
- Tides
- Forecast Charts

The Dashboard should answer the question:

> "Should I go to this beach today?"

Detailed information remains available through secondary views.

---

# Secondary Views

From the Dashboard, users may navigate to additional information including:

- Facilities
- Accessibility
- Restaurants
- Parking
- Photographs
- Webcams
- Map
- Nearby Beaches
- History
- Environmental Information

Additional views may be introduced without changing the navigation model.

---

# Cross-Platform Principle

The navigation model is independent of presentation.

Desktop browsers, tablets, iOS, and Android may present different interfaces while preserving the same navigation structure.

---

# Future Navigation Methods

The architecture allows additional navigation methods without affecting the remainder of the application.

Examples include:

- QR codes
- Voice search
- Interactive maps
- Suggested beaches
- Walking routes
- Collections
- Recently updated beaches

Regardless of navigation method, the user should arrive at the Dashboard with the selected Beach already active.