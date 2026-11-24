# Scheduled task prompt: `homepage-dashboard`

Paste everything below the line into a new Cowork scheduled task (daily, e.g. cron `0 7 * * *`). First replace every placeholder:

| Placeholder | Example |
|---|---|
| `YOUR_NAME` | Alex Kim |
| `YOUR_EMAIL` | alex@school.edu (the Gmail/Google Calendar account Claude reads) |
| `YOUR_HOMEPAGE_FOLDER` | /Users/alex/Documents/Claude/Homepage |

Also fill in `YOUR_TIMEZONE` and `YOUR_OTHER_CALENDARS` in `tools/helpers/hp-calendar.md`, and replace `YOUR_EMAIL` in all three helper files. The prompt assumes Pacific time (`-07:00`/`-08:00`); if you live elsewhere, change the offsets here and `PT` in `tools/homepage_tools.py`.

Gmail links default to your first signed-in Google account (`/mail/u/0/`). To point them at another account, set `HOMEPAGE_GMAIL_PREFIX` (see the top of `tools/homepage_tools.py`).

---


You are refreshing the owner's (YOUR_EMAIL) homepage, the owner's Chrome new-tab page (dashboard.html loads data.js over file://). Three helper agents do the reading (email, calendar, news) and write scratch files; a script does the merging and checks. You stay small: you never read raw email, calendar dumps, search results or the whole data.js. Every line in your context is re-read on every later call, so keep calls few and outputs short.

## Files (folder: YOUR_HOMEPAGE_FOLDER)
- Runs write only data.js, tasks-archive.js (both via the script) and usage-log.csv (via log_usage.py). Never move, rename or copy files.
- NEVER open dashboard.html, assets/, docs/ or README.md. Never read data.js, courses.js or tasks-archive.js in full; the prep step gives you compact views.
- Script: `tools/homepage_tools.py`. Helper briefs: `tools/helpers/hp-email.md`, `hp-calendar.md`, `hp-news.md` (you don't read these; the helpers do).
- Scratch: a per-session dir that prep prints (`/tmp/homepage-run-<user>`; /tmp is shared between sessions). Below it's SCRATCH.

In every bash call, find the script first:
`T=$(find "$HOME/mnt" -maxdepth 5 -path "*/Homepage/tools/homepage_tools.py" -not -path "*/.claude/*" 2>/dev/null | head -1)`
If T comes back empty, the Homepage folder isn't mounted: call request_cowork_directory with YOUR_HOMEPAGE_FOLDER, then retry.

The script never writes anything when it prints FAIL, and it skips repeats of existing tasks, so rerunning it after a fix is always safe.

## Owner's rules (apply them when you write tasks)
- Reading an email does NOT mean the owner handled it. The owner acknowledges an item only by checking it off or trashing it on the homepage, which you can't see. Every existing task stays open.
- The owner's checkmarks and trash are stored in the owner's browser by task id. A task that reappears under a new id shows up unchecked, so never re-add something that's already on the list; update the existing task instead (task_updates).
- A thread counts as replied-to only if it has a message from YOUR_EMAIL after the ask. Replying clears "needs a reply", but any deadline in that thread still becomes a task.
- Email coverage is never cut to save money. If the email helper's coverage check fails, fix it; never write around it.

## Step 1 · Prep (1 bash call)
`T=...; python3 "$T" hp-prep`
It prints today's date and Pacific offset, task/schedule/news counts, how many tasks will be archived, and any task without a `section`, and the SCRATCH path. It writes captured_ids.txt, tasks_compact.txt and news_titles.txt there.

## Step 2 · Helpers (ONE message, three Agent calls, run in parallel)
Each Agent prompt is just this (fill in NAME):
"Read YOUR_HOMEPAGE_FOLDER/tools/helpers/NAME.md and follow it exactly. If Read fails, run in bash: cat \"$(find \"$HOME/mnt\" -maxdepth 6 -path '*/Homepage/tools/helpers/NAME.md' -not -path '*/.claude/*' | head -1)\". Today is <date from prep>, Pacific offset <offset>. Scratch dir <SCRATCH path printed by prep>."
- `hp-email`: no model override (same model as this run). Judgement matters here.
- `hp-calendar`: model "haiku".
- `hp-news`: model "haiku".
- Exactly these three helpers. If one fails or returns nothing, re-launch only that one once. Never do its work yourself in the main session.
- If the email helper fails twice: Gmail is unavailable for this run. Say so in `today.headline` (start it with "EMAIL SCAN FAILED:") and still write the rest. If the calendar helper fails twice, say so in the headline; the script keeps the existing `schedule`.

## Step 3 · Decide, then write + verify (1 bash call)
From the helpers' short replies (and tasks_compact.txt via a targeted `grep` only if you need to settle a dedupe), write `SCRATCH/main.json` with a heredoc and run `python3 "$T" hp-merge` in the SAME bash call. main.json:
```
{
  "urgent":   [ { "text", "deadline": "YYYY-MM-DDTHH:MM:00-07:00", "source"?, "thread"?: "<Gmail id>", "link"? } ],
  "today":    { "headline": "...", "items": [ { "when", "what", "url"? } ] },
  "inbox_who": "<who/what needs a reply, terse>",
  "new_tasks": [ { "section", "cat", "text", "due"?, "dueTime"?, "thread"?: "<Gmail id>", "link"?, "note"? } ],
  "section_fixes": { "<task id>": "hw|jobs|social|misc" },
  "dueTime_fixes": { "<task id>": "HH:MM" },
  "task_updates": { "<task id>": { "due"?: "YYYY-MM-DD", "dueTime"?: "HH:MM", "note": "what changed", "thread"?: "<Gmail id>" } },
  "skipped": { "<Gmail thread id>": "reason" },
  "email_failed"?: true
}
```
The script assigns ids (urgent "u…", tasks "h…"), sets generatedAt, takes schedule.json and news.json from the helpers (keeping the old ones if a file is missing or invalid), builds the inbox line with the verified counts, archives tasks due more than 21 days ago, re-reads data.js just before writing (another task may have appended), and runs the node checks. It first runs two email checks. **Coverage:** every needs-reply/actionable thread was opened and has items, and every "on list" thread really is captured. If that prints FAIL, send the FAIL lines back to the email helper (SendMessage to its agent id; if that isn't available, launch a new hp-email helper and add "FIX MODE: <the FAIL lines>" to its prompt), add the item lines it returns to main.json, then rerun `hp-merge`. **Output:** every item line the email helper listed must show up in `new_tasks` or `urgent` (by `thread` or link), in `task_updates` (update items, by matched task id), or in `skipped` with a reason. If it prints FAIL, handle the listed items and rerun. If any other check fails, fix main.json and rerun.

Set `"email_failed": true` only when the email helper failed twice (see Step 2). The script then skips both email checks and writes an "EMAIL SCAN FAILED" inbox line. Don't write schedule.json or news.json yourself.

**urgent**: due or happening within 24h, needs the owner's action, and NOT a task. That covers the email items marked within24h that you don't turn into tasks, and the calendar helper's URGENT lines (unanswered invites starting within 24h). Usually 0–2. If only a date is known, use 23:59. Use the offset from prep (-07:00 in daylight time, -08:00 from Nov 1). Never put the same thing in both urgent and tasks; a task due within 24h reaches the fire banner on its own.

**today**: `headline` is one honest line on what needs the owner's attention (say so if it's quiet). `items`, about 10, in this order: the calendar helper's today/tomorrow lines; one line for unanswered invites (today → +3 days); `{ "when": "canvas", "what": … }` if the email helper reported Canvas. Don't write the inbox line; the script inserts it before canvas.

**new_tasks**: one per email item the helper listed (already filtered to items that still need handling) that the owner would plausibly act on and that isn't already on the owner's list: unanswered invites, time-boxed asks from real people, new deadlines, blast items with a date, new Canvas assignments, new job or fellowship openings.
- `section`: hw = Canvas, homework, cases, course deadlines, GER/GST forms; jobs = applications, fellowships, internships, industry roles, recruiting events, career decisions, Watch queue; social = events, clubs, parties, retreats, trips, RSVPs, lotteries; misc = other admin.
- Reuse existing category names (`cat`) where they fit.
- Always set `dueTime` when the deadline time is known.
- Always set `thread` to the item's Gmail id (the script builds the link `https://mail.google.com/mail/?authuser=YOUR_EMAIL#all/thread-f:<decimal id>`), or `link` to the form URL. The link is what lets later runs skip the thread.
- For course items, `grep -i` courses.js and tasks-archive.js for the course code or assignment name before adding.
- Items marked `update` (a captured thread whose date, time or ask changed): put them in `task_updates` on the matched task's id. The script changes that task's due/dueTime and appends the note, keeping its id and text, so the owner's checkmark carries over. NEVER add a new "Updated: …" task (the script refuses it): a copy shows up unchecked and looks like the owner's checkmark was lost.
- NEVER rename, reorder, delete or re-id existing tasks. The only edits to existing tasks are section_fixes and dueTime_fixes for tasks missing those fields and task_updates.

## Step 4 · Log usage (your LAST tool call)
Run exactly:

`S=$(find "$HOME/mnt" -maxdepth 5 -path "*/Homepage/tools/log_usage.py" -not -path "*/.claude/*" 2>/dev/null | head -1); [ -n "$S" ] && python3 "$S" homepage-dashboard || echo "usage-log: script not found under $HOME/mnt"`

If it prints "script not found" or any error, don't retry; start your final reply with "USAGE LOG FAILED:" and the exact message. Never edit the script or the CSV.

Target: about 6–8 main-session tool calls in total (prep, 3 helpers, write+verify, log, plus any fix-ups). No ToolSearch is needed in the main session.

## Constraints
- Never send, draft or reply to email, never RSVP, never modify calendar events, never change read/unread state or labels. Helpers are read-only too.
- Do not use mcp__cowork__create_artifact or update_artifact.
- End with five short sentences: what changed since yesterday; how many tasks were appended (and archived) and updated in place; what is in the fire banner; inbox coverage (scanned, already on list, opened, noise, from the script's line); the usage-log summary line.
