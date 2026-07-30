# Application Navigation

This document defines how users navigate through **Praias de Portugal**.

Navigation is independent of the application's user interface and should remain consistent across web, iOS, and Android implementations.

The objective is to allow users to locate and explore beaches naturally while preserving a single underlying application model.

---

## Navigation Philosophy

The application is centred around the **Beach**.

Users may arrive at a Beach through multiple navigation methods, but once a Beach has been selected, the remainder of the application behaves identically.

Different navigation methods provide different journeys to the same destination.

---

## Primary Navigation Methods

### Browse

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

### Search

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

### Favorites

Users may save Beaches for quick access.

Favorites are personal to the user and are stored locally or within the user's account.

---

### Nearby

Uses the device's location to display nearby Beaches.

Results may be ordered by:

- Distance
- Travel time
- User preferences

---

### Recent

Displays Beaches recently viewed by the user.

This allows rapid return to frequently visited locations.

---

## Common Destination

Regardless of navigation method, every selection resolves to a Beach.

```
Browse ─────┐
Search ─────┤
Favorites ──┤
Nearby ─────┤
Recent ─────┘
            │
            ▼
         Beach
```

---

## Beach Navigation

After selecting a Beach, users may access information such as:

- Overview
- Current Conditions
- Facilities
- Accessibility
- Photographs
- Map
- Nearby Beaches
- History
- Environmental Information

The available information may expand over time without changing the navigation model.

---

## Cross-Platform Principle

The navigation model is independent of presentation.

Desktop browsers, tablets, iOS, and Android may present different user interfaces while preserving the same navigation structure.

---

## Future Navigation Methods

The architecture allows additional navigation methods to be introduced without affecting the rest of the application.

Examples include:

- QR codes
- Voice search
- Interactive maps
- Suggested beaches
- Walking routes
- Collections
- Recently updated beaches

All navigation methods ultimately resolve to a Beach.