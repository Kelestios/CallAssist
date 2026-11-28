# CallAssist — calendar availability architecture

Work order 6 added read-only campaign-calendar availability. This document records the invariants so a future
agent can change the feature without re-deriving them from the source. Every identifier below was checked to exist
in the built `index.html` (result blob `4140254020f7c7c8a49d6462a9fe901b215b7f42`).

Status: **implemented, not merged.** Artefacts and evidence: [CHANGELOG.md](CHANGELOG.md). Open follow-ups:
[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) section 7. Traps already paid for: [AGENT_PITFALLS.md](AGENT_PITFALLS.md).

## 1. Configuration and state

```text
CAL    = { url, api, tz, horizon }     localStorage key "gceleste.v24.cal", written by saveCal()
CALST  = { state, days, asOf, msg, gen, open, pick, pickMonth, ctl }
```

`CAL.url` is the campaign's public booking page: it powers Open calendar and is passed to the source as context.
`CAL.api` is an optional read-only availability endpoint. They are different things, they are displayed
differently, and only `api` can ever produce slots. `CAL.tz` overrides the appointment zone; otherwise it follows
`SET.campZone` through `ZONES` via `calZone()`.

## 2. State machine

| `CALST.state` | Chip | Panel status line |
| --- | --- | --- |
| `off` | middle dot | nothing saved yet |
| `linked` | link | link saved, live availability not connected |
| `checking` | spinner | checking live availability |
| `stale` | spinner | data predates a change, refreshing |
| `live` | check | link saved and live availability connected, days open, last refreshed, timezone |
| `empty` | warning | checked at a time, nothing open in the window |
| `error` | no entry | connection error with the reason kept, and no times invented |

The header shows the emoji only; the words live in the panel status line and the accessible label, produced from
one place (`calChipHTML`) so the chip, the panel line and the picker banner cannot disagree. `linked` and `live`
must never collapse into one claim: saving a URL is not evidence that availability can be read.

`empty` is a *verified* result — a completed check with nothing open locks those dates. `error` and `off` leave
dates selectable with the fields marked `manual`. Locking dates on a guess would misrepresent a call to the
homeowner, so the distinction is deliberate and tested.

## 3. Source contract

```text
GET <api>?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=<IANA>&bookingUrl=<url>

{
  "tz": "America/Los_Angeles",
  "openWhenChecked": true,
  "reserved": false,
  "days": {
    "2026-11-30": [ { "start": "09:30", "label": "9:30 AM" } ],
    "2026-12-01": []
  }
}
```

- Only GET is issued, with `credentials: 'omit'`, `cache: 'no-store'`, `mode: 'cors'` and an `AbortController`.
  There is deliberately no POST, PUT, PATCH or DELETE path anywhere in this module.
- A `days` object of arrays is required. Keys are normalised through `calParseText`; values may be `{label,start}`
  objects or bare strings; duplicate labels collapse; ordering prefers `start` then label.
- Anything else — non-JSON body, HTTP error, missing `days`, unreachable host, or no reply within 9 seconds —
  becomes `error` with the reason preserved, and no slots are shown. Nothing is ever inferred to fill a gap.
- `label` is copied through verbatim. The desk performs no timezone arithmetic on labels: conversion belongs to the
  source, and `cal-proxy.py` is what performs UTC-to-local translation. This limitation belongs in the docs and
  belongs here, because displayed times that look verified and are not are the worst failure mode available.

## 4. Calendar dates, not instants — the fragile part

Three notions that must not be conflated:

1. **Today in the appointment zone** — `calTodayKey()`, via `calYMD(new Date())`, which formats through `calZone()`.
2. **A calendar date** — a `YYYY-MM-DD` key created and read by `calKey`, `calParts` and `calFmt`. Month grids use
   `calWeekdayOf` for the leading offset and `new Date(Date.UTC(y, m, 0))` for month length, never local iteration.
3. **A typed date** — `calParseText()` accepts the desk's spoken-style forms (`Tue Nov 24`, `Tomorrow`, `Today`,
   `11/24`, ISO, weekday-first) and returns a key, inferring the year and rolling into next year when the date has
   already passed.

Two failures actually happened here and are now regression-tested: formatting a local-noon instant through the
appointment zone shifted every cell one day back and titled the grid with the previous month, and the window end
date was built by adding days to a day-of-month, producing requests such as `to=2026-11-58`.

## 5. Refresh triggers and staleness

| Trigger | Path |
| --- | --- |
| boot with a saved source | `calInit()` then `calRefresh('boot')` |
| save or check now | `calSave()` then `calRefresh('save')`, plus a delayed status-line repaint |
| endpoint or timezone change | `calAfterSwitch()` then `calRefresh('switch')`, bumping `gen` |
| campaign or profile switch | `activate()` then `calAfterSwitch()` |
| New Call, including `F2` | `newCall()` then `calNewCall()` then `calRefresh('newcall')` |

`calNewCall()` clears this call's `S.lead.date` and `S.lead.time` with their auto-fill markers while keeping `CAL`,
then reports the outcome through the desk's standard toast. If the freshly checked data shows the previously chosen
day is now full, the selection is cleared and announced rather than left looking valid.

Every request captures `CALST.gen`, aborts any previous controller, and returns silently if the generation moved
before the response arrived. That is the entire staleness defence, and it is exercised by pointing the desk at a
source that answers after 12 seconds and switching campaign mid-flight.

## 6. Persistence and the work file

- Storage is `localStorage` key `gceleste.v24.cal`. Because `cal` joined the key list inside `markDirty`, saving a
  calendar lights the unsaved dot and prompts Save Work.
- Export: `fullProfile()` adds `calendar: calExport()`, exactly `{url, api, tz, horizon}` — no token, no key, no
  header, no cached slots. `sanitizeProfile()` tolerates a missing block (older files keep the machine's calendar
  and gain an informational note), rejects a non-object, and passes an object through as `p.cal`.
- Import: both the desk path (`importCampaign`) and the gate commit path (`profCommit`) call `calApplyJ(p.cal)`,
  which refreshes only when the configuration actually changed; undoing a load restores the previous `CAL`.
- Exports are scanned for token, api key, authorization, secret, password and bearer fields, and for any frozen
  availability inside the calendar block.

## 7. UI seams

- **Header:** `#btnCal` and `#calChipSlot` sit in `#qualHead .sp` immediately before `#btnFields`; the button drives
  `#calFeature` through `aria-expanded`.
- **Panel:** `#calFeature > div > #calPanelIn`. The animation is the desk's grid-row technique — `0fr` closed,
  `1fr` open, with opacity — so no fixed pixel heights and content changes cannot break it. `calRender()` repaints
  the panel only while it is open, and `calForm()` reads live DOM values before any request, which is why saving
  twice without reopening cannot lose an edit.
- **Panel fields:** `#calUrlIn`, `#calApiIn`, `#calHzIn`, `#calTzIn`, `#calOpenBtn`, `#calTryBtn`, `#calSaveBtn`,
  `#calForgetBtn`, `#calSavedTxt`, and `#calChk` as the live status region.
- **Picker:** `#calPop` holding a `.pkCard` dialog — month header with `#pkPrev` and `#pkNext`, `#pkClose`, the zone
  tag, an availability banner, a Monday-first weekday row, one `button[data-pkday]` per day with its own state class
  and open-slot badge, a times row of `button[data-pktime]`, a typed row `#pkDateTxt` and `#pkTimeTxt` with
  `#pkFill`, and a footer promising that selecting only fills the qualifiers.
- **Qualifier cells:** `inputHTML()` branches to `calDateCell()` and `calTimeCell()`. Date stays a free-text field
  carrying `data-q="date"` that also opens the picker on click; Time is `select[data-q="time"]` when availability is
  verified and a text field otherwise. Both keep flowing through the existing `[data-q]` handlers, so autosave,
  progress, check marks, token substitution and the verdict are untouched.
- **Delegation:** `calBind`, `calFeatClick` and `calPopClick` attach to containers, so re-rendered content cannot
  orphan listeners. Desk single-key shortcuts are suppressed while the picker is open, and Escape closes it.

## 8. Deliberate absences

No booking, reserving, holding, rescheduling or cancelling anywhere in the path. No scraping or headless use of the
booking widget. No third-party CORS proxy and no attempt to bypass access controls. No credentials in the HTML file
or the campaign JSON. No invented slots. When access fails, the desk says so, offers Open calendar, and keeps typed
entry visibly marked as manual.

## 9. Rough edges a future task should take on

- **Calendar configuration is per browser while campaigns are per profile.** `CAL` is global, so switching Agency to
  Gio keeps the other campaign's diary. Per-profile calendar configuration is the most valuable next change.
- No TTL and no background re-check: data is only as fresh as the last trigger, and a long call never refreshes
  itself. Show the age rather than implying freshness.
- No retry, backoff or circuit breaker; a transient failure stays `error` until the next trigger, and the
  9-second timeout is a constant rather than a setting.
- The booking link is only shape-checked: nothing verifies the slug, that the page is live, or that the availability
  endpoint belongs to the same calendar or account.
- Labels are trusted as given. If a source returns UTC-stamped labels, the desk shows the wrong hour; derive the
  zone from the source instead of a typed field.
- The helper's `--source ghl` candidate paths are a fixed list inside `fetch_ghl` and were never answered by a real
  account; see [CHANGELOG.md](CHANGELOG.md) for exactly what is and is not verified.
- No multi-calendar support, no per-day duration or capacity handling, no travel or buffer awareness.
- Availability lives only in memory, deliberately, so each reload costs a fresh round trip.
- Accessibility: the grid is mouse-driven, without roving focus, arrow-key navigation, or live-region announcement of
  refresh transitions.
