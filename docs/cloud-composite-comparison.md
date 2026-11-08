# Dense-cloud comparison — reported 96% overcast case

8 November 2026. Branch: `preview/sky-background`.
Implementation: `0be01fb`.
Starting checkpoint: `685f510` (6F plus sky-input readout and launch instructions).
This is a preview-only visual candidate, awaiting user review. 6G provider
verification and global activation remain deferred.

## See it

Refresh either preview through Live Server:

- `labs/sky-live-preview.html`: current real weather drives the revised renderer.
- `labs/sky-preview.html`: select **Reported showers · 96/77/90/23** under Fixed
  weather to reproduce the user's reference independently of changing live data.

Both toolbars have **Cloud rendering**: **Revised composite** (default) and
**Previous patches** (the accepted interim baseline). Switching redraws the same
weather immediately and makes no request. Uncheck Animate sky to compare stills;
keep panel opacity fixed, initially 30%. Show sky still compares the normal app
background, separately from the two cloud treatments. Expand Sky inputs to see
the active rendering, coverage, effect, solar elevation and colour treatment.

The fixed case is total 96%, low 77%, mid 90%, high 23%, WMO 80 (light rain
showers). Its November 7 Lisbon time is 17:03, giving a solar elevation rounded to
4.2 degrees at Santa Rita. The solar angle is calculated using the shared clock
and beach coordinates, not overridden. Other beaches can produce slightly
different angles. This is a synthetic reproduction of the reported conditions,
not a saved provider response or a compass-specific reconstruction.

## Change

`src/js/skyBackground.js` now blends dense low/mid patches into independent
continuous cloud sheets above 60% tier coverage, reaching the full sheet treatment
at 90%. Each sheet has a different stable pattern of soft irregular openings
that shrink with its own tier coverage, with subtle static texture. Its existing
CSS drift wrapper carries both sheet and patches, preserving independent movement
and stable nodes. Coverage is neither summed across tiers nor forced to match a
particular measured screen fraction. High cloud retains the accepted thin veils.

Clear, mixed and single-tier cases at 60% or below keep their original patch
opacity/treatment. High-only scenes are unchanged. For revised low-sun overcast
precipitation, the existing golden-hour branch now chooses a neutral rain-grey
palette rather than the previous blue/slate gradient. The baseline selector keeps
both the old patch rendering and old palette branch.

No horizontal low/mid/high bands were introduced. This is an illustrative
composite from the ground without a specified bearing. Dense low and mid cloud
overlap spatially; the method does not locate individual real clouds in the sky.

`src/css/sky-background.css` adds sheet/opening transitions to the existing
five-second update contract. First data, changed location, missing/expired weather
and manual rendering comparisons apply immediately. Pause and reduced motion
still apply. Rain/snow, provider attribution and the existing manager/solar owners
are retained; no requests, timers or stored preferences were added.

The fixture/live adapters expose the renderer comparison to their toolbar and
refresh the readout after switching. Both use the same renderer. The normal entry
still loads no sky renderer/styles; its appearance and cards are unchanged.

## Verification and checkpoint

Passed: `python3 tests/sky-preview-check.py --screenshot /private/tmp/praias-cloud-composite.png`.
Every provider response is mocked. Tests cover all 37 fixtures, independent tier
values, original clear/mixed/high-cloud treatments, dense sheet activation and
immediate expiry removal, identical-data/no-request comparison in fixture and live
previews, motion/reduced motion, preferences and normal-app isolation. The existing
three-timezone/DST, request owner, lifecycle and display checks remain included.

The command writes matched baseline/revised screenshots at 1280px and 390px:
`-reported-baseline-1280.png`, `-reported-revised-1280.png`, and their 390px variants.
The comparison uses paused drift and the same weather. Desktop/narrow revised
stills and the desktop baseline were inspected. Screenshots are temporary
review artifacts, not committed app assets. User visual acceptance remains open;
Chrome screenshots do not establish physical iPhone/Safari performance of the new
SVG masks/textures.

Reversal: select Previous patches immediately, or revert the separate visual
implementation commit to remove this candidate while retaining earlier checkpoints.
No ipma-radar edits, live-provider testing, deployment or push are part of this work.
