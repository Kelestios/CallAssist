# Campaign calendar · live availability

Call Assist can show **which appointment times look free** while you are on a call. It is
advisory: picking a day or a time only fills the Qualifiers. The desk never books, reserves
or submits anything, and it never asks you to paste an API key into the HTML file.

Full contract, high-level notes and troubleshooting are in the delivered `CALENDAR-SETUP.md`
in the work-order folder; this copy is the in-repo reference.

## Where it lives

**Qualifiers > Calendar** (the button next to **Fields**).

| Field | What it is |
|---|---|
| Booking calendar link | Your campaign's public booking page, e.g. `https://api.leadconnectorhq.com/widget/bookings/<slug>`. Powers **Open calendar**. Saving a link alone does NOT mean availability can be read. |
| Read-only availability source | Optional. A GET-only endpoint you run or trust that answers `?from&to&tz` with the JSON contract below. |
| Days ahead | How far to ask for, 1-120. |
| Appointment TZ | The timezone times are shown in; repeated beside the Time control and in the picker header. |

Status chip next to the Calendar button:

| Chip | Meaning |
|---|---|
| . | nothing saved |
| link icon | link saved, live availability not connected |
| spinner | checking |
| green tick | linked, working (days open + last-refreshed time) |
| warning | checked, nothing open in that window |
| no-entry | connection error, reason shown; no times are ever invented |

Availability is refreshed on Save, on Check now, on **New call / F2**, and when a campaign
file carrying a calendar is imported. Every request carries a generation number, so a slow
reply from a calendar or campaign you already left cannot overwrite the current one.

## The contract

```
GET <your endpoint>?from=2026-11-28&to=2026-12-08&tz=America/Los_Angeles&bookingUrl=<url>

{
  "tz": "America/Los_Angeles",
  "openWhenChecked": true,
  "reserved": false,
  "days": {
    "2026-11-30": [ { "start": "10:00", "label": "10:00 AM" } ],
    "2026-12-01": []
  }
}
```

* `days` keys are `YYYY-MM-DD` calendar dates in the appointment timezone, not instants.
* `label` is what the desk shows and writes into the Time qualifier.
* An empty array means checked-and-full; the picker greys those dates.
* Non-JSON, a missing `days` map, an HTTP error or a 9-second timeout becomes a connection
  error. The desk then keeps Date/Time as typed, marked `manual`.

## The helper

`tools/cal-proxy.py` runs on your own machine, binds 127.0.0.1 only, answers GET only
(POST/PUT/PATCH/DELETE are refused, so nothing here can create a booking) and keeps the
token in its environment - never in the HTML file, never in the campaign .json.

```
python3 tools/cal-proxy.py --port 8787 --source ics \
    --ics "https://calendar.example.org/public.ics" \
    --tz America/Los_Angeles --hours 09:00-17:00 --step 30 --days Mon,Tue,Wed,Thu,Fri
```

Then set **Read-only availability source** to `http://127.0.0.1:8787/free-slots`.

For HighLevel/LeadConnector the public booking widget does not expose a CORS-permitted,
unauthenticated free-slots URL, and this desk will not work around that. Use the documented
read-only slot API through the helper (`--source ghl`, a read-scoped Private Integration
Token in the environment, and the real calendarId - not the booking slug). If the source
cannot be reached the desk says so instead of pretending.

The helper echoes the requesting origin and answers Chrome's private-network preflight with
`Access-Control-Allow-Private-Network: true`, which a hosted page needs to reach localhost.
Pin it with `CAL_ASSIST_ORIGIN=https://your.pages.dev`.

## Privacy and files

The campaign `.json` carries only `calendar.url`, `calendar.api`, `calendar.tz`,
`calendar.horizon`. No tokens, no keys, no cached slots (they go stale). Older campaign
files without a calendar block import unchanged and keep the calendar already on the machine.

## What this feature does not do

It never books, reserves, holds or submits an appointment; never stores a credential in the
HTML or the campaign file; never scrapes a booking widget or uses a public CORS proxy; and
never shows a time it did not receive from your source.
