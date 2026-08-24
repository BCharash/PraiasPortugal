# Development Rules

## Purpose

This document defines the practical rules and working conventions used when developing Praias de Portugal.

The purpose is to keep development predictable, understandable, and safe as the application grows.

These rules apply to both the codebase and the development workflow.

---

# 1. Development Philosophy

Praias de Portugal should be developed incrementally.

New functionality should normally be added by extending existing modules or introducing small, focused modules rather than by creating large blocks of unrelated code.

The application should remain understandable as it grows.

Prefer:

- Small changes
- Clear responsibilities
- Explicit data flow
- Modular code
- Simple solutions
- Incremental testing

Avoid:

- Large unrelated changes
- Hidden dependencies
- Duplicated logic
- Mixing architectural layers
- Fixing symptoms without understanding the cause

---

# 2. One Change at a Time

When debugging or modifying existing functionality, make one meaningful change at a time.

After each change:

1. Save the file.
2. Reload or otherwise test the application.
3. Check for errors.
4. Confirm the intended behavior.
5. Only then proceed to the next change.

Do not make several speculative changes simultaneously.

This makes it possible to determine which change caused an improvement or introduced a problem.

---

# 3. Establish the Current Code First

Before modifying an existing module, establish its current state.

Do not assume that an older version of a file is still current.

When a file is large or has been modified repeatedly:

- Obtain the current version.
- Identify the relevant function.
- Understand the surrounding code.
- Then make the change.

When necessary, work from the complete current file rather than from an earlier version remembered from a previous conversation.

---

# 4. Large Files

The developer should not be expected to remember where a particular function or section is located in a large file.

When asking for a change to a large file:

- Identify the filename.
- Identify the function or section.
- Provide clear landmarks.
- Prefer a complete replacement file when a partial edit could easily lead to confusion.

For example:

File: src/js/app.js

Function: initializeApplication()

Replace the section beginning with:

    ...

and ending with:

    ...

---

# 5. Separate Data from Presentation

Data and presentation should remain separate.

Domain and service data should describe what the application knows.

Presentation code should determine how that information is displayed.

For example:

- Temperature data should contain the temperature value.
- A temperature formatter should determine the user's preferred unit.
- A graph should determine where and how the value is displayed.

Do not store presentation-specific positions, dimensions, or CSS values as part of domain or service data unless the value is genuinely part of the domain.

This separation prevents changes to the visual presentation from unnecessarily affecting data services or application state.

---

# 6. Normalize External Data at the Service Boundary

External providers may use their own field names, units, structures, and terminology.

Provider-specific representations should be converted into the application's normalized data structures within the appropriate service.

The User Interface should not depend directly on the structure of an external provider.

Prefer:

External Provider
       ↓
Application Service
       ↓
Normalized Application Data
       ↓
User Interface

rather than allowing provider-specific data structures to propagate throughout the application.

This allows an external provider to be changed without requiring unrelated User Interface code to change.

---

# 7. Keep Domain Entities Focused

Domain entities should contain information that properly belongs to those entities.

A Beach should contain beach-specific information.

Examples include:

- Facilities
- Accessibility
- Lifeguard information
- Physical characteristics
- Beach-specific services

Live environmental conditions should not be unnecessarily embedded into the Beach entity.

Examples of environmental information include:

- Weather
- Wind
- Marine conditions
- Sea temperature
- Tides
- Fog or mist
- Environmental alerts

Such information should remain associated with the appropriate Area or environmental data service.

This avoids creating large objects containing unrelated and frequently changing information.

---

# 8. Parent Layout Owns Structural Layout

Structural layout should normally be controlled by the parent container.

Prefer:

- CSS Grid
- Flexbox
- Intrinsic sizing
- Responsive widths
- minmax()
- clamp()

Individual widgets should not independently position themselves to compensate for problems in the parent layout.

Absolute positioning should be used only when the position has a genuine visual or coordinate-based meaning.

Before adding a positioning rule to an individual element, determine whether the problem should instead be solved by its parent layout.

Responsive rules should change the layout when necessary rather than accumulate as corrections to individual elements.

This principle is especially important for the mobile interface, where available horizontal space is limited and text size may vary according to user preference.