# Sky preview acceptance record

Review date: 8 November 2026. Reviewed implementation: `ee8be74` plus the
night-star visibility correction recorded with this review checkpoint.
Branch: `preview/sky-background`.

**Status: local technical review completed; interim Mac appearance accepted.**
The user confirmed that only a Mac browser is available for this review.
Physical iPhone/Safari acceptance is deferred. No live integration, global
activation, deployment or publishing is approved by this record.

The current operating guide and architecture remain in [README.md](README.md).
The toolbar still says Checkpoint 4: checkpoint 5 reviews that implementation,
rather than adding another background feature.

## Environment and reproducible evidence

- Google Chrome `156.0.8078.81`, isolated temporary profile on the Mac.
- Desktop viewport emulation at 1280×900, 768×1024, 390×844 and 320×740;
  device scale factor 1. These are desktop layout checks, not physical mobile tests.
- Three views × four text sizes × four widths = 48 measured layout combinations.
- 22 stills at fixed weather/time and animation phases, including Clear day,
  Mixed clouds, Near-overcast, Rain, Heavy snow, Dusk and Clear night. The mixed
  fixture covers all three views; clear-day captures compare 0/30/100% opacity.
- The existing regression suite also covers all 36 weather fixtures, freshness
  scenarios, intensity/code mapping, pause/reduced motion and request lifecycle.

From the repository root:

```sh
python3 tests/sky-preview-check.py --review-dir /private/tmp/praias-sky-review-2026-11-08
```

Open `/private/tmp/praias-sky-review-2026-11-08/index.html` for the gallery.
`measurements.json` alongside it contains browser metadata, per-view measurements
and matching normal-app baseline measurements. These artifacts are temporary and
can be regenerated; the findings below are the durable record.

## Technical findings

The final checks passed for independent cover and movement, first usable
appearance, five-second later transitions, actual SVG star visibility, exclusive
rain/snow, irregular snow fields, opacity controls, pause/reduced motion, weather
age boundaries, invalid inputs and placeholders. Timeout, cancellation, older
model data, wrong-location responses, a transport ignoring cancellation and
destroy/reset safety also passed. Normal app preferences, startup and navigation
remained isolated from the preview.

All 48 measured layouts retained one viewport-fixed sky during page scrolling.
A visible control could receive programmatic focus in each view. This is a
limited focus check; it does not establish complete keyboard navigation or
accessibility acceptance. The outer lab shell fit every tested width.

### Existing navigation overflow

The preview's content widths match the unchanged normal app in every measured
combination. No additional horizontal overflow was introduced. Widths in pixels:

| Viewport | Small text | Normal text | Large text | Extra-large text |
| --- | ---: | ---: | ---: | ---: |
| 1280 | 1280 | 1280 | 1280 | 1280 |
| 768 | 768 | 768 | 768 | 768 |
| 390 | 390 | 394 | 408 | 421 |
| 320 | 381 | 394 | 408 | 421 |

This inherited navigation layout remains an open finding. It is not fixed as
part of acceptance review and must not be described as a fully fitting mobile UI.

### Corrected SVG star visibility

The initial night capture had no stars. A stronger test reproduced the problem:
the SVG retained its `hidden` attribute even when its JavaScript `.hidden`
property said false. The earlier check inspected that property and missed the
rendered state.

The lab renderer now uses `toggleAttribute("hidden", ...)`. The regression check
asserts both the actual attribute and computed display state. Known clear nights
show stars; daytime, overcast and missing-weather cases retain the correct
visibility rules. This is a scoped behavior correction, with no cloud restyle or
production-file change.

## Visual findings and limits

Representative desktop/mobile-width captures were inspected for composition,
cloud edges, transparency, snow placement and readability. The prior three-row
placement and small snow-dot grid are absent from those captures. No obvious
straight internal SVG blur cutoff was observed in the inspected stills; outer
viewport clipping is intentional. This is a visual observation, not proof for
every size, animated phase or browser engine.

Clouds still have repeated procedural shapes and flattened bases. The softer
reference treatment remains an interim artistic baseline. Passing tests does not
establish realism or subjective visual acceptance.

Bright skies and bright clouds make low-opacity panels more demanding to read.
Text shadows are prominent. The 0% setting is useful for inspecting the sky; it
is not an accepted default readability design. The current 30% lab default also
needs user review, and the 100% comparison remains available. No quantitative
contrast/WCAG certification is claimed.

Motion tests sample direction, phase, duration and transitions deterministically.
The still gallery freezes animation phases for consistent comparison.
The user accepted the interim Mac appearance and short motion review described
below. This does not extend the automated evidence to other browsers or devices.
Safari on Mac was not tested by this Chrome
run; physical iPhone/Safari and Windows were not tested.

## User acceptance checklist

Use Live Server on `labs/sky-preview.html`, on the Mac at a comfortable normal
browser zoom. Review these items and record a decision before live integration:

- [x] Clear day, Mixed clouds and Near-overcast: overall composition, overlap,
  repetition and cloud edges are acceptable as an interim design.
- [x] Rain and Heavy snow: density and movement are acceptable; snow no longer
  reads as a geometric dot grid.
- [ ] Dusk and Clear night: colours, text and night stars are acceptable.
- [ ] Dashboard, Beaches and Settings remain readable at the chosen panel
  opacity, including small secondary text, coloured metrics, inputs and credits.
- [ ] A 20–30-second motion check, Animate sky, Show sky, reset and a system
  reduced-motion check behave acceptably. Try keyboard-only navigation as well.
- [ ] Existing narrow-width navigation overflow is acknowledged, or a separate
  fix is requested. Do not silently count it as passed mobile layout acceptance.

Mac visual decision: **interim appearance accepted on 8 November 2026**.

The user's exact response was: "Accept this interim appearance on Mac".
The review question covered Clear day, Mixed clouds, Near-overcast, Rain and
Heavy snow at 30% panel opacity, including a short motion check. Additional
unchecked checklist items above have not been inferred from that response.

Physical iPhone/Safari decision: **deferred; device unavailable for this review**.
Global readiness decision: **not approved**.

Preserve this accepted interim Mac checkpoint. Address further requested fixes
as separate reversible lab increments.
Any live-data integration needs its own explicit approval, lifecycle audit and
implementation checkpoints. Global activation remains a later decision.
