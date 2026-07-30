# Application State

This document defines the information that the application maintains while it is running.

Application State is independent of implementation and applies equally to the web, iOS, and Android versions.

It describes what the application knows at any given moment, not how that information is stored.

---

## Principles

Application State should represent the user's current interaction with the application.

It should not duplicate permanent information stored in the data model.

Whenever possible, state should be derived rather than duplicated.

## Guiding Principle

Application State should contain only information that may change during a user's interaction with the application.

Permanent information belongs to the domain model.

Transient information belongs to Application State.
