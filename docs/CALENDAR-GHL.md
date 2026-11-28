# HighLevel availability and troubleshooting

Companion to [CALENDAR-HELPER.md](CALENDAR-HELPER.md), which documents the helper's command line,
flag surface and behaviour. Read this before wiring `--source ghl`.

## Why the booking page is not an availability source

A public booking page (`api.leadconnectorhq.com/widget/bookings/<slug>`) renders inside its own
origin and does not expose a CORS-permitted, unauthenticated free-slots URL. The desk will not
scrape that widget, spoof its internals, or route traffic through a third-party proxy. Point the
**Read-only availability source** at the documented slot API through the helper instead.

## How to wire it

1. Create a private integration token with the narrowest calendar **read** scope you can, restricted
   to the one location. Rotate it if it ever leaks.
2. Find the real 32-hex `calendarId` in Calendar setup (its details or API view) or via the
   documented Get Calendars call. The booking slug in a widget URL is **not** the calendar id.
3. Put the token in the helper's environment, not in the desk, and start it with
   `--source ghl --calendar-id <id>` plus your `--tz --hours --step` window.

The helper issues GET calls only. It tries three documented paths in order and uses the first that
answers: `calendars/<calendarId>/getFreeSlots` with `startTime` and `endTime` milliseconds;
`calendars/<calendarId>/slots/get` with `startEpochMs` and `endEpochMs`; and
`calendar/getFreeSlot` with `calendarId`, `startTime`, `endTime`. If HighLevel changes shape, fix
the fetch and parse functions there. Never point the helper at a create, confirm or reschedule
endpoint: this product has no business writing to a calendar.

## Gaps you must close before trusting it

* **Unwired environment value.** `GHL_OPS_USER_ID` is named in the helper's header comment but no
  line of code reads it, so user-scoped or shared-team calendars cannot be addressed. Either pass
  ops user ids through the slot call or delete the mention; do not assume it works.
* **Never exercised against a real account.** Those three paths are transcribed from documentation.
  What this build actually proved end to end is `--source ics` against a real feed, in a real
  browser, with the desk rendering the returned slots. Treat `--source ghl` as unverified.
* **Nothing validates the pairing.** The desk only shape-checks the booking link, so it cannot tell
  you that an availability endpoint belongs to the same calendar or account as the link you saved.
* Failure paths are verified, though: without a token the helper answers 503 with a clear message,
  and the desk shows a connection error rather than inventing times.

## Symptom table

| Symptom in the desk | Meaning and fix |
|---|---|
| connection error: nothing answered at that address | Helper not running, wrong port, or firewall. Confirm with a GET to `/health` on the same port. |
| connection error: the response was not JSON | The endpoint returned HTML (login page, widget page). Point at the API endpoint, not the booking URL. |
| connection error: the reply carried no days map | Shape mismatch; implement the contract in CALENDAR-SETUP.md section 2. |
| connection error: no reply within 9 seconds | Too slow mid-call. Narrow Days ahead, or check the upstream source. |
| connection error: HTTP 401 or 403 | Token missing, expired, or lacking the read scope. |
| console blocks the call as CORS | The endpoint must allow the Desk origin, and from a hosted page to localhost it must answer the private-network preflight. The helper does both. |
| warning: no availability | The check succeeded and the window really is full. Widen Days ahead or change day. |
| times land on the wrong day | Set Appointment TZ to the campaign's zone; keys are calendar days in that zone, not instants. |
| dates are not locked even though slots appeared | Check you are on the current build; a shipped bug once made every cell stay unlocked because a concatenated attribute lost its space. |
