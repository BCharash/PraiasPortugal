# Main-app live sky — 12 November 2026

The user authorized moving the sky work into the main development app and merging
`preview/sky-background` into local `main`. This supersedes earlier lab-only and
no-main-activation instructions. The sky remains an opt-in preference, not a forced
background. No remote push or deployment is part of this integration.

Implementation commit: `a1f9dbd`.
Starting checkpoint: `d55a8ac`. Local `main` was still at `476d190`; it is an ancestor
of the preview branch. The merge retains the entire branch history, including
6A–6F and the four clock/sunrise/sunset fixes from 6E (`1d52a93`).

## Use

Open `index.html` with Live Server (the normal root URL). On Dashboard, check
**Live sky**. Select a beach if none is selected. Uncheck to immediately restore
the original background and opaque panels. The preference is saved locally.

In Settings → Live sky:

- Animate clouds: on/off. System Reduce Motion remains authoritative.
- Animation speed: 0–1 (default 0.2; 0 freezes movement, 1 is the earlier full speed), independently of five-second weather transitions.
- Panel opacity: 0–100%, default 45%, with text shadows to retain readability.
- Cloud style: revised Composite or previous Individual patches.

Dashboard also has a collapsible Sky conditions readout for total cloud,
independent low/mid/high cover, weather condition, solar elevation and freshness.
Controls/readout support English and Portuguese. Sky defaults off, animation on,
speed 0.2 and Composite style. Invalid stored new settings fall back to safe values.

The sky persists across Dashboard, Beaches and Settings. It represents the selected
beach, uses the existing manager snapshot and solar-minute publication, and never
starts a weather request or timer of its own. Matching stale data stays usable
until hard expiry; missing/expired weather clears cloud and precipitation effects.
No beach means the ordinary fallback, with no invented location/weather.

## Implementation

- `src/js/liveSky.js`: main-app subscription/controller. Creates one renderer on
  enable; disables/removes sky, credits and subscription on disable. It consumes
  app-published location, shared clock and manager-approved weather only.
- `src/js/app.js`: saved options, normalized preferences, controls, translations,
  readout and initialization/lifecycle wiring. Navigation and settings remain
  free of extra environmental acquisition.
- `index.html`: Dashboard checkbox/readout and Settings section; loads shared sky
  assets plus the main controller/styles.
- `src/css/live-sky.css`: readable surfaces scoped to `data-live-sky="enabled"`,
  plus control/readout layout. Turning the sky off removes the scoped styling.
- `src/js/skyBackground.js`: animation speed uses CSS-animation playback rate,
  preserving weather transitions and independent phases. More per-cloud shape,
  proportion and travel variation remains within low/mid/high families. Root and
  individual motion remain independent; no additional weather or animation timer.
- `labs/preview-frame.js`: strips main-app sky controller/assets/controls from its
  copied document before installing preview-owned assets. Fixture/live previews
  remain available without starting a second main-app sky in the same frame.

## Clock fixes explicitly retained

1. Current Lisbon display time is separate from immutable weather model/fetch time.
2. Provider sunrise/sunset dates themselves must match the displayed Lisbon date;
   the existing solar model supplies the next day's horizon after midnight.
3. Sunrise/sunset labels and the sun graphic use the same resolved celestial state.
4. Civil-date arithmetic is independent of the browser timezone/DST; current
   instants carry Lisbon's exact offset through the repeated autumn hour.

`celestialService.js`, `celestialFormatter.js`, `environmentContext.js`,
`weatherTime.js` and `conditions.js` were not changed by this main integration.
The full branch history is retained rather than cherry-picking only artwork.

## Focused verification

Per the user's credit/testing preference, no broad visual lab suite was run.
One temporary Chrome script (`/private/tmp/main-sky-check.py`) used fixed provider
responses and a temporary profile. All actual provider requests were blocked.

Passed: default-off startup; enable/disable; speed/playback-rate updates; opacity
and style options; pause and system reduced motion; navigation without remount;
English/Portuguese controls; preference persistence on reload; repeated toggles
with one/no root and subscription; expiry clearing effects; zero additional weather
or marine calls from controls/navigation. The existing environment contract also
passed in Lisbon, Los Angeles and Tokyo, comparing clock/DST/midnight behaviour,
horizon labels/path values and SVG output. Narrow Dashboard/Settings stills were
inspected. The broad lab harness's default-off assertion was updated for the
intentional fact that the normal entry now loads shared renderer assets.

No actual provider-availability claim or physical iPhone/Safari acceptance is made.
Existing inherited narrow navigation overflow and variable cloud realism remain
review items. User testing in the development main app is the next step.

## Reversal and continuation

Uncheck Live sky for the immediate visual fallback. The integration has its own
local implementation commit on top of the retained branch checkpoints. Do not use
a broad reset that drops the earlier data/clock fixes. Further cloud refinement
can now happen in the main development checkout, as explicitly authorized, with
focused verification and user visual review. No automatic push/deploy is implied.

## Pending user review (uncommitted)

Live sky Settings now sits immediately below Units. Speed range is now 0–1 with plain numeric labels,
with 0.2 as the default; 0 freezes movement and 1 restores the earlier full speed.
All cloud types and sheet openings drift rightward, without the former reverse/
alternating tier motion or vertical wandering. Clouds recycle beyond the view.
Per-cloud speed/shape variation remains. Clock fixes are unchanged. No browser
or lab suite was run for this follow-up; the user will test before any commit.

## Phone composition/smoothness candidate (uncommitted)

Narrow screens and touch layouts up to 1100px now use aspect-preserving cloud
image tiles sized from viewport width, repeated vertically. This replaces the
portrait crop of the wide scene, giving smaller clouds and more visible cloud
shapes. Each tile is a cached snapshot of the same tier's selected shapes, masks,
colour and coverage; it rebuilds on changed inputs or width, not each frame or
Safari address-bar height change.

On this path, three HTML image layers move rightward using 3D transforms instead
of individually animating SVG shapes inside blur filters/masks. This trades
individual per-cloud drift on phones for lighter layer compositing; Mac's
individual-cloud renderer remains unchanged. Speed, pause, Reduce Motion and
freshness clearing still use existing controls/state. No weather requests were
added. Actual iPhone smoothness and composition are pending user testing; no lab
or browser suite was run. Clock/celestial files remain untouched. No commit yet.
