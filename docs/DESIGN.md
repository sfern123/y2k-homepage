# Design: the page, its history, and how to redesign it safely

## Part A · The vibe, and how we got here

### The brief, in my own words

- "everything on one page, no tabs"
- "a greeting and an ironically sad quote from an existential philosopher in old school word art"
- "2000s webcore in all grey", and fire alerts are "the one thing that is allowed to be colored"
- "a stick version of Sisyphus rolling the boulder up a hill" (the boulder rises as I finish tasks)
- "more of a gamification element"
- "make the pink the main style for the homepage!!"

The current look is pink 98: a Windows 98 desktop in pink. It has bevelled window frames with titlebars like `homework.exe`, pixel icons, WordArt, marquee tickers, a sparkle cursor, a fake visitor counter and a "best viewed at 800×600" footer. The humour is deadpan: Sisyphus, existential quotes, a garbage can that runs across the screen when I trash a to-do, and a fomo_4ever instant messenger nagging me to decide on events.

### What I gave Claude, and what worked

- **Hand sketches** of the layout and of the urgent cards.
- **Screenshots as references:**
  - Win98 screens became the pink 98 and lilac 98 themes.
  - Synthwave/arcade "PRESS START" images became game mode: XP, levels, a sticker book and a HUD.
  - Phone, IM and spam pop-up images became the social section.
- **The loop that worked:** screenshot or sketch → a one-line reaction → Claude edits and tests → I reload the tab.
- **Multiple-choice questions at forks** beat Claude guessing.
- **Big experiments in a lab copy** (`Homepage-lab/`) meant the live page never broke.

### Design history (about 16 rounds, Sep 21–29, 2026)

1. An interactive to-do list, first as a Cowork artifact.
2. A tabbed dashboard, **rejected**: "no tabs".
3. One page in grey webcore: WordArt greeting, philosopher quote, plant, news carousel, fireworks.
4. The plant became stick-figure Sisyphus, and the urgent fire banner was added.
5. The urgent alert took four tries:
   - aggressive fire banner: too much
   - soft rounded cards: "cuter", but rounded felt anachronistic
   - square dancing sticky notes: "wayyy better!"
   - final: **bounce, not shake**
6. Layout from my sketch: next-class/next-event ticker; homework, jobs and social sections; the social_life.exe week graphic.
7. Theme lab: aero, pink 98 and lilac 98, tried side by side in a copy.
8. More emoji, clip art and pixel icons (17 icons at first).
9. Gamification: arcade HUD, XP, levels, PRESS START, sticker book.
10. Pixel "it girl" Sisyphus, a flip-phone social calendar, the IM chat for decisions, and spam pop-ups for social to-dos.
11. **Pink 98 promoted to the live page**; grey backed up.
12. Sep 28–29 polish:
    - homework folded by time horizon
    - my IM replies right-aligned like a real text thread
    - a trash button on every to-do, with a garbage can that runs across the bottom, plus restore
    - the design split into `assets/` to keep the daily runs cheap

### Taste notes (keep unless I say otherwise)

- **Anachronism matters.** No modern rounded-corner cards or glassy gradients inside the 98 look; square bevels and pixel art instead.
- **Motion:** bouncy and playful, not shaky or aggressive. Respect reduced motion.
- **Urgency:** loud but not stressful.
- **Humour:** deadpan and self-aware (Sisyphus, "HERMIT MODE", "rsvp or regret 💅"). Never mean.
- **Density:** everything on one page. But when a list gets long (homework through December), fold or hide it instead of making me scroll.
- **Characters:** no trademarked characters or brands (a Bratz doll and Sanrio were declined). Original pixel characters are great.
- **Colour:** under grey webcore, only urgency was coloured. Under pink 98, pink is the house colour and the fire banner still stands out.

### Rejected or parked

- Tabs.
- A Spotify widget: Web API with PKCE, the Playback SDK or an embed player were considered. Parked: "let's focus on the UI updates".
- A scrollable homework panel, course tabs, rebalancing columns. Folds won.
- The lilac 98 and aero themes (still in the code, unused).

## Part B · Page map (current code)

### Load order in `dashboard.html`

| Asset | Size | Role |
|---|---|---|
| `assets/base-0.css` | 19 KB | Original grey Win98 look: frames, buttons, insets, tickers, hero, news, to-do, folds, trash panel, garbage can, social_life, footer, `#fx`, `#toast`, urgent cards. Hard-coded greys, no variables. Breakpoint at 640px; has a reduced-motion block. |
| `assets/theme-aero.css` | 10 KB | Frutiger Aero theme (`body.theme-aero`). **Unused.** |
| `assets/theme-pastel98.css` | 46 KB | Pink 98 and lilac 98 variables and restyles, plus the `#lab-deco` decorations. |
| `assets/theme-pastel98-icons.css` | 533 KB | 54 data-URI pixel icons (`.ico-*`) for each theme, ♥/★ checkmarks, `#lab-toolbar`, `#lab-desktop`, `.emo` stickers. **About half is lilac-only (unused).** |
| `assets/game-mode.css` | 10 KB | Arcade HUD, +XP floats, level-up, achievement toast, sticker book, PRESS START. Hidden unless `body.game-on`. |
| `assets/social-fun.css` | 9 KB | Flip phone, IM window, spam pop-ups; `--hill`/`--rock`. **No reduced-motion block.** |
| `assets/urgent-bounce.css` | 1 KB | Squash-and-stretch bounce for the urgent cards. |
| `assets/home-overrides.css` | 44 B | `#theme-switch{display:none!important}`. |

Body order is:

1. Static markup: `canvas#fx`, `#aero-bubbles`, `nav#lab-desktop`, `#lab-deco`, `#theme-switch`.
2. `app-1.js`: forces the pink98 theme; aero bubbles.
3. The `#page` markup and `#toast`.
4. `data.js`, `courses.js`, `tasks-archive.js`, then the inline fallback.
5. `app-2.js`: the core, 667 lines.
6. `app-3.js`: LCD clock and emoji row.
7. `#press-start`, `#lvlup`, `#ach`.
8. `app-4.js`: game mode.
9. `app-5.js`: it-girl Sisyphus and the phone, IM and spam social section.

### Sections, top to bottom

| Section (titlebar) | Container ids | Rendered by |
|---|---|---|
| Fireworks (fixed canvas) | `#fx` | `celebrate` / `burst` / `tick` (app-2) |
| Desktop icons (left margin, ≥1180px) | `nav#lab-desktop` | static HTML: school portal, inbox, calendar, canvas, homework, job hunt, tunes, photos |
| Emoji/pixel decorations | `#lab-deco` | static + CSS (pudding and hearts in pink98) |
| Top ticker | `marquee#marquee` | `renderPlant` (app-2): "…sisyphus is N% up the hill… last updated…" |
| **&lt;name&gt;.exe**: WordArt greeting and quote | `#greet`, `#quote`, `#quote-attr` | `greet()` + `wordArt`, `quote()` (app-2) |
| Fire banner (inside the hero) | `#urgent`, `#u-list`, `#u-prev`, `#u-next` | `renderUrgent` / `updateArrows` (app-2), every 30 s |
| **sisyphus.exe** | `#plant`, `#plant-status`, `#hpfill` | `renderPlant` → `plantSVG` (app-2), replaced by app-5 |
| Next class / event ticker | `marquee#nextbar` | `renderNext` (app-2), every 60 s |
| Toolbar | `#lab-toolbar`, `#lab-emo`, `#lab-clock` | static + `tick()` (app-3) |
| Arcade HUD (game mode) | `#arcade-hud`, `#hud-*` | `renderHUD` (app-4) |
| **news_ticker.exe** | `#news-win`, `#news-title`, `#cats`, `#slide`, `#dots`, `#car-count`, `#prev`, `#next` | `renderCats`, `renderSlide`, `startAuto` (app-2) |
| To-do toolbar | `[data-filter]` open/all/done, `#todo-prog`, `#trash-open`, `#trash-n`, `#clear-done`, `#trash-panel` | `renderTodo`, `renderTrashBin` (app-2) |
| **homework.exe** | `#sec-hw` | `renderTodo` / `groupsFor("hw")` with folds |
| **social_life.exe** week graphic | `#soc-art` | `renderSocial` (app-2) |
| **job_hunt.exe** | `#sec-jobs` | `renderTodo` / `groupsFor("jobs")`: deadlines / decide / watching |
| **social_calendar.txt**: flip phone, IM, spam | `#soc-week` (`#ph-list`, `#ph-clock`), `#sec-social` | app-5 `renderSocial` wrapper and `renderSocialFun` |
| **sticker_book.exe** (game mode) | `#sticker-book-win`, `#book-head`, `#book` | `renderBook` (app-4) |
| **misc_admin.txt** (hidden when empty) | `#misc-win`, `#sec-misc` | `renderTodo` |
| **today.txt** | `#today` | `today()` (app-2) |
| Footer: counter and "updated" | `#counter`, `#updated` | `today()` (app-2) |
| Toast, PRESS START, level-up, achievement overlays | `#toast`, `#press-start`, `#lvlup`, `#ach` | app-2 `toast()`, app-4 |

### Feature inventory

- **Greeting:** time of day ("Up late" before 5 am, then Good morning / afternoon / evening, ", <name from config.js>") as WordArt letters on a sine wave.
- **Quote:** 8 hard-coded existentialist quotes in `QUOTES` (app-2): Camus, Schopenhauer, Sartre ×2, Kierkegaard ×3, Pascal. It rotates by day of year.
- **Sisyphus:**
  - Progress = checked actionable tasks ÷ all actionable tasks. Watch items are excluded.
  - The boulder moves up the hill with progress.
  - The it-girl sprite sweats below 50% and sparkles above 75%.
  - Status bands run from 0 up to "summit".
- **Fire banner:**
  - Tasks with a `dueTime` show when ≤ 24 h remain. Date-only tasks show when due today or tomorrow.
  - Everything stays until 48 h overdue, then drops back to its list.
  - `DATA.urgent` items get a "put it out" button.
  - Cards bounce; overdue cards get `.over`. Arrows appear only when the cards overflow.
- **Next-class ticker:** in class now → next class → happening now → next event → after that. Timed events only.
- **News carousel:** ALL / POLITICS / HEADLINES / AI filters, auto-advancing every 8 s, pausing on hover.
- **To-do lists:**
  - The open/all/done filter and the progress counter.
  - Due tags: PAST / DUE date time (≤ 3 days, timed) / !! TODAY / hot ≤ 3 days / warm ≤ 10 days / cool.
  - The `[go]` link and note.
  - Checking an item fires fireworks and a toast, and moves the boulder up a step.
- **Homework folds:** next 7 days · 8–14 days · later, folded per course ("later · FINANCE 201" etc.). The "next MON DD" hint shows while folded; fold state is remembered.
- **Trash:**
  - 🗑 on every to-do: list items, urgent cards, IM replies ("nah"), and spam pop-ups (the "x" or the 🗑).
  - The item crumples, then a pixel garbage can with a face runs across the bottom with a speech bubble ("yoink!").
  - The "🗑 trash (N)" toolbar button opens a restore panel.
- **Social:**
  - "Decide" tasks become fomo_4ever IM exchanges, with my replies right-aligned like texts.
  - Other social to-dos become 90s spam pop-ups ("CLAIM (mark done)").
  - The flip-phone calendar lists 10 days, with a battery and a clock.
  - social_life.exe draws a disco ball and stick figures per day. Status runs from HERMIT MODE to BOOKED & BUSY, with a battery.
- **Game mode** (app-4):
  - XP per task: hw 15, jobs 25, social 8, misc 8, watch 5. Bonuses: ON TIME, CLUTCH (last 24 h), COMBO.
  - Levels with 8 titles, 12 badges with achievement pop-ups, and a HUD (time to next deadline, lap = week of the quarter from Sep 21, streak, high score, next boss).
  - PRESS START appears once a day. Unchecking takes the XP back.
  - **On by default. The only toggle is inside the hidden theme switcher, so there's no visible way to turn it off.**
- **Small touches:** the LCD clock, the fake visitor counter (`sf_hits`, starts at 246), the sparkle cursor trail, and toasts.
- **Reduced motion:** the JS `reduceMotion` flag turns off sparkles and the garbage can and shrinks the fireworks. There are CSS blocks in most files, **except social-fun.css**, so the IM typing dots always blink.

### Pink 98 palette (CSS variables under `body.theme-pink98`)

| Var | Hex | Var | Hex |
|---|---|---|---|
| `--face` | #f8c3dc | `--ink` | #4a0f2e |
| `--hi` | #fff0f7 | `--inset` | #fff6fa |
| `--lo` | #c45a8e | `--accent` | #e0288a |
| `--dark` | #6e1c46 | `--soft` | #f5a3c9 |
| `--title1` | #b3186a | `--title2` | #f58cc0 |
| `--lcd-bg` | #2b0716 | `--lcd-fg` | #ff5fa8 |
| `--hill` | #f5a3c9 | `--rock` | #fff0f7 |

- **Checkmark glyph:** ♥ (lilac used ★). A ♥ glyph also appears before each titlebar.
- **Fonts:** local only (Tahoma/Verdana, Impact, Courier New, Comic Sans MS; Brush Script in SVG). **No web fonts, CDNs or network calls**, so the page works offline over `file://`.

## Part C · Fragile spots (read before editing code)

- **Shared globals.**
  - app-2 declares top-level `const`/`let`/`function` in classic scripts. app-4 and app-5 use them by name: `DATA, tasks, done, trashed, filter, store, $, esc, safeUrl, reduceMotion, sectionOf, isWatch, deadlineOf, daysUntil, dueTag, byDue, trashBtn, celebrate, renderPlant, renderUrgent, renderTodo, plantSVG, renderSocial`.
  - **Don't convert to ES modules or wrap app-2 in an IIFE** without rewiring app-4 and app-5.
- **Monkey-patching.**
  - app-5 reassigns `plantSVG`, `renderSocial` and `renderTodo`. The `renderTodo` wrapper runs the original, then `renderSocialFun()`.
  - app-5 also swaps parts of app-2's Sisyphus SVG by exact string match (`fill="#a8a8a8"`, `<g class="push">`, `circle cx="119" cy="12"`, …). Changing `plantSVG` markup silently breaks the sprite.
- **Checkmarks.**
  - A checkbox needs `class="cb"` and `data-id`, and must sit inside `#sec-hw`, `#sec-jobs`, `#sec-social`, `#sec-misc` or `#u-list`, because the change listeners are bound only there.
  - Elsewhere, game XP is awarded but the done state isn't saved.
- **Trash.**
  - Any `[data-trash]` element works, through a document-level handler. The crumple effect targets `.item`, `.u-card`, `.im-msg` or `.spam`.
  - `#trash-panel` must start with an inline `style="display:none"`, because the toggle tests `style.display`.
- **Missing ids throw.**
  - app-2 and app-4 call `$()` on the ids above without null checks. Removing an element stops the script from that point on.
  - app-1 and app-4 need `#theme-switch` to exist, even though it's hidden.
- **Script order matters:** app-1 after `#theme-switch`; app-4 after `#press-start`, `#lvlup` and `#ach`; app-2 after data.js.
- **Other traps:**
  - `[data-filter]` is matched page-wide, so other elements with that attribute would join the filter buttons.
  - `#clear-done` has two listeners (app-2 confirm, app-4 reconcile).
  - social-fun.css uses `.win:has(#soc-week) > .winbody` for its two-column layout.

## Part D · What a redesign must keep

1. **Load the data** with `data.js`, `courses.js`, `tasks-archive.js` and the inline fallback, in that order, before the code that reads them. Read `DATA` by name (it's a `const`, not `window.DATA`).
2. **Honour the data contract** in `02-DATA-CONTRACT.md`: all six fields, the task fields, id-keyed state, and the merge with first-wins de-duplication.
3. **Keep the localStorage keys** (`sf_todo_done_v1`, `sf_todo_trash_v1`, `sf_folds_open`, `sf_urgent_dismissed`, `sf_game_v1`, …), or migrate them on first load. Otherwise checkmarks, trash and XP reset.
4. **Keep the behaviours I rely on** unless I explicitly drop them:
   - the fire banner with its 24 h / 48 h rules
   - done + trash + restore on every to-do
   - homework folds or an equivalent
   - the next-class ticker, the today brief, and the news with links
5. **Offline and `file://`:** no fetch, no CDNs, no web fonts, no remote images. Icons as inline SVG or data URIs.
6. **Stay light:** the runs don't read `assets/`, so size doesn't cost tokens there. But design chats do pay to read big files. Keep code split into small, named files. Drop unused themes (aero, lilac) rather than carrying them.
7. **Accessibility basics:** keyboard-usable checkboxes and buttons, alt/aria on icons, and reduced motion respected everywhere (including social-fun).
8. **The same file paths.** `dashboard.html` stays at `Documents/Claude/Homepage/dashboard.html`, or else I have to change New Tab Redirect.

## Part E · Redesign workflow (recommended)

1. **Brief.** I give a one-line vibe plus screenshots or a moodboard, and the rules ("only X is coloured").
2. **Three directions.** Build three quick mockups side by side, in `Homepage-lab/` or as images, using real data from a copy of data.js. I pick one. *Choose the look before building features*: the grey-to-pink switch caused most of last time's rework.
3. **Build in the lab.** Copy `Homepage/` to `Homepage-lab/redesign-<name>/` and keep the same relative structure so `data.js` loads. Batch my feedback into 3–5 changes per round.
4. **Test.** Load old and new in jsdom (script below). Check:
   - the same task count and ids
   - no console errors
   - checkmarks and trash round-trip through localStorage
   - the fire banner renders
   - reduced-motion mode works
5. **Switch over only after I approve:**
   - Back up the live `dashboard.html` and `assets/` to `Homepage-lab/backup-<date>/`.
   - Copy the new files in.
   - Ask me to open a new tab and hard-refresh.
6. **Clean up.** Delete dead CSS and JS, and update this doc (Part B) and `00-START-HERE.md`.

### Side-by-side test harness (Node + jsdom)

```js
// npm i jsdom (in a scratch folder). Compare two page paths.
const {JSDOM,VirtualConsole}=require("jsdom");
async function snap(p){
  const vc=new VirtualConsole(), errs=[]; vc.on("jsdomError",e=>errs.push(e.message));
  const dom=await JSDOM.fromFile(p,{runScripts:"dangerously",resources:"usable",pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
      w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.Element.prototype.scrollBy=function(){};}});
  await new Promise(r=>setTimeout(r,1500)); const d=dom.window.document, q=s=>d.querySelectorAll(s).length;
  return {errs, prog:d.getElementById("todo-prog")?.textContent, items:q(".item"), urgent:q("#u-list .u-card"),
          ids:new Set([...d.querySelectorAll(".cb[data-id]")].map(e=>e.dataset.id)).size};
}
(async()=>{console.log(await snap(process.argv[2]), await snap(process.argv[3]));})();
```
Baseline on Sep 29:
- 0 errors, `[0/155 done]` (with nothing checked yet)
- 119 list items, 155 unique checkbox ids
- about 20 urgent cards, 34 IM messages, 19 spam pop-ups

## Part F · Ideas I've floated but not built

- A Spotify / "now playing" widget (parked).
- A visible game-mode toggle, since it's currently stuck on.
- Showing a "decide" task and its calendar event as one combined item, rather than twice. We decided to leave both for now.
- Packaging the whole thing as a Cowork skill with 2–3 starter themes, so others can build their own.
