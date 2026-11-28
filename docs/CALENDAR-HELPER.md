# Availability helper · `tools/cal-proxy.py`

Reference for the read-only helper behind [CALENDAR-SETUP.md](CALENDAR-SETUP.md) section 3.
421 lines, stdlib-only unless you install `ics`. Source of truth is the script itself: `--help`,
`add_argument`, and `do_GET`.

## Command

```bash
python3 tools/cal-proxy.py --port 8787 --source ics --ics "https://calendar.example.org/public.ics"
  --tz America/Los_Angeles --hours 09:00-17:00 --step 30 --days Mon,Tue,Wed,Thu,Fri
```

Each block is wrapped over lines for readability; run it as one line. In the desk, set
**Read-only availability source** to `http://127.0.0.1:8787/free-slots`.

## Flag surface (exactly what exists)

| Flag | Default | Purpose |
|---|---|---|
| `--port` | 8787 | listen port on 127.0.0.1 |
| `--source` | `ics` | `ics` or `ghl` |
| `--ics` | empty | public `.ics` / free-busy feed URL (required with `--source ics`) |
| `--ghl-base` | `https://services.leadconnectorhq.com` | HighLevel API base |
| `--calendar-id` | empty | real 32-hex calendarId (required with `--source ghl`) |
| `--version` | `2021-07-28` | Version header sent to HighLevel |
| `--tz` | `$TZ`, else `America/Los_Angeles` | appointment timezone |
| `--hours` | `09:00-19:00` | offerable window |
| `--step` | 30 | slot length in minutes |
| `--days` | `Mon,Tue,Wed,Thu,Fri` | days offered |
| `--origin` | `$CAL_ASSIST_ORIGIN`, else echo | pinned CORS origin |

There is **no** ops-user-id flag and **no** ghl-version flag. Anything else you read in an older
note is stale.

## Behaviour

* Binds **127.0.0.1 only**; nothing else on the network can reach it.
* Routes are `GET /free-slots` and `GET /health`. Every other path 404s. POST, PUT, PATCH and
  DELETE are refused, so this path cannot create or change a booking.
* `--source ics` reads the feed, converts DTSTART/DTEND values ending in Z from **UTC into the
  appointment timezone**, then subtracts busy blocks from the working window and drops closed days.
  `pip install "ics"` is optional; a built-in parser covers common cases.
* CORS: echoes the requesting origin, or pins it via `--origin` / `CAL_ASSIST_ORIGIN`, and answers
  Chrome's private-network preflight with `Access-Control-Allow-Private-Network: true`, which a
  hosted page (for example a pages.dev site) needs before it may reach localhost.
* Malformed windows (from after to, non-dates) are rejected with a JSON error rather than guessed.

Part 2 covers HighLevel endpoints, known gaps and troubleshooting.
