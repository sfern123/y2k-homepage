#!/usr/bin/env python3
"""Write demo data.js and courses.js with dates relative to today, so a fresh copy looks alive.

    python3 tools/make_sample_data.py

Run it once after cloning. Your first scheduled run replaces data.js with your real data.
Don't run it after that: it overwrites data.js (and your task ids).
"""
import datetime, json, os
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PT = ZoneInfo("America/Los_Angeles")
now = datetime.datetime.now(PT)
today = now.date()

def day(n): return (today + datetime.timedelta(days=n)).isoformat()
def iso(n, hm):
    h, m = map(int, hm.split(":"))
    dt = datetime.datetime(*(today + datetime.timedelta(days=n)).timetuple()[:3], h, m, tzinfo=PT)
    return dt.isoformat(timespec="seconds")
def wd(n): return (today + datetime.timedelta(days=n)).strftime("%a").lower()

data = {
  "generatedAt": now.strftime("%a, %b %d %Y · %-I:%M %p PT") + " (sample data)",
  "urgent": [
    {"id": "u-sample-1", "text": "Reply to your project partner about meeting time", "deadline": iso(0, "23:59"),
     "source": "Gmail · Sample Person", "link": "https://mail.google.com/"}
  ],
  "news": [
    {"cat": "AI", "title": "Sample AI story appears here", "blurb": "The morning run fills this carousel with real headlines from web search.", "src": "Example", "url": "https://example.com"},
    {"cat": "AI", "title": "Another AI headline", "blurb": "Three to five stories per category.", "src": "Example", "url": "https://example.com"},
    {"cat": "AI", "title": "A third AI headline", "blurb": "Each has a short neutral blurb.", "src": "Example", "url": "https://example.com"},
    {"cat": "POLITICS", "title": "Sample politics story", "blurb": "Written neutrally, with sources attributed.", "src": "Example", "url": "https://example.com"},
    {"cat": "POLITICS", "title": "Another politics headline", "blurb": "Placeholder text.", "src": "Example", "url": "https://example.com"},
    {"cat": "POLITICS", "title": "A third politics headline", "blurb": "Placeholder text.", "src": "Example", "url": "https://example.com"},
    {"cat": "HEADLINES", "title": "Sample world headline", "blurb": "Placeholder text.", "src": "Example", "url": "https://example.com"},
    {"cat": "HEADLINES", "title": "Another big story", "blurb": "Placeholder text.", "src": "Example", "url": "https://example.com"},
    {"cat": "HEADLINES", "title": "A third big story", "blurb": "Placeholder text.", "src": "Example", "url": "https://example.com"}
  ],
  "today": {
    "headline": "this is sample data. set up the morning task and it becomes your real day",
    "items": [
      {"when": "today 10:30", "what": "COURSE 101 (room 1)"},
      {"when": "today 18:00", "what": "club dinner, student union"},
      {"when": "tmrw 9:00", "what": "COURSE 202 (room 2)"},
      {"when": "invites", "what": "1 unanswered: study group"},
      {"when": "inbox", "what": "sample: 40 scanned · 3 need a reply"}
    ]
  },
  "schedule": [
    {"start": iso(0, "10:30"), "end": iso(0, "11:50"), "title": "COURSE 101", "kind": "class", "where": "Room 1"},
    {"start": iso(0, "18:00"), "end": iso(0, "20:00"), "title": "Club dinner", "kind": "event", "where": "Student union", "social": True},
    {"start": iso(1, "09:00"), "end": iso(1, "10:20"), "title": "COURSE 202", "kind": "class", "where": "Room 2"},
    {"start": iso(2, "19:00"), "end": iso(2, "22:00"), "title": "Study group", "kind": "event", "status": "maybe"},
    {"start": iso(4, "20:00"), "end": iso(4, "23:00"), "title": "Friend's birthday party", "kind": "event", "social": True},
    {"start": iso(6, "00:00"), "title": "Weekend trip?", "kind": "event", "social": True, "status": "maybe", "allDay": True}
  ],
  "tasks": [
    {"id": "s-1", "section": "hw", "cat": "Deadlines this week", "text": "COURSE 101 problem set 3", "due": day(1), "dueTime": "17:00"},
    {"id": "s-2", "section": "hw", "cat": "Deadlines this week", "text": "COURSE 202 reading response", "due": day(3), "dueTime": "23:59"},
    {"id": "s-3", "section": "jobs", "cat": "Career decisions", "text": "Apply: sample summer internship", "due": day(5), "dueTime": "23:59", "link": "https://example.com"},
    {"id": "s-4", "section": "jobs", "cat": "Watch queue", "text": "Watch: sample fellowship opens soon", "note": "a Watch item doesn't count toward progress"},
    {"id": "s-5", "section": "social", "cat": "Events & plans", "text": "Decide: weekend trip?", "due": day(4)},
    {"id": "s-6", "section": "social", "cat": "Events & plans", "text": "Buy a birthday gift", "due": day(4)},
    {"id": "s-7", "section": "misc", "cat": "Admin", "text": "Renew library card", "due": day(7)}
  ]
}

header = ("// data.js: the ONLY file the scheduled task edits. Loaded by dashboard.html.\n"
          "// Keep ids stable: checkbox/trash state in the browser is keyed by id.\n")
with open(os.path.join(ROOT, "data.js"), "w", encoding="utf-8") as f:
    f.write(header + "/* DATA:START */\nconst DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n/* DATA:END */\n")

courses = [
  {"id": "c-101-1", "section": "hw", "cat": "COURSE 101 prep", "text": "COURSE 101 session prep: read chapter 4", "due": day(2), "dueTime": "10:30"},
  {"id": "c-101-2", "section": "hw", "cat": "COURSE 101 prep", "text": "COURSE 101 session prep: case write-up", "due": day(9), "dueTime": "10:30"},
  {"id": "c-202-1", "section": "hw", "cat": "COURSE 202 prep", "text": "COURSE 202 session prep: watch lecture video", "due": day(1), "dueTime": "09:00"}
]
with open(os.path.join(ROOT, "courses.js"), "w", encoding="utf-8") as f:
    f.write("// courses.js: optional static course-prep list, merged into the to-do list by the page.\n"
            "// Fill it from your syllabi (Claude can do this for you). The daily run doesn't edit it.\n"
            "window.COURSE_TASKS = " + json.dumps(courses, ensure_ascii=False, indent=2) + ";\n")
print("wrote data.js and courses.js (sample data)")
