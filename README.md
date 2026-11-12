# PraiasPortugal

PraiasPortugal is a web application that provides weather, marine conditions, tides, and beach information for beaches throughout Portugal.

## Live sky (development)

Open `index.html` with Live Server. On Dashboard, check **Live sky** to enable the
selected beach's weather background. Uncheck to restore the original appearance.
Settings → Live sky provides animation, speed, panel opacity and cloud style.
Preferences are saved; the background persists across all views. The Lisbon
clock/sunrise/sunset fixes from the sky branch are retained.

See [main-app integration](docs/main-live-sky.md) for behaviour, focused checks and
remaining visual/device review. The old preview pages remain optional comparisons.

## Goals

- Fast
- Simple
- Mobile-friendly
- No frameworks
- Minimal dependencies
- Easy to maintain
- Publicly hosted using GitHub Pages

## Development Philosophy

Every commit should leave the application in a working state.

Features are added incrementally and tested before proceeding to the next feature.