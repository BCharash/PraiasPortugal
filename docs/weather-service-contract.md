# Weather service contract — checkpoint 6A

Implemented 8 November 2026 on `preview/sky-background`.
Starting commit: `0976be34863555df4ab3718ef54e9a913697aaaf`.
Implementation commit: `fd6722a`.

This checkpoint changes weather acquisition/normalization only. It does not
connect the sky, change the normal background/cards, add refresh loops, or
implement the request ownership planned for 6B. No live provider calls were made.

## Service interface

```js
const weather = await getCurrentWeather(beach, {signal});
// Existing callers may continue using getCurrentWeather(beach).
```

The beach needs a nonempty string or finite numeric ID, finite latitude within
±90 and longitude within ±180. The service captures those values before awaiting,
so a caller cannot retarget an in-flight response by mutating the beach object.

There is one request to the existing Forecast API. `is_day` is now correctly
included in the current-variable list; there is no bare `is_day` parameter or
trailing comma. Intended weather, hourly and daily variables and the Lisbon
timezone are retained. No extra request is made for timestamps.

Existing successful-response fields remain available: model-grid coordinates,
civil times, temperature, humidity, wind, UV, independent cloud bands,
precipitation, hourly data, sunrise/sunset and moon fields. Existing description,
icon, unit and translation behavior for valid data is preserved.

## Additive metadata

| Field | Meaning |
| --- | --- |
| `requestedBeachId` | Captured requested beach ID. |
| `requestedLatitude`, `requestedLongitude` | Captured requested coordinates; distinct from returned model-grid `latitude`/`longitude`. |
| `conditionTimeMs` | Current conditions' valid instant in Unix milliseconds, or null if the time/offset cannot be validated. |
| `fetchedAtMs` | Browser retrieval time in Unix milliseconds, after JSON retrieval. |

`src/js/weatherTime.js` strictly parses the provider's bare ISO civil timestamp
and explicit fixed `utc_offset_seconds`, using UTC calendar operations. It does
not use the browser timezone to guess an instant. Invalid calendar dates, malformed
strings and missing/noninteger/out-of-range offsets return null. Optional seconds
are supported. All existing valid civil strings remain unchanged.

This follows the timestamp/offset contract described in the
[Open-Meteo documentation](https://open-meteo.com/en/docs), checked during planning.
It does not migrate hourly/daily output to Unix time or claim to repair the
provider's fixed-offset forecast-range DST behavior.

## Validation and missing data

- HTTP failure, malformed JSON, provider error payloads, missing/malformed current
  objects, empty current schemas and invalid model coordinates reject explicitly.
- Missing optional daily/moon fields no longer discard valid current weather.
  Unknown numeric values become null; valid zero values stay zero. Numeric strings
  are not silently converted into measurements.
- Finite cloud values are independently clamped to 0–100. Missing/non-numeric
  cloud values remain null. The three bands are never summed or normalized.
- `weatherCode` must be an integer. `isDay` is true for 1, false for 0 and null
  when unknown; day-dependent icons remain unknown when day/night is unavailable.
- Optional hourly data is null if its time/array structure is incomplete or
  invalid. Valid time strings and requested numeric-array values are preserved;
  missing numeric entries are explicit nulls.
- Valid future/old condition instants remain metadata. Freshness policy belongs
  to the pure evaluator and later data-manager work, not a service-owned timer.

An optional `AbortSignal` is forwarded to fetch and checked before fetching,
after the response and after JSON retrieval. A late result is rejected when the
signal was aborted even if the mocked transport ignored it. No timeout or refresh
timer is introduced here; 6B will own deadlines and request generation.

## Shared semantics and unchanged components

`src/js/weatherState.js` contains the lab-tested pure WMO mapping and freshness
evaluator. `labs/sky-weather-state.js` now delegates those pure functions to the
shared module and retains only its simulated transport controller. The normal
app loads the pure helpers before the weather service; loading them does not
fetch data or render a sky.

The current production description/icon functions and formatters are retained;
product-facing mapping/translation consolidation remains part of 6C. The actual
data manager, display/controller, Conditions renderer, celestial service,
background and styles were not changed by 6A.

## Verification

All provider responses in these checks are fixed mocks. The standalone contract
page also blocks network fetches with CSP.

```sh
# Contract only, in three browser timezones:
python3 tests/sky-preview-check.py --service-only

# Contract, actual-main-app smoke test, then full fixture-preview regressions:
python3 tests/sky-preview-check.py
```

Checks passed in Europe/Lisbon, America/Los_Angeles and Asia/Tokyo for:

- All existing valid normalized fields plus requested identity and time metadata.
- Query membership, one request per service call, explicit winter/summer offsets,
  repeated autumn hour, spring transition and invalid date/offset handling.
- Temperature/wind/humidity formatting and existing celestial-service inputs.
- Null/zero values, missing daily data/temperature, malformed numbers/hourly data,
  invalid schemas, HTTP/network/JSON errors and invalid requested beaches.
- Forwarded cancellation, pre-abort without fetching, a late JSON result ignoring
  cancellation, immutable request identity and the shared pure evaluator.

The actual main app was then loaded with mocked weather/marine provider responses,
using its real services, data manager, controller and formatters. It made one
initial weather request; Dashboard weather was the same object held by the data
manager, with correct humidity, wind and UV. Celsius/Fahrenheit rendering passed;
the original sunny body background remained and no sky was mounted. Existing
settings-triggered refresh behavior was preserved, not redesigned.

The full 36-fixture suite, freshness simulations, motion/reduced-motion, star
visibility, irregular snow, layout comparisons, reset cleanup and preference
isolation also passed. No physical Safari/iPhone or real provider behavior is
claimed by these deterministic checks.

## Next stop and limitations

### Follow-up: temperature graphic units

After the user confirmed the normal app worked, they reported a pre-existing
scale-label bug: the main temperature converted to Fahrenheit, but the graphic's
low/high endpoints still displayed Celsius values. The follow-up in
`src/js/conditions.js` routes both endpoint labels through `convertTemperature()`.
The marker calculation is unchanged because its relative position is the same
in either unit. The mocked main-app check now verifies 14°–21° in Celsius,
57°–70° in Fahrenheit, an unchanged marker position and switching back to Celsius.
The full service/app/lab suite passed again. This does not start checkpoint 6B.

6A is complete. The subsequently authorized 6B work is now saved as `b7806a7`;
see [weather request ownership](weather-request-ownership.md) for location-keyed
memory, joined requests, timeout, retries and basic display result guards.
The current stopping point is before 6C. Metadata alone did not establish those
protections; they are implemented in the separate request owner.

Unknown optional values now reach consumers as null. Complete unavailable-state
presentation, including unknown lunar values and old reading/marker cleanup,
remains in 6C. 6B now evaluates condition/fetch age on reads; UI freshness
notifications and automatic refresh remain 6D. Live weather smoke testing remains in 6G; cold
offline readiness and new persistent caching are outside this work.

Use [the integration plan](sky-live-integration-plan.md) for the remaining
checkpoints and [the lab guide](../labs/README.md) for the accepted visual baseline.
