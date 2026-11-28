# CallAssist — change log

Per-work-order records. Status is explicit: **merged** means it is in `main`; **implemented, not merged** means
delivered and tested but unreviewed. Current state and rules: [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Unmerged — work order 6

```text
Update / work order  6 — calendar availability, qualifier date/time, byline typography, quick intro
Status               implemented locally and verified; branch feat/campaign-calendar-wo6 carries docs only
Commit / PR          branch commits 8f482fa, 3526d47, a1a305a, e787b4d, 9283301 (documentation only).
                     No application commit exists yet; the patch lives in the delivery folder.
Base                 index.html blob 574232463219306266848332a4d38b32ccdabec1 (main @ 621796e), sha256
                     fa7bf51eab18bd38d040c97ce187e125d65116cf1bbae5d191e5d31f233b0bd9, 353,763 bytes
Result               index.html blob 4140254020f7c7c8a49d6462a9fe901b215b7f42, sha256
                     826793e636ef2fd5e3b5caa20b716bdf1bc2dbadc082f175392f8847aa9ec3dc, 388,603 bytes
Patch                work-order-6-campaign-calendar.patch — 42,934 bytes, 28 hunks, zero context
                     blob 552c0fc4aee9e9f46f1bb551ea8cac6ebbcb38cb, sha256
                     e448ebbf697c787cea183449e11ff79ae11ce680f4d8fb5a19369bc68d3b9d5e
                     git apply --unidiff-zero on main's index.html reproduces the result blob; cmp clean
Support files        cal-proxy.py (17,953 B, blob 1481d086ef27a570d2e62863290c881245666d7c, sha256
                     88727122779bd7094806a9ec953238d20bcac78b2b955043e768a609b0fdc186)
                     CALENDAR-SETUP.md (7,392 B, blob 6aad5de588dffc18d5215d3260f97030c2d3ac7f)
                     Playwright suites, fixtures and the helper self-test: delivery folder only
```

### What changed

1. Date opens a calendar picker. With a connected source only dates holding open slots are selectable; typed dates
   still work and are labelled `manual`.
2. Time became a dropdown of the chosen day's verified times, with the appointment timezone shown beside it and the
   label *available when checked — not reserved*. Selecting fills the qualifier fields only.
3. Added a `Calendar` button beside `Fields` in the qualifiers header, opening an animated drop panel (grid-row
   transition, no fixed heights) with the booking link, an optional read-only availability endpoint, days ahead and
   timezone, plus Save, Check now, Open calendar and Remove connection. Validation is explicit; the panel collapses
   after a successful save and reopens showing stored values.
4. Status beside the button is the emoji only — not configured, link saved, checking, working, no availability,
   connection error — with the words in the accessible label and the panel line, including the last-refresh time.
5. Availability refreshes on save, connection change, campaign/profile switch, boot and New Call/`F2`. New Call keeps
   the saved calendar, clears this call's date and time, and reports through the desk's standard toast. Each request
   captures a generation number, aborts the previous controller, and discards replies whose generation moved.
6. The campaign `.json` carries `calendar.{url,api,tz,horizon}`, restored on import through both the desk and the
   gate loader, then refreshed. Files predating the field import unchanged and keep the local calendar; undoing a
   load restores the previous calendar. No token, key, header or cached slot is exported, and saving a calendar now
   marks the work file unsaved.
7. `by Kelestios` uses Bodoni Moda with a Georgia fallback; the wordmark was left unchanged. The quick intro gained a
   fifth card covering where the calendar lives, that it saves with the work file, that `F2` refreshes, that the
   timezone and refresh time matter, that selection is not a booking, and what to do when nothing could be read.
8. Repairs found while working, each now covered by a regression check: six invalid capital-U code-point escapes
   inherited in shipped JavaScript that displayed literal text instead of an emoji; an availability window end date
   computed by adding days to a day-of-month, producing requests like `to=2026-11-58`; an attribute concatenation bug
   that meant no calendar date was ever locked; a month grid shifted a day back and titled with the previous month by
   formatting local-noon dates through the appointment zone; a picker that kept a stale success banner after the
   request it described had failed; and a render-blocking webfont link that could delay first paint.

Why: the work order asked for calendar-driven date and time selection with honest availability semantics, without
giving the console any ability to create a booking.

### Checks actually performed

All groups below ran against the **result blob above**. An earlier green run was discarded after it became clear the
browser had been served a cached copy of a previous file; suite URLs now carry a nonce and the served bytes are
hashed and compared with the build before a result is trusted.

| Group | Assertions | Result | Coverage |
| --- | --- | --- | --- |
| Desk suite 1 — panel and live availability | 30 | pass | button placement before Fields; drop measured mid-transition; invalid link refused with the panel still open; save collapses and lights the unsaved dot; reopen shows stored values; removal resets; picker gating against 18 open days plus weekends and booked hours; timezone shown in panel, row and picker; slot dropdown; the existing `data-q` autosave, progress and check-mark logic untouched; `F2` clears and re-requests; journal shows GET only; booking widget host never fetched |
| Desk suite 2 — failures, persistence, staleness | 34 | pass | HTTP error, non-JSON body, JSON without a `days` map, unreachable host, forced 9-second timeout; checked-but-empty treated as verified rather than unknown; an open picker whose banner and locks follow the new state; typed entry marked `manual` sending no request; export shape and secret scan; import into a clean browser with immediate refresh; load-undo; a campaign file without the block; campaign switch mid-flight |
| Desk suite 3 — regression, 1366, reduced motion, wire audit | 26 | pass | work orders 1 to 5 intact: 24-row Agency deck versus Gio's 45-entry deck with decks independent, invalid escapes gone, five intro cards that still fit, Bodoni on wordmark, byline and pill, gold support button, gated timer and verdict pills, panel and rail transitions, divider drag semantics, deletable shipped scripts, boot at 1366 with reduced motion, journal audit |
| Helper self-checks in one process | 12 | pass | ICS parse, UTC to appointment-zone conversion, busy-window subtraction, weekend exclusion, contract shape, window bounds, CORS with the Chrome private-network header, POST refused, malformed window rejected |
| Browser end-to-end through the running helper | 6 | pass | real helper, real ICS feed, delivered file: live slots, the two booked windows gone, unbooked times offered, GET-only against the helper, booking host never contacted, no page errors |

Total **108 automated checks, 0 failures**, plus `node --check` on the extracted script and a byte-exact patch
re-application against live `main`.

### Real versus stand-in verification

- **Real HTTP:** same-origin JSON fixtures and `cal-proxy.py` reading a local ICS feed, through the actual browser
  stack — real requests, parsing, timeouts and cancellation.
- **Not verified:** a live HighLevel/LeadConnector or Google Calendar availability source. No credential was
  available, so the helper's `--source ghl` mode — its candidate endpoint paths, `Version` header, calendar id and
  `GHL_OPS_USER_ID` — is transcribed from documentation and was never answered by a real account; the path list in
  `fetch_ghl` is code, not a ratified contract. What *is* verified is the behaviour when a source cannot be reached:
  error state, no invented times, typed entry retained.
- **Not verified:** the helper observed from a real deployed Cloudflare origin (the localhost private-network
  preflight it answers is unit-checked, not deployment-checked), and any commercial, tax, warranty or program claim
  inside supplied script or objection text.
- Availability fidelity is bounded by the configured source: the desk relays `label` strings verbatim and does no
  timezone conversion of its own.

---

## Merged history on `main`

### Project documentation — 2026-11-28

- Added `docs/PROJECT_CONTEXT.md` and `docs/NEXT_CHANGE_PROMPT.md`, verified application history kept separate from
  proposed calendar work, application and deployment configuration unchanged.

### Work order 5 — merged

- Merge [`621796e`](https://github.com/Kelestios/CallAssist/commit/621796e2184fa96503cefd9cbe244e175e07fd13),
  implementation [`461c3f7`](https://github.com/Kelestios/CallAssist/commit/461c3f7).
- Live-transcription setup guide with popup-blocked fallback; wordmark and campaign typography updated; byline
  period removed; support button restyled; timer and verdict gated by live transcription; separate Agency objection
  deck added with the Gio deck preserved; one malformed emoji escape fixed.
- An extra external Qwen-hosted executable script found in the delivery ZIP's standalone HTML was excluded: it was
  absent from the patch and the expected output hash. Delivery generators, test fragments and manifests were kept
  out of the application repository.
- Validation as recorded then: JavaScript syntax, `git diff --check`, 21 local jsdom integration checks
  (initialization, profiles, objection routes, export data, guide open/fallback/close, branding markup); remote
  `main` verified after merging.
- Limits then: DOM integration checks rather than a fresh run of the delivery's claimed 72 browser assertions; the
  referenced source PDF was not included, so its wording was not independently revalidated; deck inclusion does not
  verify sales, financial, tax, warranty or program claims.

### Work order 4 — merged

- Merge [`1ec143e`](https://github.com/Kelestios/CallAssist/commit/1ec143e), implementation
  [`d32735e`](https://github.com/Kelestios/CallAssist/commit/d32735e). Recorded as the desk UX update; inspect the
  diff for detail rather than inferring a specification from the title.

### Desktop onboarding and campaign work files — merged

- Merge [`0609529`](https://github.com/Kelestios/CallAssist/commit/0609529), implementation
  [`18ac987`](https://github.com/Kelestios/CallAssist/commit/18ac987). Records desktop onboarding and work-file
  updates plus removal of delivery fragments; inspect before changing those behaviours.

---

## Record format for future updates

```text
Update / work order:
Status: proposed | implemented locally | merged
Commit / PR:
Base blob / result blob / patch (bytes, hunks, sha256):
Support files (bytes, blob, sha256):
What changed:
Why:
Checks actually performed (counts per harness, and the exact blob they ran against):
Real vs stand-in verification:
Known limitations / follow-up:
```
