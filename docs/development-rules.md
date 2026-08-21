# Development Rules

## Purpose

This document defines the practical rules and working conventions used
when developing Praias de Portugal.

The purpose is to keep development predictable, understandable, and
safe as the application grows.

These rules apply to both the codebase and the development workflow.

---

# 1. Development Philosophy

Praias de Portugal should be developed incrementally.

New functionality should normally be added by extending existing
modules or introducing small, focused modules rather than by creating
large blocks of unrelated code.

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

When debugging or modifying existing functionality, make one meaningful
change at a time.

After each change:

1. Save the file.
2. Reload or otherwise test the application.
3. Check for errors.
4. Confirm the intended behavior.
5. Only then proceed to the next change.

Do not make several speculative changes simultaneously.

This makes it possible to determine which change caused an improvement
or introduced a problem.

---

# 3. Establish the Current Code First

Before modifying an existing module, establish its current state.

Do not assume that an older version of a file is still current.

When a file is large or has been modified repeatedly:

- Obtain the current version.
- Identify the relevant function.
- Understand the surrounding code.
- Then make the change.

When necessary, work from the complete current file rather than from
an earlier version remembered from a previous conversation.

---

# 4. Large Files

The developer should not be expected to remember where a particular
function or section is located in a large file.

When asking for a change to a large file:

- Identify the filename.
- Identify the function or section.
- Provide clear landmarks.
- Prefer a complete replacement file when a partial edit could easily
  lead to confusion.

For example:

```text
File: src/js/app.js

Function: initializeApplication()

Replace the section beginning with:
    ...

and ending with:
    ...