# Work order 6 — campaign calendar (merge manifest)

Final hashes, regenerated after the last build. Base is `main` @ 621796e2.

| artefact | git blob | sha256 | bytes |
|---|---|---|---|
| `index.html` before | `574232463219306266848332a4d38b32ccdabec1` | `fa7bf51eab18bd38d040c97ce187e125d65116cf1bbae5d191e5d31f233b0bd9` | 353763 |
| `index.html` after | `f731294d72605101a3be9a74bae4c21870203f0b` | `6c345cf6b431b77b84d5a22dd404e11d67da7a9d97527be0e9799b2f698a326b` | 388245? |
| patch (`work-order-6-campaign-calendar.patch`) | `f0f357dee65178a2eaf7989954231158c5d446fc` | `3b5f9f95b74d6ca681d0b57640e0e3c03ca7e1f38dcc70f49c612d54f2c77d83` | 42691 |
| helper (`tools/cal-proxy.py`) | `1481d086ef27a570d2e62863290c881245666d7c` | `88727122779bd7094806a9ec953238d20bcac78b2b955043e768a609b0fdc186` | 17953 |
| setup doc (`docs/CALENDAR-SETUP.md`) | `6aad5de588dffc18d5215d3260f97030c2d3ac7f` | `70fe3c9684db1874cf7987c6aa38fd2464a72cf6f2da43f157bb0f7e03fc50d1` | 7326 |

Verified: applying the zero-context patch to `main`'s `index.html` reproduces blob
`f731294d72605101a3be9a74bae4c21870203f0b` byte-for-byte (`git apply --unidiff-zero`, then
`cmp`). `node --check` on the extracted script is clean.

## Apply

```
git checkout -b wo6 main
git apply --unidiff-zero work-order-6-campaign-calendar.patch
git hash-object index.html      # → f731294d72605101a3be9a74bae4c21870203f0b
mkdir -p docs tools             # CALENDAR-SETUP.md and cal-proxy.py ship in this branch
```

The full `index.html`, the patch and the Playwright suites live in the delivered work-order
folder; the patch is too large to commit through the connector, which is why its hash is
recorded here instead.

## What changed

1. **Date** opens a calendar picker. With a connected source, only dates holding open slots
   are selectable; typed entry still works and is then labelled `manual`.
2. **Time** becomes a dropdown of the source's times for the chosen date, with the
   appointment timezone shown beside it. Choosing fills the qualifiers only — nothing is
   booked, reserved or submitted, and the desk issues GET requests only.
3. **Calendar** button beside Fields, opening an animated drop (grid-row transition) holding
   the booking link, an optional read-only availability source, the window in days and the
   appointment timezone, with Save / Check now / Open calendar / Remove connection. Status is
   the emoji alone beside the button: nothing saved `·`, link saved `🔗`, checking `⟳`,
   working `✅`, nothing open `⚠️`, connection error `🚫` — the words stay in the panel
   status line and the accessible label. "Link saved" and "live availability connected" are
   never merged into one claim.
4. Refresh on Save, Check now, boot, campaign/profile switch and **New call / F2**. F2 clears
   the previous call's date/time, keeps the saved calendar, and pops a toast in the desk's
   usual style. Generational guards plus an AbortController mean a slow reply from a calendar
   or campaign you already left is dropped rather than painted.
5. Campaign `.json` exports `calendar.{url,api,tz,horizon}` and restores it on import, then
   refreshes. Files from before this feature import unchanged and keep the local calendar.
   No token, key, header or cached slot is ever exported.
6. `by @Kelestios` now uses Bodoni Moda with a Georgia fallback; the wordmark is unchanged.
7. The quick intro gained a Calendar card (where to add it, that it saves with the work file,
   F2 refreshes, times are advisory and unreserved, what to do when nothing could be read).
8. Repaired six invalid `\U0001F…` escapes in shipped JS that printed as literal text instead
   of an emoji, and the availability window now computes a real end date.

## Evidence (all re-run on the final build)

* **87 Playwright desk assertions, 0 failures**, in three suites: 30 panel + live availability
  (button placement, animation measured mid-flight, validation refusal, save-collapse, work-file
  prompt, reopen shows values, remove clears, picker gating by open slots, timezone display,
  slot dropdown, token resolution, F2 clears and re-requests, GET-only, widget never fetched);
  31 failure and persistence states (HTTP error, non-JSON, wrong shape, checked-but-empty,
  unreachable, 9-second timeout, manual fallback typing, export shape, import, undo, older
  file, stale-reply guard); 26 regression plus 1366 and reduced motion (24-row Agency sheet
  deck vs 45-response Gio deck intact, escapes repaired, intro now five cards and still
  fitting, gold support button, gated status pills, panel/rail transitions, deletable shipped
  scripts, network journal audit).
* **12 helper self-checks** in one process: ICS parse, UTC→appointment-zone conversion,
  busy-window subtraction, weekend exclusion, contract shape, window bounds, CORS plus
  Chrome's private-network preflight header, POST refused, malformed window rejected.
* **6 end-to-end assertions through the running helper from the browser**: live slots, the two
  booked windows gone, unbooked times present, only GETs reached the helper, the booking
  widget host was never contacted, no page errors.

## Honest split of what was verified

* Verified against real HTTP: same-origin JSON fixtures and my own helper reading a local
  ICS feed — real requests, real parsing, real timeouts.
* Not verified: a live HighLevel/LeadConnector or Google Calendar availability source. No
  token was available here, so the helper's `--source ghl` endpoint paths, `Version` header
  and response shape are taken from documentation, are configurable, and are called out in
  the code as "configured by you, verified by you". The desk's behaviour in that case is the
  tested failure path: connection error, no invented times, typed entry kept.
* Confirmed absent by code and network journal: any POST/PUT/PATCH to any calendar endpoint.

## Not done on purpose

No booking, reserving, holding, rescheduling or cancelling; no widget scraping; no
third-party CORS proxy; no credential in the HTML file or campaign JSON; no deploy and no
change to `main`.
