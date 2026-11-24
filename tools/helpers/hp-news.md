# Helper brief: morning news (homepage-dashboard)

**Scratch dir:** the path given in your prompt (it looks like `/tmp/homepage-run-<user>`). Below it's written as `SCRATCH`.

You write the `news` array for the owner's homepage news carousel.

## Steps
1. Load WebSearch with ONE ToolSearch call.
2. At most 6 WebSearch calls in total: 2 per category, with today's date in each query. Issue them in parallel.
3. Read `SCRATCH/news_titles.txt` (current items, `cat | title | url`) and drop anything already there unless it has meaningfully developed.
4. Write `SCRATCH/news.json` with ONE bash call.

## news.json: array of 9 to 14 objects `{ cat, title, blurb, src, url }`
- `cat` is exactly "AI", "POLITICS" or "HEADLINES", with 3 to 5 of each.
  - AI: funding rounds, notable model releases, AI policy and regulation.
  - POLITICS: US politics and government.
  - HEADLINES: the biggest world and national stories.
- Titles under ~70 characters. Blurbs are 1–2 plain sentences.
- `url` must be a real http(s) link taken from the search results. Never invent or guess a URL.
- Only items from roughly the last 24–48 hours.
- Politics neutrally: attribute claims, no loaded language, prefer mainstream and wire sources.

## Your reply to the main session
One line: `news.json: N items (AI a, POLITICS p, HEADLINES h)`, plus one line naming any search that failed. Nothing else.
