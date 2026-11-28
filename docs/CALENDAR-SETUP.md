# Campaign calendar - live availability

Call Assist can show **which appointment times look free** while you are on a call. It is
advisory: picking a day or a time only fills the Qualifiers. The desk never books, reserves
or submits anything, and it never asks you to paste an API key into the HTML file.

---

## 1. Where it lives

**Qualifiers > Calendar** (the button next to **Fields**).

| Field | What it is |
|---|---|
| **Booking calendar link** | Your campaign's public booking page, e.g. `https://api.leadconnectorhq.com/widget/bookings/<slug>`. Used for the **Open calendar** button and as context for the helper. Saving a link on its own does **not** mean availability can be read. |
| **Read-only availability source** | Optional. A GET-only endpoint you run or trust that answers `?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=IANA` with the JSON contract below. |
| **Days ahead** | How far to ask for, 1 to 120. |
| **Appointment TZ** | The timezone the times are shown in. Shown next to the Time control and in the picker. |

The chip beside **Calendar** is a single glyph and it is the whole status:

| Chip | Meaning |
|---|---|
| dot `.` | nothing saved |
| link | **link saved**, live availability not connected |
| spinner | checking |
| check | **linked, working** - shows the days open and the time of the last check |
| warning | checked, and nothing is open in that window |
| no entry | connection error - the reason is spelled out, and **no times are invented** |

Availability is only as fresh as the last check. It is refreshed when you **Save**, when you
**Check now**, when you start a **New call (F2)**, and when a campaign file that carries a
calendar is imported. A reply that arrives after you switched calendar or campaign is
discarded, so a slow answer can never overwrite the newer one.

## 2. The contract

```json
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

* `days` keys are `YYYY-MM-DD` **calendar dates in the appointment timezone**, not instants.
* Each entry is one offerable time; `label` is what the desk shows and stores.
* An empty array means "checked, nothing free" (the picker greys those dates out).
* Anything the desk cannot parse - no `days` map, non-JSON, HTTP error, no reply within 9
  seconds - becomes a connection error, and every field stays typed by hand. It never guesses.

## 3. Feeding it real availability

Live times come from an endpoint you control, never from the booking page itself. The bundled
localhost helper, its exact flag surface, the HighLevel endpoints it tries and the
troubleshooting table are documented in [CALENDAR-HELPER.md](CALENDAR-HELPER.md). Short version:

```bash
python3 tools/cal-proxy.py --port 8787 --source ics --ics "https://calendar.example.org/public.ics"
  --tz America/Los_Angeles --hours 09:00-17:00 --step 30 --days Mon,Tue,Wed,Thu,Fri
```

Wrapped here for readability; run it as one line. Then set **Read-only availability source** to
`http://127.0.0.1:8787/free-slots` and press **Check now**. The chip changes within a second or
two, or it tells you why it could not.

## 4. Offline and privacy

* With **no availability source** the desk is fully usable: the booking link is still saved,
  **Open calendar** reaches the real diary, and date and time stay typed - labelled `manual`,
  never marked verified.
* With a `localhost` source, nothing leaves your machine except the fetch to your helper.
* The campaign `.json` export contains only `calendar.url`, `calendar.api`, `calendar.tz`,
  `calendar.horizon` - no token, no key, no header, and no cached slots (cached availability
  would go stale). Older campaign files without a `calendar` block import unchanged and keep
  whatever calendar is already on the machine.
* Availability results are never written to the file or to disk; a page reload re-checks.

## 5. What this feature does not do

* It never books, reserves, holds or submits an appointment.
* It never stores a credential in the HTML file or in your campaign `.json`.
* It never scrapes a booking widget or routes your traffic through a public CORS proxy.
* It never displays a time it did not receive from your source.

Troubleshooting, the helper's flags and the HighLevel gaps live in
[CALENDAR-HELPER.md](CALENDAR-HELPER.md).
