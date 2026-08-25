# Architecture Roadmap

## Purpose

This document records architectural issues, planned improvements, and deliberately deferred capabilities discovered during development of **Praias de Portugal**.

The purpose is to prevent important decisions and observations from being lost during incremental development.

Items in this document should influence architectural decisions when appropriate, but should **not** be implemented merely because they appear here.

Development should continue according to the current development plan, one meaningful change at a time.

---

# Status Categories

### NOW

An issue should be addressed during the current architectural cleanup.

### NEXT

An issue should be addressed after the current cleanup, before significant new functionality is added.

### FUTURE

The architecture should allow for this capability, but implementation is not currently planned.

### DEFERRED

Implementation is deliberately postponed until a particular external capability, data source, or other condition becomes available.

---

# 1. Data Architecture

## NOW

### Complete Data Manager Integration

Environmental data requests should ultimately be coordinated through `dataManager.js`.

The Data Manager should become the central coordinator for:

- data freshness
- refresh eligibility
- automatic refresh
- manual refresh
- retry behavior
- lifecycle behavior
- update status

Provider-specific services remain responsible for communicating with their external providers.

The Data Manager must not contain provider-specific API logic.

---

### Resolve Dataset Ownership

Each independently refreshable environmental dataset should have a clearly defined owner.

Current conceptual datasets include:

- Weather
- Marine
- Tide
- Alerts

Each should have an explicit path from:

```text
Data Manager
    ↓
Service
    ↓
Normalized Data
    ↓
Application State
    ↓
Presentation