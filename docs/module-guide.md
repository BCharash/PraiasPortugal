# Module Guide

## Purpose

This document describes the responsibilities and boundaries of the
individual JavaScript modules in Praias de Portugal.

`architecture.md` describes the overall architecture.

`file-map.md` provides a quick reference for locating functionality.

This document explains what each module does, what it should contain,
and what it should not contain.

The goal is to keep module responsibilities clear as the application
grows.

---

# Application Control

## app.js — Application Controller

### Purpose

Controls the overall application lifecycle and coordinates major
application operations.

### Responsibilities

- Application startup
- Application initialization
- Application state
- Page navigation
- Restoring saved application state
- Selecting the active beach
- Managing the current application view
- Coordinating major application operations
- Persisting relevant application preferences

### Should contain

Application workflow and coordination logic.

### Should not contain

- Weather calculations
- Tide calculations
- Marine calculations
- Weather API-specific processing
- Widget-specific presentation logic
- Detailed formatting of individual values

---

## dashboard.js — Dashboard Coordinator

### Purpose

Coordinates updates to the Dashboard and its widgets.

### Responsibilities

- Receiving current dashboard data
- Coordinating updates to dashboard widgets
- Passing the appropriate data to presentation modules

### Should contain

Dashboard-level coordination.

### Should not contain

- Direct API requests
- Provider-specific data processing
- Detailed weather calculations
- Detailed tide calculations
- Detailed widget formatting

---

# Beach Display

## display.js — Beach Display

### Purpose

Displays information associated with the selected beach.

### Responsibilities

- Finding the selected beach
- Obtaining the data required to display the beach
- Constructing dashboard data
- Displaying beach information
- Updating the Dashboard

### Should contain

Logic necessary to assemble information for display.

### Should not contain

- Application startup
- Application navigation
- External provider implementation
- Detailed weather interpretation
- Detailed marine interpretation
- Detailed tide calculations

---

# Weather

## weatherService.js — Weather Service

### Purpose

Obtains weather information from the external weather provider.

### Responsibilities

- Constructing weather API requests
- Retrieving weather data
- Processing the provider response
- Producing the application's weather data structure

### Should contain

Provider-specific weather retrieval and conversion.

### Should not contain

- DOM manipulation
- Dashboard layout
- User-interface logic
- Application navigation
- Beach-specific presentation
- Coastal-condition interpretation

---

## weatherFormatter.js — Weather Formatter

### Purpose

Converts weather data into user-facing display values.

### Responsibilities

- Temperature formatting
- Apparent-temperature formatting
- Humidity formatting
- Wind formatting
- UV formatting
- Weather description formatting
- Other weather-specific presentation formatting

### Should contain

Pure formatting functions whenever possible.

### Should not contain

- API requests
- DOM manipulation
- Application navigation
- Application state management
- Coastal-condition interpretation

---

## coastalConditions.js — Coastal Conditions

### Purpose

Interprets atmospheric weather information specifically in the context
of coastal conditions.

### Responsibilities

- Detecting current fog
- Detecting current coastal conditions
- Interpreting coastal mist
- Estimating coastal fog risk
- Interpreting short-term coastal fog forecasts
- Applying thresholds used for coastal interpretation

### Should contain

Coastal-specific interpretation logic.

### Should not contain

- API requests
- DOM manipulation
- HTML rendering
- Application navigation
- General weather formatting

---

## conditions.js — Current Conditions Widget

### Purpose

Displays current environmental conditions in the Conditions widget.

### Responsibilities

- Updating current weather information
- Displaying air temperature
- Displaying apparent temperature
- Displaying humidity
- Displaying weather condition
- Displaying current coastal conditions
- Displaying wind
- Displaying UV
- Displaying sunrise and sunset
- Displaying moon phase and illumination
- Coordinating the celestial graphic within the widget
- Formatting values required by the widget

### Should contain

Presentation logic specific to the Current Conditions widget.

### Should not contain

- Weather API requests
- Marine API requests
- Tide retrieval
- Application startup
- Application navigation
- General coastal-condition interpretation

Coastal interpretation belongs in `coastalConditions.js`.

---

# Marine Conditions

## marineService.js — Marine Service

### Purpose

Obtains marine conditions from the external marine provider.

### Responsibilities

- Constructing marine-data requests
- Retrieving marine data
- Processing provider responses
- Producing the application's marine data structure

### Should contain

Provider-specific marine retrieval and conversion.

### Should not contain

- DOM manipulation
- Dashboard presentation
- Marine display formatting
- Application navigation

---

## marineFormatter.js — Marine Formatter

### Purpose

Converts marine data into user-facing display values.

### Responsibilities

- Sea-temperature formatting
- Surf formatting
- Marine-condition formatting
- Other marine-specific display formatting

### Should contain

Pure marine formatting functions whenever possible.

### Should not contain

- API requests
- DOM manipulation
- Application navigation
- Marine data retrieval

---

# Tides

## tideService.js — Tide Service

### Purpose

Obtains and processes tide information.

### Responsibilities

- Retrieving tide information
- Processing tide data
- Producing the application's tide data structure
- Calculating information required by the application from tide data

### Should contain

Tide data retrieval and tide-related processing.

### Should not contain

- DOM manipulation
- Dashboard presentation
- User-interface formatting

---

## tideFormatter.js — Tide Formatter

### Purpose

Converts tide information into user-facing display values.

### Responsibilities

- Current tide height formatting
- Tide trend formatting
- Tide-time formatting
- Other tide-specific presentation formatting

### Should contain

Pure tide formatting functions whenever possible.

### Should not contain

- API requests
- Tide data retrieval
- DOM manipulation
- Application navigation

---

# Celestial

## celestialService.js — Celestial Service

### Purpose

Determines the application's current celestial state.

### Responsibilities

- Determining solar state
- Determining lunar state
- Calculating celestial information required by the application
- Providing information required to render the celestial display

### Should contain

Celestial calculations and interpretation.

### Should not contain

- DOM manipulation
- HTML generation
- Application navigation
- External weather retrieval

---

## celestialFormatter.js — Celestial Formatter

### Purpose

Converts celestial information into display-ready representations.

### Responsibilities

- Formatting celestial values
- Formatting celestial labels
- Supporting presentation of solar and lunar information
- Supporting graphical presentation where appropriate

### Should contain

Celestial presentation and formatting functions.

### Should not contain

- Weather API requests
- Application navigation
- Application state management

---

# Beach Data

## data.js — Application Data

### Purpose

Contains the application's beach and related static data.

### Responsibilities

- Beach definitions
- Beach identifiers
- Beach coordinates
- Beach metadata
- Other static application data

### Should contain

Data definitions rather than application workflow.

### Should not contain

- API requests
- DOM manipulation
- Application navigation
- UI logic

---

# User Interface

## alerts.js — Alerts Widget

### Purpose

Displays alerts relevant to the user or current beach.

### Responsibilities

- Updating the Alerts widget
- Displaying relevant alerts
- Managing alert presentation

### Should not contain

- External API retrieval
- Application startup
- General application navigation

---

## beachHeader.js — Beach Header

### Purpose

Displays information identifying the currently selected beach.

### Responsibilities

- Beach name
- Beach location information
- Beach-specific header presentation

### Should not contain

- Beach data retrieval
- Application startup
- External API requests

---

## browse.js — Beach Browser

### Purpose

Provides the beach browsing and selection interface.

### Responsibilities

- Displaying available beaches
- Handling beach selection
- Supporting beach browsing and exploration

### Should not contain

- Weather retrieval
- Marine retrieval
- Tide retrieval
- Application startup

---

## preferences.js — Preferences

### Purpose

Provides the user interface for application preferences.

### Responsibilities

- Displaying preference controls
- Reading user preference selections
- Updating preference presentation

### Should not contain

- Weather calculations
- Marine calculations
- Tide calculations
- External provider implementation

---

## background.js — Background Presentation

### Purpose

Controls background or environmental visual presentation.

### Responsibilities

- Background visual state
- Environmental background presentation
- Visual changes associated with application state where appropriate

### Should not contain

- External data retrieval
- Domain calculations
- Application startup

---

# Shared Responsibilities

## Separation Between Service, Interpretation, Formatting, and Display

A recurring distinction throughout the application is:

```text
External Provider
       │
       ▼
Service
       │
       ▼
Application Data
       │
       ▼
Interpretation
       │
       ▼
Formatter
       │
       ▼
Widget / Display