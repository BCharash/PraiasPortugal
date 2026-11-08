# Weather request ownership — checkpoint 6B

Completed 8 November 2026. Branch: `preview/sky-background`.
Starting commit: `fca7450932d7b1de3fe53931c05e9a28c784d9d3`.
Implementation commit: `b7806a7`.

The existing data manager now owns weather requests through
`src/js/weatherRequests.js`. This module has no DOM, persistent storage or
automatic refresh loop. The normal background/cards and the accepted sky artwork
are unchanged. No live provider calls were used for implementation verification.

## Behavior

- Memory entries are keyed by beach ID **and requested coordinates**, not model
  grid coordinates. At most 20 recent identities are retained; selecting an
  identity moves it to the recent end. Reloading the document loses this cache.
- Duplicate in-flight requests for the same identity join one promise, including
  a forced refresh while that identity is already loading.
- A matching fresh snapshot is reused. A force option bypasses fresh-cache reuse,
  but does not bypass retry backoff or create a duplicate active request.
- A new selected identity supersedes the current request. Waiting callers settle
  immediately, its signal is aborted, and its deadline is cleared. Generation and
  identity guards also reject late results from a transport that ignores abort.
- A/B/A selection is safe even when the final A is served from memory: the first
  A's result token is no longer current. Same beach ID with changed coordinates
  is a different identity.
- The active request has a ten-second deadline. Timeout aborts its signal and
  clears its timer. A valid matching retained snapshot may still be returned;
  no old response can overwrite it after timeout.
- HTTP/service/validation failure preserves only a usable same-location snapshot,
  with its original condition/fetch timestamps. Wrong-location, invalid, expired
  or older-model responses are not accepted as replacement data.
- Retry state is per identity, reusing the data manager's existing 60-second
  exponential policy capped at 30 minutes. Supersession, destruction and an
  AbortError do not increment provider failure counts. Failure at A does not
  block B.
- Getters recompute freshness from condition/fetch age. Stale matching data stays
  usable below 60 minutes; expired data is hidden. There is no automatic timer
  to update the UI or fetch new weather yet; that is checkpoint 6D.

The manager has one authoritative active request/deadline. A superseded physical
transport may still run if it ignores cancellation; it has no authority to change
the cache or current result after being superseded.

## Interfaces and compatibility

```js
const result = await refreshWeatherDataset(beach, {force: false});
// result: {outcome, key, generation, data, freshness, error}

if (isWeatherResultCurrent(result)) {
    // result.data is bound to that identity and still usable/current.
}

getDatasetData("weather", beach); // explicit identity; null if not usable
getDataStatus("weather", beach);  // explicit identity status snapshot
getDatasetData("weather");        // current active identity only
```

Outcomes are `success`, `cached`, `backoff`, `paused`, `error`, `timeout`,
`aborted`, `superseded`, `invalid` and `destroyed`. Superseded/destroyed/invalid
results contain no publishable data. Failure/backoff/pause/timeout results can
carry a still-valid matching snapshot; consumers must still check currentness.

`refreshDataset("weather", beach, options)` remains a boolean compatibility
wrapper: true for accepted or cached data, false for other outcomes. Concurrent
boolean callers share the underlying request. Non-weather datasets retain their
existing path.

Status retains `lastUpdated`, `nextUpdate`, `retryAt`, `status`, `refreshing`,
`pendingRefresh`, `failureCount`, `error` and `data`, and adds identity,
`conditionTimeMs`, `freshness`, `ageMs` and `refreshStatus`. Request status and
freshness are independent. `pendingRefresh` stays false for weather because
callers join or supersede rather than leaving an undrained flag. Weather status
is a snapshot on each read, not a mutable live object to hold indefinitely.

Pause blocks new acquisition while allowing an existing request to settle.
Selecting another identity while paused still supersedes an old request and
does not expose its data as the new location. Automatic visibility/resume
reconciliation is deferred to 6D.

`clearWeatherDataset()` clears only in-memory weather and invalidates prior result
tokens; it does not delete preferences or browser storage. The underlying factory
also has `destroy()` to cancel pending callers and prevent new work. Automatic
application lifecycle wiring remains a later checkpoint.

## Display consumer (updated by 6C)

`displayBeach()` consumes detailed bound results. `owns()` / `isWeatherResultActive()`
checks ownership even for a failed empty result; `isCurrent()` still additionally
requires usable data. A separate display generation guards both weather and marine
publication, including repeated displays of the same beach/cache token. Each dataset
publishes independently. Settings rerender accepted state without acquisition.
See [safe display](weather-display.md) for unavailable rendering and verification.

## Fixture lab adaptation

The lab still controls synthetic weather ages and delayed transport scenarios.
It forces intentional fixture/scenario reads through the normal display path,
supplies valid request metadata for its fixture-card payload, and clears only the
weather memory cache when selecting a new fixture (whose frozen clock may move
backwards). Simulated sky ages stay in the lab controller, rather than weakening
production validation. No accepted artwork, motion or opacity behavior changed.

## Verification

```sh
# Focused service and request-owner contracts, with fake clocks/transports:
python3 tests/sky-preview-check.py --requests-only

# Those contracts, actual-main-app smoke/race checks and all sky regressions:
python3 tests/sky-preview-check.py
```

Both passed. No real forecast/marine network requests were made. The new request
contract covers exact promise joining, fresh reuse, cold/cached A/B/A races,
ignored aborts, immutable location capture, changed coordinates, retry isolation
and cap, old model rejection, condition-age expiry, the exact ten-second deadline,
late timeout results, clear/destroy, pause, bounded memory and legacy wrappers.

The real main app was exercised with mocked provider responses. Unit changes
reused the initial weather request, Celsius/Fahrenheit values and graphic
endpoints remained correct, and a delayed old marine response could not overwrite
a newer beach. The full 36-fixture suite, scenario/freshness, reduced motion,
irregular snow, star visibility, layout comparison, reset and storage-isolation
checks also passed. The 6A contract still passed in Lisbon, Los Angeles and Tokyo.

## Stop and remaining work

6B and the subsequently authorized 6C are saved.
The next checkpoint is 6D refresh/lifecycle (estimated 45–75 minutes), requiring approval.
Automatic refresh/lifecycle notifications remain 6D, shared location/clock 6E,
live sky preview 6F and real-provider verification 6G. Physical iPhone/Safari
review, global activation, deployment and publishing remain deferred.

See [the integration plan](sky-live-integration-plan.md) and
[the accepted fixture guide](../labs/README.md).
