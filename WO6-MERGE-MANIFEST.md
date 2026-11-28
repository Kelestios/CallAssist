# Work order 6 — merge manifest

Campaign-calendar availability. **Implemented and verified; NOT merged.** `main` is untouched by
this work order: its application is still commit 621796e2 and nothing here has been deployed.

## Artefacts

| item | git blob | sha256 | bytes |
|---|---|---|---|
| `index.html` before (main) | `574232463219306266848332a4d38b32ccdabec1` | `fa7bf51eab18bd38d040c97ce187e125d65116cf1bbae5d191e5d31f233b0bd9` | 353763 |
| `index.html` after | `4140254020f7c7c8a49d6462a9fe901b215b7f42` | `826793e636ef2fd5e3b5caa20b716bdf1bc2dbadc082f175392f8847aa9ec3dc` | 388603 |
| `work-order-6-campaign-calendar.patch` | `552c0fc4aee9e9f46f1bb551ea8cac6ebbcb38cb` | `e448ebbf697c787cea183449e11ff79ae11ce680f4d8fb5a19369bc68d3b9d5e` | 42934 |
| `cal-proxy.py` (helper) | `1481d086ef27a570d2e62863290c881245666d7c` | `88727122779bd7094806a9ec953238d20bcac78b2b955043e768a609b0fdc186` | 17953 |

The patch is zero-context with 28 hunks. Applying it to main's `index.html` reproduces the result
blob byte-for-byte, and `node --check` on the extracted script is clean.

## Apply

```text
git checkout -b wo6 maingit apply --unidiff-zero work-order-6-campaign-calendar.patch
git hash-object index.html      # expect 4140254020f7c7c8a49d6462a9fe901b215b7f42
mkdir -p docs tools
cp CALENDAR-SETUP.md CALENDAR-HELPER.md CALENDAR-GHL.md docs/
cp cal-proxy.py tools/
```

The application file, the patch and the helper ship from the delivery folder because the
connector used for these documentation commits does not carry files that size dependably.
Everything on this branch is documentation.

## What is on this branch

| path | blob | bytes |
|---|---|---|
| `docs/PROJECT_CONTEXT.md` | `1dd2ffdd19fd1cfbfae5979d7fc1d22b1e4e7265` | 10967 |
| `docs/CHANGELOG.md` | `1346150b51e25a56a115035f5838209aeef49386` | 11101 |
| `docs/CALENDAR_ARCHITECTURE.md` | `34dc43f752e80a9a852642b873c300e2322beaa9` | 10343 |
| `docs/AGENT_PITFALLS.md` | `06e55db384c8637933b6ad6298a6850dfa61aea3` | 6753 |
| `docs/CALENDAR-SETUP.md` | `ecabdd8fe71a98b16d431ebe6de60130b5d25670` | 4487 |
| `docs/CALENDAR-HELPER.md` | `41dcefdcb76aaf4ed90d9b841cce99e2444533e5` | 2678 |
| `docs/CALENDAR-GHL.md` | `0fbe4dcfc1d3beacac84df12b4b23c07817f41d2` | 3985 |
| `docs/NEXT_CHANGE_PROMPT.md` | `f524dc54e2463e58d540dc8f25d1356925f94fbd` | 3532 |

## Evidence — 108 checks, 0 failures

Re-run 2026-11-28 with one driver that owns the fixture server, the ICS feed and the helper, and
writes each result to disk (`verify_all.json`, `verify_run1/2/3.json`, `verify_helper_unit.json`,
`verify_e2e.json` in the delivery folder). The driver asserts the served `index.html` is the result
blob above before running anything.

| harness | pass | fail | what it covers |
|---|---|---|---|
| desk suite 1 | 30 | 0 | panel placement, drop measured mid-transition, validation refusal, save collapse, unsaved dot, reopen shows values, remove clears, picker gating by open slots, timezone display, slot dropdown, token resolution, new call clears and re-requests, toast, GET-only, widget never fetched |
| desk suite 2 | 34 | 0 | HTTP error, non-JSON, wrong shape, unreachable, 9 s timeout, checked-but-empty, manual typing, open-picker repaint, export shape and secret scan, import with refresh, load undo, older file without the block, generation guard plus mid-flight campaign and profile switches |
| desk suite 3 | 26 | 0 | work orders 1-5 intact: Agency 24-row sheet deck vs Gio 45-response deck, invalid capital-U escapes gone, five intro cards still fitting, gold support button, gated timer and verdict pills, panel and rail transitions, divider drag, deletable shipped scripts, boot at 1366 with reduced motion, wire audit |
| helper unit | 12 | 0 | ICS parse, UTC to appointment-zone conversion, busy-window subtraction, closed days, contract shape, window bounds, CORS with the private-network header, POST refused, malformed window rejected |
| browser end to end | 6 | 0 | real helper against a real ICS feed from the delivered file: live slots, both booked windows gone, unbooked times offered, only GETs reached the helper, widget host never contacted, no page errors |

## Honest limits

* Real HTTP was exercised against same-origin JSON fixtures and the local helper reading a local
  ICS feed. **No live HighLevel/LeadConnector or Google Calendar source was tested** — no token
  was available. The endpoint paths in `fetch_ghl` are transcribed from documentation.
* `GHL_OPS_USER_ID` is named in the helper's header comment but read by no line of code, so
  user-scoped calendars are unwired. See `docs/CALENDAR-GHL.md`.
* The desk relays `label` strings verbatim and does no timezone conversion of its own; the helper
  does that work. A source returning UTC-stamped labels would display the wrong hour.
* Calendar configuration is stored per browser while campaigns are per profile, so switching
  campaigns keeps the previous campaign's diary. Per-profile calendar config is the obvious next
  work order.
* Not inspected: Cloudflare deployment behaviour, and whether this repository's `docs/` is served
  publicly. Treat everything here as publishable text — no secrets, and none were added.

## Deliberately not done

No booking, reserving, holding, rescheduling or cancelling. No widget scraping, no headless
automation of the booking page, no third-party CORS proxy. No credential in `index.html` or in a
campaign `.json`. No cached availability exported. No merge, no deploy, no branch deletion.
