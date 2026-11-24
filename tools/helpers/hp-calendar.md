# Helper brief: morning calendar (homepage-dashboard)

**Scratch dir:** the path given in your prompt (it looks like `/tmp/homepage-run-<user>`). Below it's written as `SCRATCH`.

You build the `schedule` array for the owner's (YOUR_EMAIL) homepage and report today's and tomorrow's events. Read-only: never create, edit, delete or RSVP to events.

## Steps
1. Load Google Calendar `list_events` with ONE ToolSearch call.
2. Window: today 00:00 → +9 days, timeZone YOUR_TIMEZONE, orderBy startTime, pageSize 100. Calendars:
   - primary `YOUR_EMAIL`: in 2-day windows (5 calls), issued in parallel in one turn.
   - YOUR_OTHER_CALENDARS (list each calendar id here, e.g. a personal Gmail or an imported Partiful calendar): full window, one call each, in the same parallel turn.
   - SKIP birthday and holiday calendars.
   - If a call returns a page token, keep paging.
   - If a result was saved to a file because it was large, parse that file with one bash python call instead of reading it.
3. Build the array and write it to `SCRATCH/schedule.json` with ONE bash call.
   - **If any calendar call failed, do NOT write schedule.json** (the main script then keeps yesterday's schedule). Report which calendar failed instead. A partial schedule is worse than a stale one.

## schedule.json: array of
`{ start: "YYYY-MM-DDTHH:MM:00-07:00", end, title, kind: "class"|"event", where?, social?: true, status?: "maybe", allDay?: true, url? }`
- Pacific offset: -07:00 during daylight time, -08:00 from Nov 1 (DST ends).
- `kind: "class"` for class sessions (e.g. invites from your school's course calendar): shorten title to the course code (e.g. "ACCT 210.1") and `where` to the room (e.g. "C105"). Everything else is `"event"` with a short title and location.
- `status: "maybe"` if the owner's responseStatus is needsAction or tentative, or the title starts with "[Decide]" (strip the prefix). Omit status when the owner accepted or created it.
- `social: true` for parties, happy hours, section meetings and socials, club retreats, dinners with friends, potlucks and trips. NOT for classes, career or recruiting events, advising appointments or academic talks.
- Skip: declined or cancelled events, all-day DEADLINE markers, "Title 9 Training Due"-style reminders, FROM_GMAIL auto-events that duplicate a real event.
- Merge exact duplicates (same title and start) into one.
- Keep all-day social [Decide] items with `allDay: true`, start at T00:00.
- `url`: the event's htmlLink.
- Sort by start.

## Your reply to the main session (short; no raw event dumps)
- Line 1: `schedule.json: N items (C classes, S social, M maybe)` and any calendar that failed.
- Then `today.items` lines for TODAY and TOMORROW, already in final form, one per line: `when | what | url`
  - when: e.g. "today 9:00", "tmrw 18:30", "today all day"; what: lowercase-ish, terse, with place. Skip declined events and the owner's all-day [Decide]/DEADLINE markers.
- Then: `invites: N unanswered (today → +3 days): <short titles>` (responseStatus needsAction).
- Then any unanswered invite starting within 24h as: `URGENT | title | start ISO | url`.
