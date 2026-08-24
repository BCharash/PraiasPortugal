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
| IPMA Alerts | IPMA | As issued | Planned |

---

## Curated Data

These datasets are unique to Praias de Portugal and represent the project's own knowledge.

| Dataset | Description | Status |
|----------|-------------|--------|
| Regions | User-facing geographic regions | Implemented |
| Areas | Continuous or geographically coherent stretches of coastline | Implemented |
| Beach-to-Area Relationships | Assignment of Beaches to Areas | Implemented |
| Beach Descriptions | Editorial content | Future |
| Photographs | Curated image collection | Future |
| Points of Interest | Places associated with Beaches | Future |

---

## Derived Data

Derived datasets are generated from existing information.

Examples include:

- Nearby beaches
- Beach ordering within an Area
- Walking distance between beaches
- Estimated travel times
- Search indexes
- Similar beaches

Derived information may be associated with either an Area or a Beach depending on the information being calculated.

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
| Fog / Mist Conditions | TBD | Hourly |
| IPMA Alerts | IPMA | As issued |

Live environmental information such as weather, marine conditions, tides, sea temperature, wind, UV, and fog/mist conditions is generally associated with the relevant Area.

Where an external source provides more precise geographic information, the application may retain that precision internally while presenting the information at the appropriate domain level.

---

## Beach-Specific Safety Data

Some future safety information may depend on the characteristics of an individual Beach rather than the broader Area.

| Dataset | Scope | Source | Status |
|----------|-------|--------|--------|
| Rip-Current Risk / Prediction | Beach-specific | TBD | Future |

Rip-current information should only be presented at beach level when the underlying source or predictive model supports that level of geographic precision.

The application should not imply greater predictive accuracy than the underlying data supports.

---

## Data Ownership Principles

Praias de Portugal follows these principles:

1. Official information should be referenced from authoritative sources whenever practical.

2. Curated datasets represent the unique knowledge of Praias de Portugal.

3. Derived datasets should be reproducible from source data.

4. Live datasets should remain independent of the application's permanent data unless historical records are intentionally maintained.

5. Every field presented by the application should have an identifiable source.

6. Area-level environmental information should not be unnecessarily duplicated across individual Beaches.

7. Beach-specific information should remain associated with the individual Beach whenever the source supports that level of precision.

8. Predictive information should not be presented with greater geographic or temporal precision than its underlying data supports.

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
- Geographic coverage
- Historical data retention

The authoritative provider and implementation for Fog / Mist prediction remain to be determined.

The authoritative source or predictive model for Beach-specific Rip-Current Risk also remains to be determined.