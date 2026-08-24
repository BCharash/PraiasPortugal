# Domain Model

## Purpose

The domain model describes the core entities used by Praias de Portugal and the relationships between them.

The model separates geographic groupings, individual beaches, and environmental and beach-specific information so that each concept can evolve independently.

---

# Geographic Hierarchy

The application uses the following geographic hierarchy:

```text
Region
    │
    └── Municipality
            │
            └── Area
                    │
                    └── Beach