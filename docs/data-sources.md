# Data Sources

This document identifies the authoritative source for every dataset used by **Praias de Portugal**.

The project distinguishes between four categories of data:

- **Official** — Published and maintained by an authoritative organization.
- **Curated** — Created and maintained by Praias de Portugal.
- **Derived** — Computed from other datasets.
- **Live** — Retrieved from external services and updated regularly.

The goal is to ensure that every piece of information presented by the application has a clearly identified source and ownership.

---

## Official Data

Official datasets are maintained by external organizations. Praias de Portugal consumes these datasets but does not alter their meaning.

| Dataset | Authority | Update Frequency | Status |
|----------|-----------|------------------|--------|
| Beaches | APA | Occasional | Planned |
| Bathing Water Quality | APA | During bathing season | Planned |
| Blue Flag Status | Blue Flag Portugal | Annual | Planned |
| Municipality | Official Administrative Divisions | Rare | Planned |
| District | Official Administrative Divisions | Rare | Planned |
| Protected Areas | ICNF | Occasional | Future |

---

## Curated Data

These datasets are unique to Praias de Portugal and represent the project's own knowledge.

| Dataset | Description | Status |
|----------|-------------|--------|
| Regions | User-facing geographic regions | Implemented |
| Beach Complexes | Continuous stretches of coastline | Implemented |
| Beach-to-Complex Relationships | Assignment of Beaches to Beach Complexes | Implemented |
| Beach Descriptions | Editorial content | Future |
| Photographs | Curated image collection | Future |
| Points of Interest | Places associated with Beaches | Future |

---

## Derived Data

Derived datasets are generated from existing information.

Examples include:

- Nearby beaches
- Beach ordering within a Beach Complex
- Walking distance between beaches
- Estimated travel times
- Search indexes
- Similar beaches

---

## Live Data

Live datasets are obtained from external services.

| Dataset | Source | Refresh |
|----------|--------|---------|
| Weather | TBD | Hourly |
| Marine Forecast | TBD | Daily |
| Tide Predictions | TBD | Daily |
| Sea Temperature | TBD | Daily |
| Wave Height | TBD | Hourly |
| Wind | TBD | Hourly |
| UV Index | TBD | Daily |

---

## Data Ownership Principles

Praias de Portugal follows these principles:

1. Official information should be referenced from authoritative sources whenever practical.
2. Curated datasets represent the unique knowledge of Praias de Portugal.
3. Derived datasets should be reproducible from source data.
4. Live datasets should remain independent of the application's permanent data unless historical records are intentionally maintained.
5. Every field presented by the application should have an identifiable source.

---

## Future Work

Future versions of this document will identify:

- Authoritative data providers
- Licensing requirements
- Attribution requirements
- Import procedures
- Validation procedures
- Data quality standards
- Update schedules