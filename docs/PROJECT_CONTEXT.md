# CallAssist — Project Context and Change Log

Orientation for users and AI agents working on [Kelestios/CallAssist](https://github.com/Kelestios/CallAssist).

**Updated:** 2026-11-28. **Latest local application blob:** `67b281fdefbcdf558054be38660a7f48b1f019ae` (work order 7, implemented locally, **not yet merged**). **Last reviewed/merged blob:** `cacb78dd16ea896e0b4021e8b1f7f7217c73e74c` (v9 / work order 6). Use the commit containing each entry for its merge history.

This is a snapshot, not a claim that the repository will remain unchanged. Check the current branch and source before starting a new work order.

## 1. What this project is

CallAssist is a desktop-oriented HTML call-assistance console. It helps an agent follow a campaign script, handle objections, collect qualifier details, maintain call context, and save campaign work.

It combines deterministic objection routing with optional live transcription and an optional off-script LLM Brain. Scripted replies do not require an LLM request. External services are needed for the optional transcription/Brain integrations; a locally saved HTML file is not a bundled AI server.

The app supports separate campaign profiles, including Agency Script and Gio Script. Their scripts and objection decks are distinct and should remain distinct unless a work order specifically changes them.

## 2. Repository layout and source of truth

```text
CallAssist/
├── index.html                 # Current application: markup, styles, and JavaScript
├── tools/
│   └── cal-resolver.mjs       # Optional local LeadConnector slug→Calendar-ID resolver (read-only)
└── docs/
    ├── PROJECT_CONTEXT.md     # Orientation, change log, and pending scope
    └── NEXT_CHANGE_PROMPT.md  # Reusable prompt for future work
```

Keep documentation consolidated into these two files. PROJECT_CONTEXT.md owns the implementation record, change log, calendar setup, pitfalls and pending work. NEXT_CHANGE_PROMPT.md is the reusable task template. Do not create parallel copies of these records.

The `docs/` directory organizes documentation; it does not automatically exclude it from Cloudflare deployment. If the deployment publishes the whole repository root, these documents may also be publicly served. The Cloudflare deployment settings have not been inspected or changed for this documentation update.

**The application file is `index.html`, not `main.html`.** If a request calls it main.html, verify the tree and normally apply the requested app changes to index.html. Do not introduce a duplicate application file or rename the entry point without a reason and explicit scope.

Use current Git source and commit history to resolve implementation questions. Delivery ZIPs, patch manifests, old console copies, and this document are supporting context; inspect them before relying on their claims.

## 3. Current implementation

- Desktop call desk, campaign scripts, objection decks, qualifiers, call controls, and onboarding.
- Campaign work-file JSON export/import and browser-local settings.
- Optional live transcription with separate Whisper STT and Brain connection settings.
- Separate STT URL/model/key fields and Brain URL/model/key fields already exist in the current app.
- Browser speech recognition is a different path from local Whisper transcription. Verify the selected audio source when testing.
- A live-transcription setup guide opens separately and has an in-app fallback when a popup cannot open.
- The call timer and verdict header pills are gated by the live-transcription setting.
- Bodoni Moda is used for the wordmark, byline and campaign pill, with fallback fonts.
- Qualifiers include Calendar settings, a date picker and available-time dropdown when connected to a compatible source. Link-only and error states retain manual entry. The date/time row is decluttered (calendar button + chosen result only); manual/timezone detail lives in titles, the status chip and the picker.
- Calendar configuration saves with campaign JSON. F2 clears the previous appointment and refreshes availability; boot, save/check and imports also refresh. No calendar booking is performed.
- A read-only LeadConnector/GoHighLevel adapter reads live open times via the provider's CORS-open `free-slots` API once a Calendar ID is known; an optional local `tools/cal-resolver.mjs` resolves a booking slug to that ID. The generic JSON endpoint is still supported and wins when both are set.
- Qualifiers panel width is drag-resizable (`#qualDivider`, persisted browser-local). Collapsed Settings is an amber vertical rail; the expanded Settings hide button pulses. Script placeholder chips are compact inline-blocks.
- The support button has gold styling and a hover effect.
- Agency Script has its own 24-entry objection deck across eight categories. Gio Script retains its separate 45-entry deck.

An earlier November 19 console had one shared transcription/Brain URL field. **That diagnosis does not describe the current repository.** Do not reintroduce or re-fix the old structure without checking the current code.

## 4. Verified change log

### Work order 7 — implemented locally, awaiting review (NOT merged), 2026-11-28

Status: implemented locally on a working branch off `main` (`9741e03`). Not pushed, merged or deployed. Application blob `67b281fdefbcdf558054be38660a7f48b1f019ae`; adds `tools/cal-resolver.mjs`.

What changed (only the requested items; previous merged work preserved):

1. **LeadConnector live-availability adapter (read-only).** The desk can now read real open times from a GoHighLevel/LeadConnector campaign calendar instead of only a custom JSON endpoint.
   - Verified provider facts (live probes, 2026-11-28): `GET https://backend.leadconnectorhq.com/calendars/{calendarId}/free-slots?startDate=<ms>&endDate=<ms>&timezone=<IANA>&sendSeatsPerSlot=true` answers **any origin** (`Access-Control-Allow-Origin: *`), no key and no custom headers; body is `{"YYYY-MM-DD":{"slots":{"<ISO instant>":seats}},"traceId":…}`. The slug→ID resolver `…/calendars/bookings/get-widget-data?slug=` is **origin-locked** to LeadConnector domains (404 from localhost/Cloudflare), and the booking page HTML sends **no CORS headers**. The user's example link `…/widget/bookings/northvelvetpath1b` currently returns **404 (inactive)**.
   - New `CAL.ghlId` (calendar ID) and `CAL.resolver` (optional resolver URL) persist with the campaign JSON (`calExport`/`calApplyJ`, validated). `ghlSlug`, `ghlLooksId`, `ghlResolve`, `ghlDays`, `ghlRefresh` added. `calRefresh` uses the adapter when no generic `CAL.api` is set but a calendar ID is known; the generic endpoint still wins when both are set. Slots are labelled in the Appointment TZ; generation guard, 9s timeout, abort, and live/empty/error states mirror the generic path. **No booking writes.**
   - **`tools/cal-resolver.mjs`** (Node 18+, no deps): a tiny local helper that resolves a booking slug to a calendar ID server-side (no browser Origin, so the provider lock does not apply) and returns `{calendarId,timezone,name}`. It only resolves — it does not parse or proxy slots and never books. Run `node tools/cal-resolver.mjs` (127.0.0.1:8788), set the desk Resolver URL, press **Resolve from link**. Alternatively paste the Calendar ID once. This replaces the previously excluded `cal-proxy.py`; it is deliberately minimal and avoids that helper's guessed routes / free-slot subtraction / ICS fallback.
1b/1c. **Decluttered Qualifiers date/time entry.** The row now shows only the 🗓️ calendar button and the chosen result. Removed the duplicate "manual" pills and the per-row timezone label; that detail moved into field titles, the status chip beside the Calendar button, and the picker. Timezone is decided once by the Appointment TZ selector.
2. **Smaller script placeholder chips.** `.tok` is now `display:inline-block` with reduced font (`--tok:.6em`, `--tok-empty:.52em`), `--tok-pad:0 4px` and `line-height:1.2`, so the chip box no longer overlaps the line above/below.
3. **Resizable Qualifiers.** New `#qualDivider` handle between Qualifiers and the script; drag left/right adjusts `--rightW` (clamped 260–680px), persisted browser-local (`gceleste.v24.qualW`); double-click or Reset Layout restores the CSS default. Hidden when Qualifiers are collapsed.
4/4a. **Settings hide button + collapsed rail.** `#btnCfgHide` carries a continuous gentle pulse (`cfgHidePulse`) while expanded (disabled by the existing reduced-motion rule). Collapsed settings is now an **in-flow vertical rail** (`#configTab`, leftmost in `#cols`) mirroring the Qualifiers rail but with an **amber** line (`--g-sun`) instead of green; it is no longer a fixed floating tab.

Checks actually performed (distinguish real vs mocked):
- **58 mocked jsdom checks, all passing** (`/tmp` harness, mocked `fetch`): adapter unit (slug/ID validation, `ghlDays` normalization/sort/dedupe/timezone), declutter assertions, chip CSS, rail/pulse toggling, divider visibility + `setQualW` clamps/persistence, export/import round-trip + rejection, GHL live/404/empty paths, resolver path, and generic-endpoint regression (live + tz-mismatch rejection).
- **13 REAL integration checks, all passing** (live network, no mock): resolver `/health` and real slug→ID for a known-active public calendar (`communityfc` → `PuXqhrj8kqMGPDAdgg5u`), dead-link and non-GHL rejection; live `free-slots` HTTP 200 + `ACAO:*` from a localhost Origin; and the desk adapter end-to-end in jsdom using **real fetch** (resolve via the running resolver → `calRefresh` reaches `live`, open days > 0, label in Appointment TZ, verified time select). The test calendar is a third-party public calendar used read-only; no booking was made.
- **9 REAL campaign checks, all passing** against the user's corrected link `northvelvetpath` (resolver → `HsnCG1cFP5kgDX57I5tC`, `America/Los_Angeles`): desk reaches `live`, 4 open days, first day 24 slots labelled in PT, verified time select, 0 manual pills, and picking a day/time fills the qualifiers with no booking.
- **Real-browser layout checks** (Chromium via Playwright, served over `http://127.0.0.1:8090`): `.tok` computed `inline-block`; hide button `animation-name:cfgHidePulse`; datetime row has 0 manual pills / 0 tz labels and the pick button; collapsed `#configTab` is `position:relative`, first child of `#cols`, 46px rail with amber line, `#configPanel` animates to 0; dragging `#qualDivider` resized `--rightW` 372→457px and persisted. No JS console errors (only expected AudioContext autoplay warnings).
- `node --check` on the resolver and a `vm.Script` syntax check of the app script.

Known limitations / follow-up:
- The user's first example slug (`northvelvetpath1b`) was inactive (404); the corrected campaign link `…/widget/bookings/northvelvetpath` is **live and verified** (Calendar ID `HsnCG1cFP5kgDX57I5tC`, `America/Los_Angeles`, "North NorCal Energy Geeks Qualified Solar Appointments"). The desk adapter was run end-to-end against it with real fetch (9/9 checks: resolve → live, 4 open days, 24 slots on the first day labelled in PT, verified select, decluttered row, day/time pick fills qualifiers without booking).
- Auto slug→ID resolution still cannot run from a third-party origin without the resolver script (provider origin lock). Without it, paste the Calendar ID once.
- No fresh microphone, Cloudflare deployment, or hosted-CORS test. Animation verified by computed style + screenshot, not a formal accessibility audit. The resolver is a local convenience, not a deployed backend; a hosted frontend needs a reachable resolver or a pre-set Calendar ID.
- Per-profile calendars, freshness/TTL, and typed-date timezone caveats from work order 6 remain unchanged.

### Work order 6 / v9 — reviewed frontend merge, 2026-11-28

Source: user-supplied v9.zip, plus updates.zip and the documentation branch `feat/campaign-calendar-wo6`. Before this merge, main was `2926da5`; the documentation branch still had the same old application blob `574232463219306266848332a4d38b32ccdabec1`. Its seven supplied documentation files matched updates.zip byte-for-byte. The new app code was in v9.zip, not in that branch's index.html.

- Added Calendar beside Fields, animated settings panel, date picker, source-fed Time dropdown, explicit appointment timezone, refresh status, F2 refresh and JSON configuration persistence.
- Added calendar onboarding guidance and Bodoni Moda byline styling; preserved separate Agency/Gio decks and previous work.
- Removed an injected Qwen-hosted external executable script. After removal, the incoming HTML matched the final delivery SHA-256 `826793e636ef2fd5e3b5caa20b716bdf1bc2dbadc082f175392f8847aa9ec3dc` and blob `4140254020f7c7c8a49d6462a9fe901b215b7f42` exactly.
- Review fixes: clearing a connection invalidates pending requests; refresh discards old slots; late JSON errors cannot overwrite newer state; an empty days map locks the picker as a checked-empty result; malformed dates/lists/labels and conflicting source timezone are rejected; identical-config imports refresh; calendar listeners bind only once; unoffered typed times say manual/unverified; the timezone label no longer adds a contradictory campaign abbreviation.
- Consolidated the useful content from Qwen's context, changelog, setup, architecture and pitfalls documents into this file. Removed obsolete references from the app/template. Duplicate `(1)` files, screenshots, manifests and raw logs were not added. Existing remote feature branches were left intact as history.
- **Excluded cal-proxy.py.** Review found guessed provider routes, free-slot parsing dependent on finding busy events, timezone ambiguity, and ICS fallback parsing that omits recurrence and can miss multi-day conflicts. Its working-hours subtraction is not reliable provider availability. Do not install it from the ZIP on the assumption this merge approved it. No replacement backend is included.

Checks actually run on reviewed application blob `cacb78dd16ea896e0b4021e8b1f7f7217c73e74c`: JavaScript syntax plus **21 existing regression checks and 27 calendar checks, all passing**, using jsdom and mocked fetch. Coverage includes initialization, profiles/decks/routes, guide behavior, export configuration, date selection, GET-only requests, empty/error data, timezone mismatch, stale requests, removal and new-call refresh. Git whitespace checks and remote blob verification accompany publication.

Verification limits: no fresh browser layout/animation/accessibility test, microphone test, live calendar-provider request, or Cloudflare deployment test. The supplied logs report 108 passing checks against the unmodified delivery blob (90 browser, 12 helper, 6 helper end-to-end); these are historical producer evidence, not checks rerun here and not proof the final reviewed build or real campaign works. Do not combine them with the 48 checks above.

### Project documentation — 2026-11-28

- Added `docs/PROJECT_CONTEXT.md` and `docs/NEXT_CHANGE_PROMPT.md` for user and AI-agent orientation.
- Documented verified application history separately from proposed calendar work.
- Kept the application and deployment configuration unchanged.
- Validation: document paths, repository layout, and unchanged application blob checked before publishing. Use Git history for the documentation commit reference.

### Work order 5 — merged

- Merge: [`621796e`](https://github.com/Kelestios/CallAssist/commit/621796e2184fa96503cefd9cbe244e175e07fd13).
- Implementation: [`461c3f7`](https://github.com/Kelestios/CallAssist/commit/461c3f7).
- Added the live-transcription setup guide and popup-blocked fallback.
- Updated wordmark/campaign typography, removed the byline's trailing period, and updated the support button.
- Limited timer/verdict header visibility to the live-transcription setting.
- Added the separate Agency objection deck; preserved the Gio deck.
- Fixed one newly introduced malformed emoji escape in the guide.
- Applied the supplied patch against its exact main base. Before the emoji correction, the normalized output matched the delivery manifest's SHA-256.
- Excluded an extra external Qwen-hosted executable script found in the ZIP's standalone HTML. It was absent from the patch and expected output hash.
- Kept delivery generators, test fragments, and manifests out of the application repository.

Validation performed: JavaScript syntax, `git diff --check`, and 21 local jsdom integration checks covering initialization, profiles, selected objection routes, export data, guide open/fallback/close behavior, and branding markup. Remote main was verified after merging.

Limits: these were DOM integration checks, not a fresh run of the package's claimed 72 browser assertions. The referenced source PDF was not included, so its wording was not independently revalidated. Inclusion in the Agency deck does not independently verify its sales, financial, tax, warranty, or program claims.

### Work order 4 — earlier merged baseline

- Merge: [`1ec143e`](https://github.com/Kelestios/CallAssist/commit/1ec143e).
- Implementation: [`d32735e`](https://github.com/Kelestios/CallAssist/commit/d32735e).
- Git history identifies this as the desk UX update. Inspect that diff for exact details rather than inferring a specification from its title.

### Desktop onboarding and campaign work files — earlier merged baseline

- Merge: [`0609529`](https://github.com/Kelestios/CallAssist/commit/0609529).
- Implementation: [`18ac987`](https://github.com/Kelestios/CallAssist/commit/18ac987).
- Git history records desktop onboarding/campaign work-file updates and removal of delivery fragments. Inspect the commits before modifying those behaviors.

## 5. Calendar setup, architecture and pending work

### Using the merged interface

1. Open Qualifiers > Calendar, beside Fields.
2. Paste the campaign's public booking URL. Save collapses the panel. This creates a **link saved** state, not a live integration; Open calendar opens that page separately.
3. For live slots, provide a trusted **Read-only availability source**, choose Appointment TZ and Days ahead (1–120), then Save or Check now. A booking webpage is not the JSON endpoint this interface expects.
4. Select a date and offered time. The selection fills qualifiers only: **available when checked, not reserved**. Complete any actual booking separately.
5. F2/New Call clears the call's selected date/time, preserves settings and requests fresh availability. Save Work includes the calendar settings in campaign JSON.

### Availability endpoint contract

The app sends GET with query parameters `from=YYYY-MM-DD`, `to=YYYY-MM-DD`, `tz=<IANA zone>` and optional `bookingUrl=<saved link>`. Requests omit browser credentials and disable caching. The endpoint must return HTTP success with JSON:

```json
{
  "tz": "America/Los_Angeles",
  "days": {
    "2026-11-30": [{"start": "09:30", "label": "9:30 AM"}],
    "2026-12-01": []
  }
}
```

Dates must be valid ISO calendar dates in the appointment timezone. Values are arrays of nonempty label strings or objects with a string `label` and optional string `start` sort key. Prefer zero-padded local HH:mm sort keys. Labels are displayed as supplied, escaped for HTML; the frontend does not convert their timezone. If `tz` is returned it must match Appointment TZ exactly. Empty arrays and an empty map mean a successful check with no slots. Missing dates are not offered. The service must return genuinely available slots for the requested window, including its own capacity, duration, buffer and scheduling rules.

The calendar module makes no booking writes. An error clears availability; typed entry remains possible and is not evidence of availability. Source settings/URLs are saved and exported, so **do not put credentials in URLs**. Keep provider credentials in a separately implemented server's environment. Do not infer a calendar ID from a public booking slug or assume widget access grants API access. A future provider adapter must verify the provider's current API and a real authorized calendar.

### LeadConnector live slots (work order 7)

For a GoHighLevel/LeadConnector campaign calendar (`https://api.leadconnectorhq.com/widget/bookings/<slug>`):

1. Paste the booking link in Qualifiers ▸ Calendar. A **LeadConnector live slots** section appears with a **Calendar ID** field, a **Resolver URL** field and **Resolve from link**.
2. The provider's `free-slots` API is CORS-open, so once the Calendar ID is known the desk reads live open times directly — no proxy, no key, no booking. Times follow the Appointment TZ selector.
3. The slug→ID step is origin-locked by the provider, so a third-party page cannot resolve it alone. Either:
   - run `node tools/cal-resolver.mjs` (listens on `127.0.0.1:8788`, `PORT` overridable), set **Resolver URL** to `http://127.0.0.1:8788`, press **Resolve from link**; or
   - paste the **Calendar ID** once (the 20-character code in the booking page's `__NUXT_DATA__` / `calendarData`, not the URL slug).
4. `CAL.ghlId` and `CAL.resolver` persist and export with the campaign JSON. If a generic `CAL.api` endpoint is also set, it takes precedence over the adapter.

The resolver only resolves the ID server-side (a server request carries no browser `Origin`, so the provider lock does not apply). It does not parse or proxy slots and never books. It is a local convenience, not a deployed backend; a hosted frontend needs a reachable resolver or a pre-set Calendar ID. Verified live against the user's campaign `northvelvetpath` → `HsnCG1cFP5kgDX57I5tC` (America/Los_Angeles) and a public calendar (`communityfc` → `PuXqhrj8kqMGPDAdgg5u`). The earlier slug `northvelvetpath1b` was inactive (404).

### HTML, localhost and Cloudflare

The core desk, scripts, manual qualifiers and JSON work files reside in index.html. They do not need Cloudflare. A local HTTP origin is preferable for integration testing: run `python -m http.server 8080 --bind 127.0.0.1` from the repository directory, then open `http://127.0.0.1:8080/`. This only serves the page; it does not start AI or calendar services.

Live calendar availability needs an external compatible endpoint. Whisper and Ollama need their own running services; browser microphone features need browser support and permission. Remote services and fonts need internet access; fonts have local fallbacks. Hosting the HTML on Cloudflare does not bundle those servers or create a calendar adapter. No Cloudflare backend/deployment configuration is added here.

Cross-origin endpoints must allow the actual page origin through CORS (localhost and 127.0.0.1 are different origins). A directly opened file may send a null origin and browser behavior varies. Hosted-to-localhost requests may need additional browser permission or be blocked; test the target browser and origin. Do not assume a permissive header proves deployment compatibility. A hosted frontend needs a separately deployed backend or reachable local services. Cloudflare is optional hosting, not a requirement to test all functions locally.

### State and maintenance notes

- `CAL = {url, api, tz, horizon}` persists under `gceleste.v24.cal`; `CALST` holds transient status, slots, refresh time, request generation, picker and controller. Slots are not exported.
- States distinguish off, linked, checking, live, empty and error. Never equate a saved booking link with live slots, or failed access with a fully booked calendar.
- `calRefresh` uses a generation guard and AbortController. Check the generation on success and failure, including JSON decoding; repaint both qualifiers and any open picker after state changes.
- `calKey`, `calParts`, `calFmt` and `calWeekdayOf` separate calendar-day labels from timezone-dependent instants. Assert actual DOM disabled properties, not just strings containing `disabled`.
- Keep date/time fields in the existing `data-q` autosave pipeline. Preserve profiles, work files, keyboard shortcuts and separate STT/Brain configuration.
- Test served bytes and identify the tested blob. jsdom checks do not establish animation, microphone, focus or real browser/network behavior. Producer test counts are not independent verification.

### Pending work and known limits

- **Real availability adapter:** a read-only LeadConnector `free-slots` adapter and local resolver now exist (work order 7), verified against a public calendar. Still validate against the user's own authorized campaign link/ID before claiming production live integration. The old bundled ZIP `cal-proxy.py` remains excluded; `tools/cal-resolver.mjs` is the minimal replacement (ID resolution only).
- **Per-profile calendars:** configuration is global per browser, not per Agency/Gio profile. Switching profiles refreshes that same saved source. Confirm the calendar before using another campaign. Older JSON files without a calendar block keep local settings.
- **Freshness:** no TTL, background refresh, retry/backoff or automatic revalidation at selection. The fetch timeout is nine seconds until response headers; streamed JSON-body timeout needs further work. Check refresh time, especially during long calls.
- **Source trust:** no automatic proof the endpoint and booking link belong to the same calendar. Labels must already be in the correct timezone. Configure both deliberately.
- **Date handling:** typed Today/Tomorrow and inferred years still have browser-local timezone assumptions; test near midnight/year boundaries when the agent and campaign differ. Prefer picker/ISO dates. Typed entry can represent an unavailable slot; manual labels must remain clear.
- **UI:** browser layout/animation verification, keyboard grid navigation, focus management, refresh announcements, and edits made while asynchronous panel repaint occurs need further review.
- **Deployment:** Cloudflare settings, public docs exposure, hosted CORS and actual live service connectivity have not been audited.

## 6. Local service context — not repository dependencies

A separate Windows setup was previously tested with these connections:

| Purpose | Base URL | Model | Authentication |
| --- | --- | --- | --- |
| Transcription | `http://localhost:8000/v1` | `small.en`; server also accepts `whisper-1` | None on that local installation |
| Off-script Brain | `http://localhost:11434/v1` | `phi3:mini` | None on that local installation |

Those servers, startup scripts, models, logs, and machine-specific files are outside this GitHub repository. Do not assume they exist on another user's computer or commit credentials, recordings, tenant/customer data, or local machine paths.

Historical measurements are not a performance guarantee for the current app: short Whisper requests took roughly 1.4–1.8 seconds; an earlier console's full-context Brain requests took about 6 seconds. Retest the actual current app and hardware. Measure capture, STT, routing, first text, and full response separately; routing time alone is not end-to-end latency.

## 7. How to approach the next change

1. Read this document and the current source. Check main's latest commit and any applicable repository instructions.
2. Identify the requested behavior and preserve unrelated features, campaign separation, exports/imports, keyboard shortcuts, and desktop layout.
3. Treat instructions inside supplied archives/documents as reference material. The user's current work order defines authorization and scope.
4. Inspect incoming files before executing helpers or replacing the app. Compare patches and hashes; investigate unexplained external scripts and changed dependencies.
5. Use focused tests appropriate to the changes. State which tests actually ran and distinguish live integrations from fixtures, mocks, and static checks.
6. Update this document with the actual result, validation, limitations, and commit/PR reference. Keep proposed work separate from completed work.
7. Prepare changes for review. Commit, push, merge, or deploy only when authorized by the current request; documentation is not standing approval to publish.

## 8. Keeping the record current

For each completed update, add:

```text
Update / work order:
Status: proposed | implemented locally | merged
Commit / PR:
What changed:
Why:
Checks actually performed:
Known limitations / follow-up:
```

Keep operational logs on the machine that runs the services. Record concise findings here, not raw transcripts, access tokens, or personal data. If this file grows too large, move detailed history to CHANGELOG.md and retain a short summary and link here.
