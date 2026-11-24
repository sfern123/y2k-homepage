// data.js: the ONLY file the scheduled task edits. Loaded by dashboard.html.
// Keep ids stable: checkbox/trash state in the browser is keyed by id.
/* DATA:START */
const DATA = {
  "generatedAt": "Mon, Nov 23 2026 · 8:28 PM PT (sample data)",
  "urgent": [
    {
      "id": "u-sample-1",
      "text": "Reply to your project partner about meeting time",
      "deadline": "2026-11-23T23:59:00-08:00",
      "source": "Gmail · Sample Person",
      "link": "https://mail.google.com/"
    }
  ],
  "news": [
    {
      "cat": "AI",
      "title": "Sample AI story appears here",
      "blurb": "The morning run fills this carousel with real headlines from web search.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "AI",
      "title": "Another AI headline",
      "blurb": "Three to five stories per category.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "AI",
      "title": "A third AI headline",
      "blurb": "Each has a short neutral blurb.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "POLITICS",
      "title": "Sample politics story",
      "blurb": "Written neutrally, with sources attributed.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "POLITICS",
      "title": "Another politics headline",
      "blurb": "Placeholder text.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "POLITICS",
      "title": "A third politics headline",
      "blurb": "Placeholder text.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "HEADLINES",
      "title": "Sample world headline",
      "blurb": "Placeholder text.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "HEADLINES",
      "title": "Another big story",
      "blurb": "Placeholder text.",
      "src": "Example",
      "url": "https://example.com"
    },
    {
      "cat": "HEADLINES",
      "title": "A third big story",
      "blurb": "Placeholder text.",
      "src": "Example",
      "url": "https://example.com"
    }
  ],
  "today": {
    "headline": "this is sample data. set up the morning task and it becomes your real day",
    "items": [
      {
        "when": "today 10:30",
        "what": "COURSE 101 (room 1)"
      },
      {
        "when": "today 18:00",
        "what": "club dinner, student union"
      },
      {
        "when": "tmrw 9:00",
        "what": "COURSE 202 (room 2)"
      },
      {
        "when": "invites",
        "what": "1 unanswered: study group"
      },
      {
        "when": "inbox",
        "what": "sample: 40 scanned · 3 need a reply"
      }
    ]
  },
  "schedule": [
    {
      "start": "2026-11-23T10:30:00-08:00",
      "end": "2026-11-23T11:50:00-08:00",
      "title": "COURSE 101",
      "kind": "class",
      "where": "Room 1"
    },
    {
      "start": "2026-11-23T18:00:00-08:00",
      "end": "2026-11-23T20:00:00-08:00",
      "title": "Club dinner",
      "kind": "event",
      "where": "Student union",
      "social": true
    },
    {
      "start": "2026-11-24T09:00:00-08:00",
      "end": "2026-11-24T10:20:00-08:00",
      "title": "COURSE 202",
      "kind": "class",
      "where": "Room 2"
    },
    {
      "start": "2026-11-25T19:00:00-08:00",
      "end": "2026-11-25T22:00:00-08:00",
      "title": "Study group",
      "kind": "event",
      "status": "maybe"
    },
    {
      "start": "2026-11-27T20:00:00-08:00",
      "end": "2026-11-27T23:00:00-08:00",
      "title": "Friend's birthday party",
      "kind": "event",
      "social": true
    },
    {
      "start": "2026-11-29T00:00:00-08:00",
      "title": "Weekend trip?",
      "kind": "event",
      "social": true,
      "status": "maybe",
      "allDay": true
    }
  ],
  "tasks": [
    {
      "id": "s-1",
      "section": "hw",
      "cat": "Deadlines this week",
      "text": "COURSE 101 problem set 3",
      "due": "2026-11-24",
      "dueTime": "17:00"
    },
    {
      "id": "s-2",
      "section": "hw",
      "cat": "Deadlines this week",
      "text": "COURSE 202 reading response",
      "due": "2026-11-26",
      "dueTime": "23:59"
    },
    {
      "id": "s-3",
      "section": "jobs",
      "cat": "Career decisions",
      "text": "Apply: sample summer internship",
      "due": "2026-11-28",
      "dueTime": "23:59",
      "link": "https://example.com"
    },
    {
      "id": "s-4",
      "section": "jobs",
      "cat": "Watch queue",
      "text": "Watch: sample fellowship opens soon",
      "note": "a Watch item doesn't count toward progress"
    },
    {
      "id": "s-5",
      "section": "social",
      "cat": "Events & plans",
      "text": "Decide: weekend trip?",
      "due": "2026-11-27"
    },
    {
      "id": "s-6",
      "section": "social",
      "cat": "Events & plans",
      "text": "Buy a birthday gift",
      "due": "2026-11-27"
    },
    {
      "id": "s-7",
      "section": "misc",
      "cat": "Admin",
      "text": "Renew library card",
      "due": "2026-11-30"
    }
  ]
};
/* DATA:END */
