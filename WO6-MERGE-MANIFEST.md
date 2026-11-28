# CallAssist — work order 6 merge manifest

Branch `feat/campaign-calendar-wo6` carries **documentation only**; nothing from work order 6 is
merged into `main` and nothing was deployed. Read [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
first.

## What this branch contains

| path | blob | bytes |
|---|---|---|
| `WO6-MERGE-MANIFEST.md` | this file | ~6.1 KB |
| `docs/PROJECT_CONTEXT.md` | `d4f54a37724493328e27f82573ac8d7206570ce5` | 7133 |
| `docs/CHANGELOG.md` | `1346150b51e25a56a115035f5838209aeef49386` | 11101 |
| `docs/CALENDAR_ARCHITECTURE.md` | `34dc43f752e80a9a852642b873c300e2322beaa9` | 10343 |
| `docs/AGENT_PITFALLS.md` | `9f6e39ce519c2183b21fe58eeb5474312b994fd6` | 8515 |
| `docs/CALENDAR-SETUP.md` | `ecabdd8fe71a98b16d431ebe6de60130b5d25670` | 4487 |
| `docs/CALENDAR-HELPER.md` | `41dcefdcb76aaf4ed90d9b841cce99e2444533e5` | 2678 |
| `docs/CALENDAR-GHL.md` | `0fbe4dcfc1d3beacac84df12b4b23c07817f41d2` | 3985 |
| `docs/NEXT_CHANGE_PROMPT.md` | `f524dc54e2463e58d540dc8f25d1356925f94fbd` | 3532 |

There are no code files on this branch: no `index.html`, no `tools/`, no `docs/verification-*.json`.
They live in the delivery folder because the connector used here cannot push multi-kilobyte code
files reliably. `git diff --stat main...feat/campaign-calendar-wo6` is docs only.

## Artifacts that must travel with the merge

| artifact | blob | sha256 | bytes |
|---|---|---|---|
| `index.html` (result) | `4140254020f7c7c8a49d6462a9fe901b215b7f42` | `826793e636ef2fd5e3b5caa20b716bdf1bc2dbadc082f175392f8847aa9ec3dc` | 388603 |
| `work-order-6-campaign-calendar.patch` | `552c0fc4aee9e9f46f1bb551ea8cac6ebbcb38cb` | `e448ebbf697c787cea183449e11ff79ae11ce680f4d8fb5a19369bc68d3b9d5e` | 42934 |
| `cal-proxy.py` -> `tools/` | `1481d086ef27a570d2e62863290c881245666d7c` | `88727122779bd7094806a9ec953238d20bcac78b2b955043e768a609b0fdc186` | 17953 |
| `verification-20261128.json` | per-suite pass/fail counts from the re-run | — | — |

Base blob the patch applies to: `574232463219306266848332a4d38b32ccdabec1` (current `main` application
file).

## How to merge

```text
git checkout -b wo6 main
git apply --unidiff-zero work-order-6-campaign-calendar.patch
git hash-object index.html   # must print 4140254020f7c7c8a49d6462a9fe901b215b7f42
mkdir -p docs tools
cp CALENDAR-SETUP.md CALENDAR-HELPER.md CALENDAR-GHL.md docs/
cp cal-proxy.py tools/
```

Run one line at a time — this block was once published with two commands concatenated, which is
recorded in [docs/AGENT_PITFALLS.md](docs/AGENT_PITFALLS.md). Never trust a fenced block from a
draft: fetch what you pushed.

If the resulting blob is not `41402540`, your `main` moved. Re-derive the patch rather than forcing
it.

## Evidence

Re-run 2026-11-28 on the final blob, one process owning the desk server, the ICS feed and the helper:

| harness | assertions | result |
|---|---|---|
| desk suite 1 — panel and validation | 30 | pass |
| desk suite 2 — persistence, import/export, staleness | 34 | pass |
| desk suite 3 — work order 1-5 regression, 1366, reduced motion, wire audit | 26 | pass |
| helper unit checks | 12 | pass |
| browser end-to-end through the running helper | 6 | pass |
| **total** | **108** | **0 failures** |

Machine-readable results ship as `verification-20261128.json`.

## Still unverified — read before deploying

1. **No live HighLevel/LeadConnector or Google Calendar token.** The three slot endpoints in
   `fetch_ghl` are transcribed from documentation and were never answered by a real account; the
   `Version` header and calendar id shape are guesses the operator must confirm. Only the ICS path
   was exercised end to end.
2. **`GHL_OPS_USER_ID` is documented in `cal-proxy.py`'s header but read by no code.** User-scoped
   calendars are unwired; either pass it through `fetch_ghl` or delete the comment.
3. **Calendar config is per browser, not per campaign.** Switching profiles keeps the other
   campaign's diary.
4. **Cloudflare deploy behaviour not observed**, including whether `docs/` is publicly served.
5. **No TTL or background recheck** — availability is as fresh as the last trigger, and labels are
   relayed exactly as the source emits them.

## Feature summary

Read-only campaign-calendar availability: `CAL` (booking link, optional source URL, timezone, window)
persisted and exported with the campaign JSON; `CALST` state machine rendered as an emoji-only chip
beside the Calendar button; a grid-row drop panel for configuration; a calendar pop with
availability-gated days, a slot row and a manual-entry fallback; refresh on save, boot, campaign
switch and new-call (`F2`) with generation counters and `AbortController` discarding stale replies.
Nothing in the feature writes to a calendar.

Detail: [docs/CALENDAR_ARCHITECTURE.md](docs/CALENDAR_ARCHITECTURE.md) for invariants and seams,
[docs/CHANGELOG.md](docs/CHANGELOG.md) for status and evidence per work order,
[docs/CALENDAR-SETUP.md](docs/CALENDAR-SETUP.md) plus
[docs/CALENDAR-HELPER.md](docs/CALENDAR-HELPER.md) and
[docs/CALENDAR-GHL.md](docs/CALENDAR-GHL.md) for operations.
