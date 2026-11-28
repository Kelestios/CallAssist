# Work order 6 — campaign calendar (merge manifest)

Base: `main` @ 621796e2, `index.html` blob `574232463219306266848332a4d38b32ccdabec1` (353763 B)
sha256 `fa7bf51eab18bd38d040c97ce187e125d65116cf1bbae5d191e5d31f233b0bd9`

Result: `index.html` blob `9f7bb3ca82caa974519b330b39ad7a7064ce0736` (388141 B)
sha256 `14baa9f57df43c4bcd7180f3418be7dc9d81e0f2c6d06396cb2dd72bbd6c08eb`

Patch: `work-order-6-campaign-calendar.patch` — 42465 B, 28 hunks, zero context
blob `54d66535f4ee00d395a14d5fe69d48051743b156`
sha256 `3450e246359e6a577ab642346f2b05c48d9e38559418d15c90a791478d9a1430`

Helper: `cal-proxy.py` blob `1481d086ef27a570d2e62863290c881245666d7c`
sha256 `88727122779bd7094806a9ec953238d20bcac78b2b955043e768a609b0fdc186`

Setup doc: `CALENDAR-SETUP.md` blob `6aad5de588dffc18d5215d3260f97030c2d3ac7f`
sha256 `70fe3c9684db1874cf7987c6aa38fd2464a72cf6f2da43f157bb0f7e03fc50d1`

## Apply

```
git checkout -b wo6 main && git pull
Apply the zero-context patch to index.html:
  git apply --unidiff-zero work-order-6-campaign-calendar.patch
  git hash-object index.html   # must print 9f7bb3ca82caa974519b330b39ad7a7064ce0736
Add the two shipped files:
  mkdir -p docs tools && cp CALENDAR-SETUP.md docs/ && cp cal-proxy.py tools/
```

The full patch, the built `index.html`, both new files and the test suites are in the
delivered work-order folder (they are too large to commit through the connector, which is
why this manifest carries the hashes instead).

## What changed

1. **Qualifiers Date** opens a calendar picker; with a connected source only dates holding
   open slots are selectable. Typing still works and is labelled `manual`.
2. **Qualifiers Time** becomes a dropdown of the source's times for the chosen date, with
   the appointment timezone shown beside it. Picking fills the qualifiers only — the desk
   never books, reserves or submits, and issues GET requests only.
3. **Calendar button** beside Fields, animated open/close (grid row transition). Holds the
   booking link and an optional read-only availability source, the window in days and the
   appointment timezone, with Save / Check now / Open calendar / Remove connection.
   "Link saved" and "live availability connected" are distinct states, never merged.
4. Status chip beside the button: nothing saved, link saved, checking, working, no
   availability, connection error — with the last-refreshed time. Availability refreshes on
   Save, Check now, campaign/profile switch, boot, and **New call / F2**; New call clears
   the previous call's date/time but keeps the saved calendar. Generational guards drop slow
   replies from a calendar you already left.
5. **Campaign .json** now exports `calendar.{url,api,tz,horizon}` and restores it on import,
   then refreshes availability. Older files without the block import unchanged. No token, no
   key, no cached slots are ever exported.
6. **Byline** `by @Kelestios` now uses Bodoni Moda with a Georgia fallback when offline.
7. **Quick intro** gained a Calendar card: where to add the link, that it saves with the
   work file, that F2 refreshes, that times are advisory/not reserved, and what to do when
   no availability could be retrieved.
8. Repaired six leftover invalid `\U0001F…` escapes in shipped JS that printed as literal
   text instead of an emoji, and made the request window compute a real end date.

## Evidence

* 88 Playwright assertions green across three suites — 30 panel/live (button, animation,
  save-collapse, validation retry, picker gating, slot list, timezone, F2 clear and refresh,
  no non-GET anywhere, booking widget never fetched), 31 failure and persistence states
  (HTTP error, non-JSON, wrong shape, checked-but-empty, unreachable, 9 s timeout, manual
  fallback, export/import, undo, older file, stale-reply guard), 26 regression plus 1366 and
  reduced motion (24-row Agency sheet deck and 45-reply Gio deck intact, escapes repaired,
  intro now five cards, gold support button, gated status pills, panel/rail transitions,
  deletable shipped scripts, GET-only wire audit).
* 12 helper self-checks green in one process (ICS parse, UTC→appointment-zone conversion,
  busy windows removed, weekends excluded, contract shape, window bounds, CORS and
  private-network preflight headers, POST refused, bad window rejected).
* 6 end-to-end checks green through the real helper from the browser: live slots appear,
  the two booked windows disappear, unbooked times remain, only GETs hit the helper, the
  booking widget host was never contacted.
* Availability sources used in tests are local fixtures and my own helper reading a local
  ICS feed. **No live Google/HighLevel availability was exercised** — no token was available
  in this environment, which is why the product path refuses to guess and the docs state the
  verified/unverified split.

## Deliberately not done

* No write path of any kind: nothing books, holds, reschedules or cancels.
* No scraping of a booking widget, no third-party CORS proxy, no bypass of access control.
* No credential in the HTML file or in the campaign JSON; tokens live in the helper's
  environment.
* `main` untouched; no merge, no deploy, no branch deletion.
