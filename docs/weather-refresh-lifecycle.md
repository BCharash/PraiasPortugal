# Weather refresh and lifecycle — checkpoint 6D

Completed 8 November 2026 on `preview/sky-background`.
Starting commit: `84919d9` (completed 6C handoff).
Implementation commit: `55f3577`.

The existing weather owner now refreshes the selected beach automatically while
the document is visible. It updates the accepted dashboard state on every page;
the renderer still never fetches weather. Global sky activation remains deferred.

## Timing and ownership

`src/js/weatherScheduler.js` supplies one data-manager-owned wake-up for either a
refresh/retry time or a freshness boundary. The existing request manager separately
retains its single ten-second transport timeout. No interval or catch-up loop was
added. Initialization is idempotent, duplicate callers retain the exact joined
promise, and beach switches keep the existing cancellation/generation guards.

- After an accepted response, `nextUpdate` is completion time plus 15 minutes.
  This is independent of the response's condition time. An accepted older model
  can be stale immediately without making the next refresh immediately due.
- Service/validation failure or timeout retains the existing per-identity retry:
  60 seconds, then doubling to a 30-minute maximum. `retryAt` takes priority over
  the normal cadence. Success resets failures. Abort does not increment failures;
  it clears an elapsed retry deadline and waits 60 seconds before another attempt.
- Matching data becomes stale at 15 minutes and unavailable at 60 minutes,
  measuring the older of fetch and condition time. The scheduler notifies at
  these boundaries even if the next request fails or remains pending. Original
  model/fetch timestamps are never advanced to disguise old conditions.
- A location with no data has no freshness boundary; it uses request/backoff timing.
  No selected beach means no scheduled weather work. An invalid request does not
  replace the scheduled identity. Clearing weather also clears the scheduled beach.

## App wiring and lifecycle

`dataManager.js` owns the scheduler and exposes `subscribeWeatherUpdates()`
(returning an unsubscribe function), existing pause/resume functions, and
`shutdownDataManager()`. Test initialization optionally injects `now`, `setTimer`
and `clearTimer`; production uses the normal clock/timers. Notifications include
selected request identity, usable weather (or null) and independently evaluated
freshness/request status.

`app.js` registers one subscriber. It verifies selected beach ID and dashboard
coordinates, then publishes weather/status and rerenders only the visible
Dashboard. Weather state continues updating while Beaches or Settings is open.
Settings/navigation do not initiate weather or marine acquisition.

- Hidden documents pause new acquisition and cancel the scheduler wake-up.
  A valid in-flight request may settle; its transport deadline remains enforced.
- Visibility restoration immediately reevaluates age and starts at most one due
  request. Missed ticks are discarded. Repeated resume events cannot duplicate
  an active request or accumulate scheduler timers.
- `pagehide` with `persisted:true` pauses for browser history restoration;
  `pageshow` reconciles according to visibility. Non-persisted `pagehide` destroys
  scheduler/request state, cancels the transport/deadline and prevents late callbacks
  from resurrecting timers. Initial hidden startup is paused before selection.

Marine/tides retain their 6C independent display and request behavior; this
checkpoint adds no marine scheduler. The existing solar-minute redraw remains
separate and makes no weather request. The fixture lab keeps its controlled
simulation clock and separate scenario controller; it also loads the normal app
scheduler but scenario replacement clears its weather history/scheduled selection.

## Verification and limits

Passed `python3 tests/sky-preview-check.py --screenshot /private/tmp/praias-6D.png`.
All weather/marine responses were mocked; scheduler tests used injected clocks.
No live provider requests, deployment, push or ipma-radar edits were performed.

Focused tests cover old-model cadence, one wake-up, exponential retry, timeout
retry, expiry without network success, hidden settlement, multi-hour hidden gaps,
repeated resume, changed selection, invalid selection, abort after a failed retry,
clear/destroy cleanup, idempotent initialization and subscriber removal.
Actual app tests verify scheduled updates while Settings is open, Dashboard stale
labels, expiry on return, one deferred resume request, repeated persisted history
restoration, shutdown and zero additional marine requests. The full service suite
in three browser timezones, 36 sky fixtures, motion/precipitation/reduced-motion,
preferences and normal-app checks also passed.

Chrome's deterministic lifecycle checks do not establish physical iPhone/Safari
background behavior or live provider availability. Those remain deferred. The
inherited narrow navigation overflow is unchanged. Shared Lisbon celestial clock
consistency is now implemented in [6E](environment-context.md). The opt-in live sky
preview [6F](sky-live-preview.md) is also implemented. Next is provider verification
6G (30–60 minutes), requiring approval. Global activation needs later approval.

Stop here. The implementation is a separate local rollback unit; revert its commit
to restore 6C scheduling behavior. See [the next-step prompt](sky-live-integration-plan.md#exact-prompt-for-the-next-implementation-session).
