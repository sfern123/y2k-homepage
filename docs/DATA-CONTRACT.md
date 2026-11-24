# Data contract: what the page reads and the agents write

The page and the agents only talk through `data.js`, plus two static task files. Keep this contract intact and either side can change freely.

## Files and load

```html
<script src="data.js"></script>          <!-- const DATA = {...}  (global lexical binding, NOT window.DATA) -->
<script src="courses.js"></script>       <!-- window.COURSE_TASKS = [...] -->
<script src="tasks-archive.js"></script> <!-- window.TASK_ARCHIVE = [...] -->
<script>if (typeof DATA === "undefined") window.DATA = { generatedAt: "data.js missing", urgent: [], news: [],
  today: { headline: "data.js did not load: check the Homepage folder", items: [] }, schedule: [], tasks: [] };</script>
<script src="assets/app-2.js"></script>  <!-- first line merges the three task lists -->
```

**Merge rule** (top of app-2.js): `DATA.tasks = [...COURSE_TASKS, ...TASK_ARCHIVE, ...DATA.tasks]`. It drops entries without an `id` and de-duplicates by `id`, **first one wins**. So a course task beats a data.js task with the same id; keep ids unique across all three files.

`data.js` layout (the markers are required):
```js
// comment header
/* DATA:START */
const DATA = {
  generatedAt: "...",
  urgent: [...],
  news: [...],
  today: {...},
  schedule: [...],
  tasks: [...]
};
/* DATA:END */
```
All six fields must always be present. It must stay valid JavaScript; trailing commas are fine, and it doesn't have to be strict JSON.

## Fields

### `generatedAt`: string
Pacific time, e.g. `"Tue, Sep 29 2026 · 7:18 AM PT"`. Shown in the top ticker and the footer.

### `urgent`: array (replaced every morning run)
Things due within 24 hours that aren't tasks, e.g. a person asking for a reply today.
```js
{ id: "u20260929-1", text: "Reply to X about Y", deadline: "2026-09-29T17:00:00-07:00", source: "Gmail · Jane Doe", link: "https://…" }
```
- `id` is required, and is used for dismissal (`sf_urgent_dismissed`).
- `deadline`: ISO with offset: `-07:00` until Nov 1, then `-08:00` (PST). Use 23:59 if only a date is known.
- Visibility:
  - Shown from 24 h before the deadline to 48 h after, unless dismissed with "put it out".
  - The page also shows **tasks** due within 24 h in the same banner, so never list an item in both places.

### `news`: array (replaced every morning run)
```js
{ cat: "AI" | "POLITICS" | "HEADLINES", title: "…", blurb: "1–2 sentences", src: "Reuters", url: "https://…" }
```
- 9–14 items, 3–5 per category. Only those three `cat` values get filter buttons.
- The carousel auto-advances every 8 s. Politics is written neutrally.

### `today`: object (replaced every morning run)
```js
{ headline: "one honest line, lowercase-ish",
  items: [ { when: "tue 8:15am", what: "ACCT 210.1 (C105)", url: "https://…" }, … ] }
```
- Order: today's and tomorrow's events, then an unanswered-invites line, then an inbox line, then a Canvas line. About 10 items.
- Rendered as today.txt, near the bottom of the page.

### `schedule`: array (replaced every morning run, today → +9 days)
```js
{ start: "2026-09-29T08:15:00-07:00", end: "2026-09-29T09:35:00-07:00", title: "ACCT 210.1", kind: "class" | "event",
  where: "C105", social: true, status: "maybe", allDay: true, url: "https://…" }
```

| Property | Required? | What it does |
|---|---|---|
| `start` | required | |
| `end` | optional | defaults to `start` |
| `kind` | — | `"class"` for class sessions; the title is shortened to the course code and `where` to the room |
| `status` | — | `"maybe"` if your RSVP is needsAction or tentative, or the title started with `[Decide]` (prefix stripped). Shows "(still deciding)", a MAYBE tag, or dashed stick figures |
| `social` | — | `true` for parties, happy hours, section events, retreats, dinners with friends, trips. Not for classes, career or recruiting events, advising, or academic talks. Feeds the social_life.exe graphic and the flip-phone calendar |
| `allDay` | — | `true` excludes the event from the next-class/next-event ticker; start at `T00:00` |

- Drives the next-class ticker, social_life.exe, and the phone calendar.
- Skipped when building it:
  - declined or cancelled events
  - all-day `DEADLINE:` markers
  - "Title 9 Training Due"-style reminders
  - Gmail auto-events that duplicate a real event
- Exact duplicates (same title and start time) are merged.

### `tasks`: array (**append-only**)
```js
{ id: "h20260929-3", section: "hw" | "jobs" | "social" | "misc", cat: "Deadlines this week", text: "…",
  due: "2026-10-02", dueTime: "18:30", link: "https://…", note: "…" }
```
| Field | Rules |
|---|---|
| `id` | **Permanent.** Never renamed, reused or deleted. See prefixes below. |
| `section` | Required on new tasks. If missing, the page guesses from keywords (`sectionOf`), but don't rely on that. |
| `cat` | Group label. Reuse existing ones: "Deadlines this week", "Late Sept – early Oct" (or a similar dated bucket), "Career decisions", "Events & plans", "Date conflicts to verify", "Watch queue", and course buckets like "COURSE 101 prep". |
| `due` | `YYYY-MM-DD`. Undated tasks sort last. In homework they count as "now". |
| `dueTime` | `HH:MM`, 24 h, Pacific. **Always set when known.** It drives the 24-hour fire countdown. Without it, the deadline is 23:59. |
| `link` | http(s) only; anything else is ignored. **Use the Gmail thread link when the task came from an email**, because runs use it to skip threads already captured. |
| `note` | Optional small grey text under the task. |

**Id prefixes:**

| Prefix | Meaning |
|---|---|
| `h` + YYYYMMDD + `-n` | morning run |
| `u` + YYYYMMDD + `-n` | urgent items, not tasks |
| `s-` / `c-` | sample tasks and course prep from `make_sample_data.py` |

**Special behaviours:**

- **Watch items.** A `cat` starting with "Watch" is a watch item. It doesn't count toward Sisyphus progress, and it gets its own "watching" group in jobs. It can still appear in the fire banner if it has a due date.
- **Homework groups:** next 7 days, then 8–14 days, then "later" folded by `cat` ending in "prep".
- **Social split.** Social tasks whose text starts with "Decide", "Pick", "In or out" or contains "?" become fomo_4ever IM messages. All others become spam pop-ups.
- **Allowed edits to existing tasks:** adding a missing `section` or `dueTime`; and when the source email changes a date or time, updating that task's `due`/`dueTime` in place and appending an "Updated …" note. Text and id never change. Never add an "Updated: …" copy: it shows up unchecked.
- **Archive:** tasks with `due` more than 21 days ago move, unchanged, to `tasks-archive.js`. The page still shows them.

## Browser state (localStorage, not in any file)

| Key | Contents | Why it matters |
|---|---|---|
| `sf_todo_done_v1` | `{ taskId: true }` checkmarks | **the reason ids can never change** |
| `sf_todo_trash_v1` | `{ taskId: timestamp }` trashed tasks | same |
| `sf_folds_open` | `{ "hw:<cat>": true }` open homework folds | renaming a prep `cat` re-folds it |
| `sf_urgent_dismissed` | `{ urgentId: true }` | |
| `sf_game_v1` | game state: xp, per-task log, badges, streak, daily points, best | keyed by task id too |
| `sf_home_game` | `"1"`/`"0"`, game mode on/off (default on) | |
| `sf_home_splash` | date PRESS START was last dismissed | |
| `sf_home_theme` | last theme, but always forced to `theme-pink98` | |
| `sf_hits` | fake visitor counter | |

If a redesign renames any of these keys, your checkmarks, trash and XP reset. Keep them, or migrate old values on first load.

## Validation snippet (what the runs execute)

```bash
node -e '
const fs=require("fs"); global.window={};
const d=fs.readFileSync("data.js","utf8");
const DATA=new Function(d+";return DATA;")();
new Function(fs.readFileSync("courses.js","utf8"))(); new Function(fs.readFileSync("tasks-archive.js","utf8"))();
const ids=[...window.COURSE_TASKS,...window.TASK_ARCHIVE,...DATA.tasks].map(t=>t.id);
if(!(d.includes("/* DATA:START */")&&d.includes("/* DATA:END */"))) throw "markers";
for (const k of ["generatedAt","urgent","news","today","schedule","tasks"]) if(!(k in DATA)) throw "missing "+k;
if (new Set(ids).size!==ids.length) throw "duplicate ids";
console.log("ok", DATA.tasks.length, window.COURSE_TASKS.length, window.TASK_ARCHIVE.length);'
```
