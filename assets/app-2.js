/* ===================================================================
   DATA — the only block the scheduled tasks edit.
   Rules: keep task ids stable (checkbox state is keyed by id);
   only append new tasks, never rename or delete existing ids.
   =================================================================== */
/* DATA lives in data.js (+ courses.js, tasks-archive.js); merged here. */
(function () { const seen = new Set(); DATA.tasks = [].concat(window.COURSE_TASKS || [], window.TASK_ARCHIVE || [], DATA.tasks || []).filter(t => t && t.id && !seen.has(t.id) && seen.add(t.id)); })();

/* ---------------- helpers ---------------- */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = u => (/^https?:\/\//i.test(u || "") ? u : null);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- greeting (wave wordart) ---------------- */
function wordArt(el, text) {
  let i = 0;
  el.innerHTML = text.split(" ").map(w =>
    '<span class="wa-word">' + Array.from(w).map(ch => {
      const y = Math.sin(i * 0.55) * 7; i++;
      return '<span class="wa-ch" style="transform:translateY(' + y.toFixed(1) + 'px)">' + esc(ch) + "</span>";
    }).join("") + "</span>"
  ).join(" ");
}
(function greet() {
  const h = new Date().getHours();
  const g = h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  wordArt($("greet"), g + ", " + ((window.HOMEPAGE_CONFIG && HOMEPAGE_CONFIG.name) || "friend"));
})();

/* ---------------- quote of the day ---------------- */
/* Nov 1: 44 quotes (8 originals + 36 late-capitalism despair picks); rotates by day of year */
const QUOTES = [
  { q: "One must imagine Sisyphus happy.", a: "Albert Camus", note: "he also had a to-do list" },
  { q: "It is easier to imagine the end of the world than to imagine the end of capitalism.", a: "Fredric Jameson", note: "popularized by Mark Fisher. anyway, back to recruiting" },
  { q: "I would prefer not to.", a: "Herman Melville, Bartleby, the Scrivener", note: "suggested reply to the 4th coffee chat request" },
  { q: "Life swings like a pendulum backward and forward between pain and boredom.", a: "Arthur Schopenhauer" },
  { q: "Capital is dead labour which, vampire-like, lives only by sucking living labour, and lives the more, the more labour it sucks.", a: "Karl Marx, Capital", note: "see also: summer associate" },
  { q: "The mass of men lead lives of quiet desperation.", a: "Henry David Thoreau", note: "the women get a calendar invite" },
  { q: "I love deadlines. I love the whooshing noise they make as they go by.", a: "Douglas Adams", note: "🪦 missed.exe agrees" },
  { q: "Hell is other people.", a: "Jean-Paul Sartre", note: "enjoy networking night" },
  { q: "Nowadays people know the price of everything and the value of nothing.", a: "Oscar Wilde", note: "so, an MBA" },
  { q: "Work expands so as to fill the time available for its completion.", a: "C. Northcote Parkinson", note: "and the time available is all of it" },
  { q: "The idea that the poor should have leisure has always been shocking to the rich.", a: "Bertrand Russell, In Praise of Idleness" },
  { q: "Anxiety is the dizziness of freedom.", a: "Søren Kierkegaard", note: "freedom = 14 open applications" },
  { q: "All that is solid melts into air, all that is holy is profaned.", a: "Karl Marx & Friedrich Engels", note: "incl. your weekend" },
  { q: "I have measured out my life with coffee spoons.", a: "T. S. Eliot", note: "and 30-minute coffee chats" },
  { q: "In the long run we are all dead.", a: "John Maynard Keynes", note: "the long run is also when the loans are due" },
  { q: "Beware of all enterprises that require new clothes.", a: "Henry David Thoreau", note: "business casual is a warning sign" },
  { q: "Marry, and you will regret it; don't marry, you will also regret it.", a: "Søren Kierkegaard", note: "same with consulting" },
  { q: "One of the symptoms of an approaching nervous breakdown is the belief that one's work is terribly important.", a: "Bertrand Russell, The Conquest of Happiness", note: "it is, though. to the shareholders" },
  { q: "Nothing to be done.", a: "Samuel Beckett, Waiting for Godot", note: "(there are 14 things to be done)" },
  { q: "Remember that time is money.", a: "Benjamin Franklin", note: "so you're broke two ways" },
  { q: "A cage went in search of a bird.", a: "Franz Kafka", note: "the cage is a return offer" },
  { q: "All of humanity's problems stem from man's inability to sit quietly in a room alone.", a: "Blaise Pascal" },
  { q: "The trouble with the rat race is that even if you win, you're still a rat.", a: "attributed to Lily Tomlin", note: "but a rat with equity" },
  { q: "When a measure becomes a target, it ceases to be a good measure.", a: "Goodhart's law, as put by Marilyn Strathern", note: "see: the sisyphus progress bar" },
  { q: "The proletarians have nothing to lose but their chains.", a: "Karl Marx & Friedrich Engels", note: "and their unpaid VC internship" },
  { q: "It is not that we have a short time to live, but that we waste a lot of it.", a: "Seneca, On the Shortness of Life", note: "mostly in CareerHub" },
  { q: "Man is condemned to be free.", a: "Jean-Paul Sartre" },
  { q: "Whoever fights monsters should see to it that in the process he does not become a monster.", a: "Friedrich Nietzsche", note: "re: case interview prep" },
  { q: "Most people are other people. Their thoughts are someone else's opinions, their lives a mimicry, their passions a quotation.", a: "Oscar Wilde, De Profundis", note: "their LinkedIn a template" },
  { q: "Work is the curse of the drinking classes.", a: "attributed to Oscar Wilde", note: "business school has run the experiment" },
  { q: "Man is born free, and everywhere he is in chains.", a: "Jean-Jacques Rousseau", note: "the chains are lanyards" },
  { q: "Time is an illusion. Lunchtime doubly so.", a: "Douglas Adams", note: "the lunch talk is triply so" },
  { q: "The cost of a thing is the amount of what I will call life which is required to be exchanged for it, immediately or in the long run.", a: "Henry David Thoreau, Walden", note: "please see tuition" },
  { q: "The most common form of despair is not being who you are.", a: "Søren Kierkegaard", note: "who you are: a pending application" },
  { q: "There is no such thing as a free lunch.", a: "popularized by Milton Friedman", note: "the info session pizza is a lien" },
  { q: "Everything that was directly lived has receded into a representation.", a: "Guy Debord, The Society of the Spectacle", note: "post it anyway" },
  { q: "He who has a why to live for can bear almost any how.", a: "Friedrich Nietzsche", note: "the why is the signing bonus" },
  { q: "Leisure is the mother of philosophy.", a: "Thomas Hobbes, Leviathan", note: "please put leisure on google calendar" },
  { q: "No one on their deathbed ever said, 'I wish I had spent more time at the office.'", a: "attributed to Paul Tsongas", note: "they did say 'circling back'" },
  { q: "The philosophers have only interpreted the world, in various ways; the point is to change it.", a: "Karl Marx, Theses on Feuerbach", note: "right after recruiting" },
  { q: "I am a sick man... I am a spiteful man.", a: "Fyodor Dostoevsky, Notes from Underground", note: "me after the 3rd superday" },
  { q: "Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.", a: "Samuel Beckett, Worstward Ho", note: "the application strategy" },
  { q: "The struggle itself toward the heights is enough to fill a man's heart.", a: "Albert Camus", note: "the heights: a second-round interview" },
  { q: "We must cultivate our garden.", a: "Voltaire, Candide", note: "your garden is your network" }
];
(function quote() {
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const q = QUOTES[doy % QUOTES.length];
  $("quote").textContent = "“" + q.q + "”";
  $("quote-attr").innerHTML = "~ " + esc(q.a) + (q.note ? ' <span class="note">(' + esc(q.note) + ")</span>" : "");
})();

/* ---------------- plant ---------------- */
function plantSVG(h) {
  const A = [4, 130], B = [116, 44];
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
  const d = [dx / L, dy / L], n = [d[1], -d[0]]; // n points up-left, away from the ground
  const P = t => [A[0] + dx * t, A[1] + dy * t];
  const K = "#1e1e1e", f1 = v => v.toFixed(1);
  let tufts = "";
  for (let i = 1; i < 9; i++) {
    const [x, y] = P(i / 9);
    tufts += '<path d="M' + f1(x - 2) + " " + f1(y + 6) + ' l2 -3 l2 3" fill="none" stroke="#6e6e6e" stroke-width="1"/>';
  }
  const hill = '<path d="M0 140 L0 133 L' + A[0] + " " + A[1] + " L" + B[0] + " " + B[1] + ' L160 44 L160 140 Z" fill="#a8a8a8" stroke="' + K + '" stroke-width="1.5"/>' +
    '<path d="M' + (A[0] + 3) + " " + (A[1] + 3) + " L" + (B[0] + 1) + " " + (B[1] + 3) + ' L158 47" fill="none" stroke="#d6d6d6" stroke-width="1"/>' + tufts;
  const boulder = (cx, cy, r, roll) =>
    '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + r + '" fill="#cfcfcf" stroke="' + K + '" stroke-width="1.7"/>' +
    '<g transform="rotate(' + f1(roll) + " " + f1(cx) + " " + f1(cy) + ')" stroke="#5a5a5a" stroke-width="1" fill="none">' +
    '<path d="M' + f1(cx - 9) + " " + f1(cy + 2) + ' l5 -2 l3 3 l4 -1"/>' +
    '<path d="M' + f1(cx + 2) + " " + f1(cy - 10) + ' l2 4 l-1 3"/>' +
    '<path d="M' + f1(cx + 6) + " " + f1(cy + 7) + ' l3 -3"/></g>' +
    '<path d="M' + f1(cx - r * 0.55) + " " + f1(cy - r * 0.55) + " A " + r + " " + r + " 0 0 1 " + f1(cx + r * 0.2) + " " + f1(cy - r * 0.93) + '" stroke="#f4f4f4" stroke-width="1.6" fill="none"/>';
  const st = 'stroke="' + K + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  const head = (x, y, fill) => '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="5" fill="' + fill + '" stroke="' + K + '" stroke-width="1.8"/>';
  let body = "";
  if (h < 0.999) {
    const r = 15;
    const sb = 0.4 + h * 0.46;                       // where the boulder touches the slope
    const [bx, by] = P(sb);
    const C = [bx + n[0] * r, by + n[1] * r];
    const lean = 42 * Math.PI / 180;                  // forward lean from vertical
    const man = t => {
      const F = P(t);
      const hip = [F[0] - 1, F[1] - 16];
      const sh = [hip[0] + 17 * Math.sin(lean), hip[1] - 17 * Math.cos(lean)];
      return { F, hip, sh };
    };
    // slide the man along the slope until his shoulders are an arm's length from the rock
    let t = sb - 0.05, m = man(t);
    for (let i = 0; i < 60; i++) {
      m = man(t);
      const dist = Math.hypot(m.sh[0] - C[0], m.sh[1] - C[1]) - r;
      if (Math.abs(dist - 13) < 0.3) break;
      t += (dist - 13) / L * 0.6;
    }
    const { hip, sh } = m;
    const back = P(t - 11 / L), front = P(t + 3 / L);
    const u = [sh[0] - C[0], sh[1] - C[1]], ul = Math.hypot(u[0], u[1]);
    const rot = a => [u[0] / ul * Math.cos(a) - u[1] / ul * Math.sin(a), u[0] / ul * Math.sin(a) + u[1] / ul * Math.cos(a)];
    const h1 = rot(-0.18), h2 = rot(0.32);
    const hand1 = [C[0] + h1[0] * r, C[1] + h1[1] * r], hand2 = [C[0] + h2[0] * r, C[1] + h2[1] * r];
    const hd = [sh[0] + 6.5 * Math.sin(lean - 0.55), sh[1] - 6.5 * Math.cos(lean - 0.55)];
    const roll = (sb * L / r) * 57.3;
    body =
      '<line x1="148" y1="44" x2="148" y2="22" stroke="' + K + '" stroke-width="1.5"/><path d="M148 22 L135 26 L148 30 Z" fill="#e8e8e8" stroke="' + K + '" stroke-width="1"/>' +
      boulder(C[0], C[1], r, roll) +
      '<g class="push">' +
      '<path d="M' + f1(back[0]) + " " + f1(back[1]) + " L" + f1(hip[0]) + " " + f1(hip[1]) + " L" + f1(front[0]) + " " + f1(front[1]) + '" ' + st + "/>" +
      '<path d="M' + f1(hip[0]) + " " + f1(hip[1]) + " L" + f1(sh[0]) + " " + f1(sh[1]) + '" ' + st + "/>" +
      '<path d="M' + f1(sh[0]) + " " + f1(sh[1]) + " L" + f1(hand1[0]) + " " + f1(hand1[1]) + " M" + f1(sh[0]) + " " + f1(sh[1] + 2) + " L" + f1(hand2[0]) + " " + f1(hand2[1]) + '" ' + st + "/>" +
      head(hd[0], hd[1], "#e8e8e8") +
      (h < 0.5 ? '<path class="drip" d="M' + f1(hd[0] - 8) + " " + f1(hd[1] - 3) + ' q-1.8 2.6 0 3.4 q1.8 -.8 0 -3.4z" fill="#fff" stroke="' + K + '" stroke-width=".8"/>' : "") +
      "</g>";
  } else {
    body = boulder(144, 29, 15, 400) +
      '<path d="M114 44 L119 31 L124 44" ' + st + "/>" +
      '<path d="M119 31 L119 18" ' + st + "/>" +
      '<path d="M119 21 L111 11 M119 21 L127 11" ' + st + "/>" +
      head(119, 12, "#fff") +
      [[98, 16], [104, 34], [132, 8], [90, 34]].map(([x, y]) => '<text x="' + x + '" y="' + y + '" font-size="11" fill="#fff" stroke="#000" stroke-width=".5">✦</text>').join("");
  }
  return '<svg width="160" height="140" viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">' + hill + body + "</svg>";
}
function plantStatus(h) {
  if (h <= 0) return "AT THE BOTTOM. AGAIN.";
  if (h < 0.25) return "PUSHING...";
  if (h < 0.5) return "SWEATING";
  if (h < 0.75) return "HALFWAY-ISH";
  if (h < 0.999) return "ALMOST THERE";
  return "SUMMIT! (see u tomorrow)";
}

/* ---------------- news carousel ---------------- */
const CATS = ["ALL", "POLITICS", "HEADLINES", "AI"];
const CAT_ORDER = { POLITICS: 0, HEADLINES: 1, AI: 2 };
let catSel = "ALL", slideIdx = 0, autoTimer = null, paused = false;
function slides() {
  return DATA.news.filter(n => catSel === "ALL" || n.cat === catSel)
    .slice().sort((a, b) => (CAT_ORDER[a.cat] ?? 9) - (CAT_ORDER[b.cat] ?? 9));
}
function renderCats() {
  $("cats").innerHTML = CATS.map(c => '<button class="btn' + (c === catSel ? " on" : "") + '" data-cat="' + c + '">' + c.toLowerCase() + "</button>").join("");
}
function renderSlide() {
  const list = slides();
  if (!list.length) { $("slide").innerHTML = '<div class="empty">no news is good news?</div>'; $("dots").innerHTML = ""; $("car-count").textContent = ""; return; }
  slideIdx = (slideIdx + list.length) % list.length;
  const s = list[slideIdx];
  const url = safeUrl(s.url);
  $("slide").innerHTML =
    '<span class="slide-cat">' + esc(s.cat) + '</span><span class="blink">NEW!</span>' +
    '<div class="slide-title">' + esc(s.title) + "</div>" +
    '<div class="slide-blurb">' + esc(s.blurb) + "</div>" +
    '<div class="slide-src">source: ' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(s.src) + "</a>" : esc(s.src)) + "</div>";
  $("dots").innerHTML = list.map((_, i) => '<button class="dot' + (i === slideIdx ? " on" : "") + '" data-i="' + i + '" aria-label="slide ' + (i + 1) + '"></button>').join("");
  $("car-count").textContent = (slideIdx + 1) + "/" + list.length;
  $("news-title").textContent = "■ news_ticker.exe — [" + s.cat + "]";
}
function startAuto() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => { if (!paused) { slideIdx++; renderSlide(); } }, 8000);
}
$("cats").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  catSel = b.dataset.cat; slideIdx = 0; renderCats(); renderSlide(); startAuto();
});
$("prev").addEventListener("click", () => { slideIdx--; renderSlide(); startAuto(); });
$("next").addEventListener("click", () => { slideIdx++; renderSlide(); startAuto(); });
$("dots").addEventListener("click", e => {
  const d = e.target.closest("[data-i]"); if (!d) return;
  slideIdx = +d.dataset.i; renderSlide(); startAuto();
});
$("news-win").addEventListener("mouseenter", () => { paused = true; });
$("news-win").addEventListener("mouseleave", () => { paused = false; });

/* ---------------- to-do ---------------- */
const DONE_KEY = "sf_todo_done_v1";
let done = store.get(DONE_KEY, {});
let filter = "open";
// Trashed to-dos are stored by id (like checkboxes) and filtered out at the source,
// so every view (lists, urgent cards, chat, plant, progress) skips them automatically.
const TRASH_KEY = "sf_todo_trash_v1";
let trashed = store.get(TRASH_KEY, {});
// Auto-expire (added Oct 1): events vanish ~2h after they start (end of day if no time);
// deadlines/applications get 48h of late grace, then go to the trash. Done items are left alone.
// Auto-trashed ids are remembered, so anything you ♻ restore stays restored.
const AUTO_KEY = "sf_todo_autotrash_v1";
let autoTrashed = store.get(AUTO_KEY, {});
// Nov 1: deadlines now clear after 24h overdue (was 48h) and land in 🪦 missed.exe (app-7), not the manual trash.
const EVENT_AFTER = 2 * 3600e3, DEADLINE_AFTER = 24 * 3600e3;
const DEADLINE_RE = /\b(apply|applications?|submit|submission|register|registration|sign[- ]?ups?|forms?|reply|reply-all|respond|email|send|complete|finish|homework|hw|assignment|deliverable|problem set|deadline|claim|pick up|lottery|enter|fill|pay|venmo|enroll|waiver|training|upload|book|edit or skip|inspection)\b|\d+\s*pts\b/i;
const EVENT_RE = /\b(prep|talk|panel|dinner|lunch|breakfast|party|retreat|hang|open house|orientation|session|kickoff|happy hour|reception|game|conference|meetup|workshop|fair|forum|potluck|picnic|pitch day|onboarding)\b/i;
function kindOf(t) {
  if (t.kind === "event" || t.kind === "deadline") return t.kind; // explicit tag wins
  const txt = t.text || "";
  if (/^(pick one|rsvp|register:)/i.test(txt)) return "event";
  if (DEADLINE_RE.test(txt)) return "deadline";
  if (/prep$/i.test(t.cat || "") || EVENT_RE.test(txt)) return "event";
  return "deadline"; // unsure → keep it longer
}
function expiresAt(t) {
  const dl = deadlineOf(t); if (!dl) return null;
  if (kindOf(t) === "event") return t.dueTime ? dl.getTime() + EVENT_AFTER : dl.getTime();
  return dl.getTime() + DEADLINE_AFTER;
}
function autoExpire() {
  const now = Date.now(); let n = 0;
  DATA.tasks.forEach(t => {
    if (done[t.id] || trashed[t.id] || autoTrashed[t.id]) return;
    const x = expiresAt(t);
    if (x != null && now > x) { trashed[t.id] = now; autoTrashed[t.id] = now; n++; }
  });
  if (n) { store.set(TRASH_KEY, trashed); store.set(AUTO_KEY, autoTrashed); }
  return n;
}
const autoCleared = autoExpire();
const tasks = [];
function syncTasks() { tasks.length = 0; DATA.tasks.forEach(t => { if (!trashed[t.id]) tasks.push(t); }); }
syncTasks();
const trashBtn = (id, label) => '<button type="button" class="trash-btn" data-trash="' + esc(id) + '" title="trash it (not doing this)">🗑' + (label ? " " + label : "") + "</button>";
const actionable = () => tasks.filter(t => !/^watch/i.test(t.cat));

function deadlineOf(t) { return t.due ? new Date(t.due + "T" + (t.dueTime || "23:59") + ":00") : null; }
function daysUntil(d) { return Math.ceil((new Date(d + "T23:59:59") - new Date()) / 86400000); }
function dueTag(d, t) {
  if (!d) return "";
  const n = daysUntil(d);
  const label = new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
  const dl = t ? deadlineOf(t) : null;
  if (dl && dl < new Date()) return '<span class="due past">PAST ' + label + "</span>";
  if (n < 0) return '<span class="due past">PAST ' + label + "</span>";
  if (t && t.dueTime && n <= 3) return '<span class="due hot">DUE ' + label + " " + esc(t.dueTime) + "</span>";
  if (n === 0) return '<span class="due hot">!! TODAY</span>';
  if (n <= 3) return '<span class="due hot">DUE ' + label + "</span>";
  if (n <= 10) return '<span class="due warm">DUE ' + label + "</span>";
  return '<span class="due cool">' + label + "</span>";
}
function health() {
  const a = actionable();
  if (!a.length) return 1;
  return a.filter(t => done[t.id]).length / a.length;
}
function renderPlant() {
  const h = health();
  $("plant").innerHTML = plantSVG(h);
  $("plant-status").textContent = plantStatus(h);
  $("hpfill").style.width = Math.round(h * 100) + "%";
  $("marquee").textContent = "~*~ welcome 2 my homepage ~*~ sisyphus is " + Math.round(h * 100) +
    "% of the way up the hill ~*~ " + plantStatus(h).toLowerCase() + " ~*~ last updated " + DATA.generatedAt + " ~*~ thx 4 visiting ~*~";
}
/* sections: hw | jobs | social | misc. Tasks carry an optional `section`; otherwise it's inferred. */
const SECTION_IDS = { hw: "sec-hw", jobs: "sec-jobs", social: "sec-social", misc: "sec-misc" };
function sectionOf(t) {
  if (t.section && SECTION_IDS[t.section]) return t.section;
  const txt = t.text || "", cat = t.cat || "";
  if (/\b(FINANCE|ACCT|OB|OIT|MS&E|STRAMGT|MKTG|GSBGEN|ECON|POLECON)\s?\d|homework|assignment|problem set|canvas|\bcase\b|\bGER\b|exam|quiz|midterm|reading/i.test(txt)) return "hw";
  if (/career|watch/i.test(cat) || /apply|application|fellowship|internship|recruit|\bjobs?\b|associate|resume|coffee chat|\bVC\b|venture/i.test(txt)) return "jobs";
  if (/event|plan|social/i.test(cat) || /rsvp|party|retreat|dinner|social|club|trip|foam|conference|talk|lunch|happy hour|lottery/i.test(txt)) return "social";
  return "misc";
}
const isWatch = t => /^watch/i.test(t.cat || "");
function byDue(a, b) {
  const da = a.due || "9999-99-99", db = b.due || "9999-99-99";
  if (da !== db) return da < db ? -1 : 1;
  return (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99");
}
function groupsFor(sec, items) {
  if (sec === "jobs") return [
    ["deadlines", items.filter(t => t.due && !isWatch(t))],
    ["decide / to do", items.filter(t => !t.due && !isWatch(t))],
    ["watching", items.filter(isWatch)]
  ];
  if (sec === "hw") {
    // Time horizon: near-term stays open; everything further out folds into one collapsed group per course.
    const soon = [], next = [], later = new Map();
    items.forEach(t => {
      const n = t.due ? daysUntil(t.due) : 0; // undated hw counts as "now"
      if (n <= 7) soon.push(t);
      else if (n <= 14) next.push(t);
      else {
        const k = /prep$/i.test(t.cat || "") ? t.cat : "other courses & forms";
        if (!later.has(k)) later.set(k, []);
        later.get(k).push(t);
      }
    });
    const groups = [["due in the next 7 days", soon], ["8–14 days out", next]];
    [...later.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([k, list]) => groups.push(["later · " + k.replace(/\s*prep$/i, ""), list, "hw:" + k]));
    return groups;
  }
  if (sec === "social") return [["to decide / do", items]];
  return [["everything else", items]];
}
// Collapsed-group state (folded by default), remembered like the checkboxes.
const FOLD_KEY = "sf_folds_open";
let foldsOpen = store.get(FOLD_KEY, {});
function foldHint(list) {
  const first = list.find(t => t.due);
  if (!first) return "";
  const label = new Date(first.due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
  return '<span class="fold-hint">next ' + esc(label) + "</span>";
}
function itemHTML(t) {
  const isDone = !!done[t.id];
  const url = safeUrl(t.link);
  return '<div class="item' + (isDone ? " done" : "") + '">' +
    '<input type="checkbox" class="cb" data-id="' + esc(t.id) + '"' + (isDone ? " checked" : "") + ' aria-label="' + esc(t.text) + '">' +
    '<div class="item-body"><div class="item-text">' + esc(t.text) + "</div>" +
    '<div class="item-meta">' + dueTag(t.due, t) + (url ? '<a class="item-link" href="' + esc(url) + '" target="_blank" rel="noopener">[go]</a>' : "") + trashBtn(t.id) + "</div>" +
    (t.note ? '<div class="item-note">' + esc(t.note) + "</div>" : "") +
    "</div></div>";
}
const EMPTY_MSG = {
  hw: { open: "*~ no homework. suspicious. ~*", other: "nothing here yet" },
  jobs: { open: "*~ pipeline clear ~*", other: "nothing here yet" },
  social: { open: "*~ no plans to decide. free agent. ~*", other: "nothing here yet" },
  misc: { open: "", other: "" }
};
function renderTodo() {
  const doneCount = tasks.filter(t => done[t.id]).length;
  $("todo-prog").textContent = "[" + doneCount + "/" + tasks.length + " done]";
  const vis = tasks.filter(t => filter === "all" || (filter === "open" ? !done[t.id] : !!done[t.id]));
  Object.keys(SECTION_IDS).forEach(sec => {
    const items = vis.filter(t => sectionOf(t) === sec).sort(byDue);
    let html = "";
    groupsFor(sec, items).forEach(([label, list, foldKey]) => {
      if (!list.length) return;
      if (foldKey) {
        const open = !!foldsOpen[foldKey];
        html += '<fieldset class="fold' + (open ? "" : " folded") + '" data-fold="' + esc(foldKey) + '"><legend>' + esc(label) + " (" + list.length + ")" + (open ? "" : foldHint(list)) + "</legend>" + list.map(itemHTML).join("") + "</fieldset>";
      } else {
        html += "<fieldset><legend>" + esc(label) + " (" + list.length + ")</legend>" + list.map(itemHTML).join("") + "</fieldset>";
      }
    });
    if (!html) {
      const m = EMPTY_MSG[sec][filter === "open" ? "open" : "other"];
      html = m ? '<div class="sec-empty">' + esc(m) + "</div>" : "";
    }
    $(SECTION_IDS[sec]).innerHTML = html;
    if (sec === "misc") $("misc-win").style.display = html ? "block" : "none";
  });
}
function onCheck(e) {
  const cb = e.target.closest(".cb"); if (!cb) return;
  const id = cb.dataset.id;
  const wasUrgent = !!cb.closest("#u-list");
  if (cb.checked) {
    done[id] = true;
    const r = cb.getBoundingClientRect();
    celebrate(r.left + r.width / 2, r.top + r.height / 2);
    const t = tasks.find(x => x.id === id);
    toast("✓ " + esc(t ? t.text : "done") + "<br><br>" + (wasUrgent ? "🔥 fire put out · " : "") + "sisyphus: boulder +1 step");
  } else {
    delete done[id];
  }
  store.set(DONE_KEY, done);
  setTimeout(() => { renderTodo(); renderPlant(); renderUrgent(); }, cb.checked ? 350 : 0);
}
Object.values(SECTION_IDS).forEach(id => $(id).addEventListener("change", onCheck));
$(SECTION_IDS.hw).addEventListener("click", e => {
  const lg = e.target.closest("fieldset.fold > legend"); if (!lg) return;
  const fs = lg.parentElement, key = fs.dataset.fold;
  if (foldsOpen[key]) delete foldsOpen[key]; else foldsOpen[key] = true;
  store.set(FOLD_KEY, foldsOpen);
  renderTodo();
});
$("u-list").addEventListener("change", onCheck);
document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("[data-filter]").forEach(x => x.classList.remove("on"));
  b.classList.add("on"); filter = b.dataset.filter; renderTodo();
}));
$("clear-done").addEventListener("click", () => {
  if (!confirm("reset every checkbox? the boulder rolls back down.")) return;
  done = {}; store.set(DONE_KEY, done); renderTodo(); renderPlant(); renderUrgent();
});

/* ---------------- trash: hide a to-do + send the garbage can running ---------------- */
const TRASH_SAYS = ["yoink!", "into the bin!", "nom nom 🗑", "not today!", "bye bye 👋", "trash day!!", "gone. reduced to atoms.", "u didn't need that"];
function rerenderAll() { syncTasks(); renderTodo(); renderPlant(); renderUrgent(); renderTrashBin(); }
function runTrashCan() {
  if (reduceMotion) return;
  const px = (rows, pal) => rows.map((r, y) => Array.from(r).map((c, x) => pal[c] ? '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + pal[c] + '"/>' : "").join("")).join("");
  const pal = { k: "#222", L: "#b8b8c8", M: "#dcdce6", D: "#9a9aae", w: "#fff", p: "#ff8fc2", g: "#c8c8c8" };
  const paper = ["", "", "..wgw...wg......", "..gwwg.wwgw....."];                // peeks out when the lid bounces
  const lid = ["......kkkk......", "......k..k......", ".kkkkkkkkkkkkkk.", ".kLLLLLLLLLLLLk.", ".kkkkkkkkkkkkkk."];
  const body = ["", "", "", "", "",
    "..kMMMMMMMMMMk..", "..kMMMMMMMMMDk..", "..kMMkkMMkkMDk..", "..kMMkwMMkwMDk..", "..kMMMMMMMMMDk..",
    "..kMpMMkkMMpDk..", "..kMMMMMMMMMDk..", "..kMMMMMMMMMDk..", "...kMMMMMMMDk...", "...kkkkkkkkkk..."];
  const pad = Array(15).fill("");
  const legA = pad.concat(["....k.....k.....", "...k.......k....", "..kk.......kk..."]);
  const legB = pad.concat(["......k..k......", "......k..k......", ".....kk..kk....."]);
  const el = document.createElement("div");
  el.className = "tcan"; el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<span class="puff"></span><span class="puff"></span><span class="puff"></span>' +
    '<div class="say">' + esc(TRASH_SAYS[(Math.random() * TRASH_SAYS.length) | 0]) + "</div>" +
    '<div class="lean"><svg viewBox="0 0 16 18" shape-rendering="crispEdges">' +
    px(paper, pal) + '<g class="lid">' + px(lid, pal) + "</g>" + px(body, pal) +
    '<g class="f1">' + px(legA, pal) + '</g><g class="f2">' + px(legB, pal) + "</g></svg></div>";
  document.body.appendChild(el);
  el.addEventListener("animationend", e => { if (e.target === el) el.remove(); });
  setTimeout(() => el.remove(), 5000); // belt and braces
}
function trashTask(id, fromEl) {
  const t = DATA.tasks.find(x => x.id === id); if (!t) return;
  const card = fromEl && fromEl.closest(".item, .u-card, .opp-row, .im-msg, .spam");
  if (card) card.classList.add("trashing");
  trashed[id] = Date.now(); store.set(TRASH_KEY, trashed);
  runTrashCan();
  toast("🗑 trashed: " + esc(t.text) + "<br><br>changed your mind? it's in 🗑 trash up top.");
  setTimeout(rerenderAll, reduceMotion ? 0 : 380);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-trash]"); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  trashTask(b.dataset.trash, b);
});
/* auto-expired items (trashed at the same instant autoExpire stamped them) belong to missed.exe, not this panel */
const isAutoTrashed = id => !!(trashed[id] && autoTrashed[id] && trashed[id] === autoTrashed[id]);
function renderTrashBin() {
  const list = DATA.tasks.filter(t => trashed[t.id] && !isAutoTrashed(t.id)).sort((a, b) => (trashed[b.id] || 0) - (trashed[a.id] || 0));
  $("trash-n").textContent = list.length ? "(" + list.length + ")" : "";
  $("trash-panel").innerHTML = list.length
    ? "<fieldset><legend>trashed (" + list.length + ")</legend>" + list.map(t =>
        '<div class="item"><div class="item-body"><div class="item-text">' + esc(t.text) + "</div>" + (autoTrashed[t.id] ? '<div class="item-meta"><span class="due past">EXPIRED</span></div>' : "") + "</div>" +
        '<button type="button" class="btn" data-restore="' + esc(t.id) + '">♻ restore</button></div>').join("") +
      (list.length > 1 ? '<div class="trash-all"><button type="button" class="btn" data-restore="*">♻ restore all</button></div>' : "") + "</fieldset>"
    : '<div class="sec-empty">*~ trash is empty ~*</div>';
}
$("trash-open").addEventListener("click", () => {
  const p = $("trash-panel"), open = p.style.display === "none";
  p.style.display = open ? "block" : "none";
  $("trash-open").classList.toggle("on", open);
});
$("trash-panel").addEventListener("click", e => {
  const b = e.target.closest("[data-restore]"); if (!b) return;
  const id = b.dataset.restore;
  if (id === "*") Object.keys(trashed).forEach(k => { if (!isAutoTrashed(k)) delete trashed[k]; }); else delete trashed[id];
  store.set(TRASH_KEY, trashed);
  toast("♻ restored" + (id === "*" ? " everything" : "") + ". welcome back.");
  rerenderAll();
});
renderTrashBin();

let toastTimer = null;
function toast(html) {
  $("toast-body").innerHTML = html;
  $("toast").style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("toast").style.display = "none"; }, 2600);
}

/* ---------------- fireworks ---------------- */
const fx = $("fx");
const ctx = fx.getContext ? fx.getContext("2d") : null;
let parts = [], running = false;
function sizeFx() {
  const dpr = window.devicePixelRatio || 1;
  fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", sizeFx); sizeFx();
const GREYS = ["#ffffff", "#f0f0f0", "#d4d4d4", "#b0b0b0", "#8a8a8a", "#5c5c5c", "#2e2e2e"];
function burst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 5;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 55 + Math.random() * 40, max: 95, c: GREYS[(Math.random() * GREYS.length) | 0], sz: Math.random() < .3 ? 4 : 2 });
  }
  if (!running) { running = true; requestAnimationFrame(tick); }
}
function tick() {
  if (!ctx) { parts = []; running = false; return; }
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts.forEach(p => {
    p.vx *= .985; p.vy = p.vy * .985 + .07; p.x += p.vx; p.y += p.vy; p.life--;
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = "#000"; ctx.fillRect(p.x + 1, p.y + 1, p.sz, p.sz);
    ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.sz, p.sz);
  });
  ctx.globalAlpha = 1;
  parts = parts.filter(p => p.life > 0);
  if (parts.length) requestAnimationFrame(tick); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
function celebrate(x, y) {
  if (reduceMotion) { burst(x, y, 30); return; }
  burst(x, y, 70);
  setTimeout(() => burst(innerWidth * (0.2 + Math.random() * 0.25), innerHeight * (0.15 + Math.random() * 0.2), 90), 180);
  setTimeout(() => burst(innerWidth * (0.55 + Math.random() * 0.25), innerHeight * (0.12 + Math.random() * 0.2), 90), 380);
}

/* ---------------- URGENT: due within 24h, as cute little cards ---------------- */
const HOUR = 3600000, WINDOW = 24 * HOUR, GRACE = 24 * HOUR; // Nov 1: overdue items stay 24h, then auto-expire to missed.exe
const DISMISS_KEY = "sf_urgent_dismissed";
let dismissed = store.get(DISMISS_KEY, {});
function dur(ms) {
  const h = Math.floor(ms / HOUR), m = Math.floor((ms % HOUR) / 60000);
  return h > 0 ? h + "h " + m + "m" : m + "m";
}
/* Events vs. deadlines: RSVP / register / decide / apply / reply items stay urgent; plain "go to this" events don't. */
const ACTION_RE = /\b(rsvp|register|registration|decide|apply|application|submit|reply|respond|sign[- ]?up|claim|lottery|deadline|venmo|zelle|pay)\b/i;
const REMINDER_RE = /\b(meet[- ]?and[- ]?greet|meet & greet|reception|happy hour|dinner|lunch|breakfast|party|mixer|hang|social|workshop|talk|panel|prep|session|coffee|game|tennis)\b/i;
/* Oct 19: events left the fire banner. Sign-ups (RSVP / register / decide …, unless it's also an
   apply/submit/homework item) and to-dos that match a calendar event that day now live in events.exe (app-6). */
const SIGNUP_RE = /\b(rsvp|register|registration|sign[- ]?up|decide|pick one|respond to invite|in or out)\b/i;
const REAL_DEADLINE_RE = /\b(apply|application|submit|homework|hw|assignment|due)\b/i;
const isSignup = txt => SIGNUP_RE.test(txt || "") && !REAL_DEADLINE_RE.test(txt || "");
/* strong title match between a to-do and a calendar event (shared with app-6) */
const EV_STOP = new Set("rsvp register registration sign signup decide pick one with from that this your what last summer club panel session form event talk info meeting tonight today tomorrow the and for like optional before after".split(" "));
const evWords = s => (s || "").toLowerCase().replace(/[-']/g, "").replace(/[^a-z0-9@&]+/g, " ").split(" ").filter(w => w.length >= 3 && !EV_STOP.has(w));
function strongMatch(title, text) {
  const tw = [...new Set(evWords(title))]; if (!tw.length) return 0;
  const xw = new Set(evWords(text)); const hit = tw.filter(w => xw.has(w)).length;
  return (hit >= 2 && hit / tw.length >= 0.6) || (tw.length === 1 && hit === 1 && tw[0].length >= 6) ? hit / tw.length : 0;
}
/* a to-do that is really "go to this calendar event" (same day, strong title match) */
function isCalendarEvent(t) {
  if (!t.due || REAL_DEADLINE_RE.test(t.text || "")) return false;
  return (DATA.schedule || []).some(e => (e.start || "").slice(0, 10) === t.due && strongMatch(e.title, t.text));
}
function isEventReminder(t) {
  const txt = t.text || "";
  if (isSignup(txt) || isCalendarEvent(t)) return true;
  if (ACTION_RE.test(txt)) return false;
  return t.kind === "event" || REMINDER_RE.test(txt);
}
/* Nov 1: the bouncing fire banner is homework only. Applications (fellowships / jobs / classes) go to
   opportunities.exe (app-7) as calm, non-moving cards. oppKind() is shared with app-7. */
const OPP_STRONG = /\b(apply|applications? (?:are |is )?(?:due|close[sd]?)|submit|closes)\b/i;
const OPP_WEAK = /\b(intern(?:ship)?s?|fellows?(?:hips?)?|scholarships?|accelerator|incubator|summer associate|job board|applications?|enroll(?:ment)?|pre-?registration|in-residence|2nd round|round 2)\b/i;
const OPP_EVENTY = /\b(info sessions?|panel|fireside|coffee chats?|talk|dinner|mixer|party|kickoff|conference|visit day|overview|office hours|demo day)\b/i;
const OPP_SKIP = /^(attend|registered|rsvp|register:|optional: rsvp)\b/i;
const OPP_COURSE = /\b(course|class(?:es)?|enroll(?:ment)?|pre-?registration|seminar|capped|core|STRAMGT|ENGR|BIOE|EARTHSYS|Biodesign|Lean Launchpad|Startup Garage)\b|\b[A-Z]{3,8} ?\d{3}\b/;
const OPP_COURSE_ACT = /\b(enroll(?:ment)?|registration|pre-?registration|applications?|apply|capped|lottery|bid(?:ding)?)\b/i;
const OPP_FELLOW = /\b(fellows?(?:hips?)?|scholarships?|grants?|grantmaker|accelerator|incubator|YC|Y Combinator|founder application|emergence|impact fund|mba fund)\b/i;
const OPP_JOB = /\b(intern(?:ship)?s?|associate|analyst|PM|PMM|roles?|jobs?|job board|recruit(?:ing)?|program|AVP|hiring|position|consulting)\b/i;
function oppKind(t) {
  const txt = (t && t.text) || "";
  if (!txt || OPP_SKIP.test(txt)) return null;
  const isOpp = OPP_STRONG.test(txt) || (OPP_WEAK.test(txt) && !OPP_EVENTY.test(txt));
  const sec = sectionOf(t);
  if (sec === "hw") return isOpp && OPP_COURSE.test(txt) && OPP_COURSE_ACT.test(txt) ? "classes" : null;
  if (!isOpp) return null;
  if (/\b(courses?|class(?:es)?|STRAMGT|ENGR|BIOE|EARTHSYS)\b|\b[A-Z]{3,8} ?\d{3}\b/.test(txt) && OPP_COURSE_ACT.test(txt)) return "classes";
  if (OPP_FELLOW.test(txt)) return "fellow";
  if (sec === "jobs" || OPP_JOB.test(txt)) return "jobs";
  return "other";
}
const isHomework = t => sectionOf(t) === "hw" && !oppKind(t);
/* match a scan item from DATA.urgent to its to-do (same Gmail thread, same text, or a strong title match) */
const nkText = x => String(x || "").toLowerCase().replace(/\W+/g, " ").trim();
function taskForUrgent(u) {
  const un = nkText(u.text);
  return DATA.tasks.find(t => (u.thread && t.thread === u.thread) || nkText(t.text) === un) ||
    DATA.tasks.find(t => t.due && u.deadline && t.due === String(u.deadline).slice(0, 10) && (strongMatch(u.text, t.text) || strongMatch(t.text, u.text))) || null;
}
function urgentItems() {
  const now = Date.now(), out = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayDiff = d => Math.round((new Date(d + "T00:00:00") - today) / 86400000);
  tasks.forEach(t => {
    const dl = deadlineOf(t);
    if (!dl || done[t.id]) return;
    if (isEventReminder(t)) return; // plain events live in the today strip, not the fire banner
    if (!isHomework(t)) return;      // Nov 1: only homework bounces; everything else is in opportunities.exe
    const ms = dl - now;
    // Timed deadlines use an exact 24h window. Date-only ones count as urgent once they're due today or tomorrow.
    const soon = t.dueTime ? ms <= WINDOW : dayDiff(t.due) <= 1;
    if (soon && ms >= -GRACE) {
      const label = !t.dueTime && ms >= 0 ? (dayDiff(t.due) === 0 ? "DUE TODAY" : "DUE TOMORROW") : null;
      out.push({ kind: "task", id: t.id, text: t.text, ms, link: t.link, label });
    }
  });
  (DATA.urgent || []).forEach(u => {
    const dl = new Date(u.deadline);
    if (!u.id || isNaN(dl) || dismissed[u.id] || isSignup(u.text)) return;
    // If the matching to-do was checked off or trashed, don't resurrect it as a fire card.
    const nk = x => String(x || "").toLowerCase().replace(/\W+/g, " ").trim();
    const un = nk(u.text);
    if (DATA.tasks.some(t => (done[t.id] || trashed[t.id]) && nk(t.text) === un)) return;
    const mt = taskForUrgent(u);
    if (mt ? !isHomework(mt) : !isHomework({ text: u.text })) return; // non-homework scan items → opportunities.exe
    if (mt && (done[mt.id] || trashed[mt.id])) return;
    if (mt && mt.due && !isEventReminder(mt)) return; // its to-do already makes its own card (with a real checkbox)
    const ms = dl - now;
    if (ms <= WINDOW && ms >= -GRACE) out.push({ kind: "scan", id: u.id, text: u.text, ms, link: u.link, source: u.source });
  });
  return out.sort((a, b) => a.ms - b.ms);
}
function flameSVG() {
  // tiny two-frame pixel flame, like an animated GIF
  const px = (rows, pal) => rows.map((r, y) => Array.from(r).map((c, x) => pal[c] ? '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + pal[c] + '"/>' : "").join("")).join("");
  const pal = { r: "#cc1100", o: "#ff7700", y: "#ffdd00", w: "#ffffaa", k: "#330000" };
  const f1 = ["...r....", "...rr...", "..roor..", "..rooor.", ".rooyor.", ".royyyor", "rooywyor", "roykyykr", "royyyyor", ".roooor."];
  const f2 = ["....r...", "...rr...", "..rrorr.", ".roooor.", ".royoor.", "royyyoor", "roywyyor", "roykyykr", "royyyyor", ".roooor."];
  return '<svg class="u-flame" viewBox="0 0 8 10" aria-hidden="true"><g class="f1">' + px(f1, pal) + '</g><g class="f2">' + px(f2, pal) + "</g></svg>";
}
function renderUrgent() {
  const list = urgentItems();
  const box = $("urgent");
  if (!list.length) { box.style.display = "none"; return; }
  box.style.display = "block";
  $("u-list").innerHTML = list.map(u => {
    const url = safeUrl(u.link), over = u.ms < 0;
    const count = over ? "<b>OVERDUE</b> " + dur(-u.ms) : (u.label || dur(u.ms) + " LEFT");
    const ctl = u.kind === "task"
      ? '<label><input type="checkbox" class="cb" data-id="' + esc(u.id) + '" aria-label="mark done: ' + esc(u.text) + '"> done!</label>' + trashBtn(u.id, "trash")
      : '<button class="u-out" data-uid="' + esc(u.id) + '">put it out</button>';
    return '<div class="u-card' + (over ? " over" : "") + '">' +
      '<div class="u-top">' + flameSVG() + "URGENT!!" + '<span class="hot">HOT</span></div>' +
      '<div class="u-inner">' +
      '<div class="u-text">' + esc(u.text) + "</div>" +
      (u.source ? '<div class="u-src">' + esc(u.source) + "</div>" : "") +
      '<span class="u-count">' + count + "</span>" +
      '<div class="u-actions">' + ctl + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">go &gt;&gt;</a>' : "") + "</div>" +
      "</div></div>";
  }).join("");
  updateArrows();
}
function updateArrows() {
  const tr = $("u-list");
  const overflow = tr.scrollWidth > tr.clientWidth + 2;
  $("u-prev").classList.toggle("hide", !overflow);
  $("u-next").classList.toggle("hide", !overflow);
  $("u-prev").disabled = tr.scrollLeft <= 2;
  $("u-next").disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 2;
}
$("u-prev").addEventListener("click", () => { $("u-list").scrollBy({ left: -186, behavior: "smooth" }); });
$("u-next").addEventListener("click", () => { $("u-list").scrollBy({ left: 186, behavior: "smooth" }); });
$("u-list").addEventListener("scroll", updateArrows);
addEventListener("resize", updateArrows);
$("u-list").addEventListener("click", e => {
  const b = e.target.closest("[data-uid]"); if (!b) return;
  dismissed[b.dataset.uid] = true; store.set(DISMISS_KEY, dismissed);
  const r = b.getBoundingClientRect(); celebrate(r.left + r.width / 2, r.top + r.height / 2);
  toast("🔥 fire put out. phew."); renderUrgent();
});
setInterval(() => { if (autoExpire()) rerenderAll(); else renderUrgent(); }, 30000);
if (autoCleared) setTimeout(() => toast("🗑 auto-cleared " + autoCleared + " expired item" + (autoCleared > 1 ? "s" : "") + "<br><br>past events + deadlines 24h+ overdue. they're in 🪦 missed.exe (left side) if you want one back."), 1200);

/* ---------------- sparkle cursor trail ---------------- */
if (!reduceMotion) {
  let last = 0;
  addEventListener("mousemove", e => {
    const now = Date.now(); if (now - last < 45) return; last = now;
    const s = document.createElement("span");
    s.className = "sparkle"; s.textContent = Math.random() < .5 ? "✦" : "·";
    s.style.left = e.clientX + 6 + "px"; s.style.top = e.clientY + 6 + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });
}

/* ---------------- today + footer ---------------- */
(function today() {
  const t = DATA.today || { items: [] };
  let html = "&gt; " + esc(t.headline || "") + "<br><br>";
  (t.items || []).forEach(it => {
    const url = safeUrl(it.url);
    html += '<div class="row"><span class="when">' + esc(it.when) + "</span><span>" +
      (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(it.what) + "</a>" : esc(it.what)) + "</span></div>";
  });
  html += '<br><a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noopener">[open full calendar]</a> ' +
    '<a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener">[open inbox]</a>';
  $("today").innerHTML = html;
  $("updated").textContent = DATA.generatedAt;
  const hits = (store.get("sf_hits", 246) | 0) + 1;
  store.set("sf_hits", hits);
  $("counter").textContent = String(hits).padStart(6, "0");
})();

/* ---------------- schedule: next class / next event bar ---------------- */
function schedule() {
  return (DATA.schedule || []).map(e => Object.assign({}, e, { s: new Date(e.start), e: new Date(e.end || e.start) }))
    .filter(e => !isNaN(e.s)).sort((a, b) => a.s - b.s);
}
function clock(d) { return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase().replace(/\s/g, ""); }
function dayWord(d) {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const d0 = new Date(d); d0.setHours(0, 0, 0, 0);
  const n = Math.round((d0 - t0) / 86400000);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return d.toLocaleDateString([], { weekday: "short" }).toLowerCase() + " " + (d.getMonth() + 1) + "/" + d.getDate();
}
function whenStr(e) { return e.allDay ? dayWord(e.s) : dayWord(e.s) + " " + clock(e.s); }
function renderNext() {
  const S = schedule(), now = new Date();
  let parts = [];
  if (!S.length) parts = ["schedule not loaded yet"];
  else {
    const timed = S.filter(e => !e.allDay);
    const clsNow = timed.find(e => e.kind === "class" && e.s <= now && e.e > now);
    const clsNext = timed.find(e => e.kind === "class" && e.s > now);
    const evs = timed.filter(e => e.kind !== "class" && e.s > now);
    const evNow = timed.find(e => e.kind !== "class" && e.s <= now && e.e > now);
    const tag = e => (e.status === "maybe" ? " (still deciding)" : "");
    if (clsNow) parts.push("in class now: " + clsNow.title + " til " + clock(clsNow.e));
    parts.push(clsNext ? "next class: " + clsNext.title + " · " + whenStr(clsNext) + (clsNext.where ? " · " + clsNext.where : "") : "no more classes on the calendar");
    if (evNow) parts.push("happening now: " + evNow.title + tag(evNow));
    if (evs[0]) parts.push("next event: " + evs[0].title + " · " + whenStr(evs[0]) + (evs[0].where ? " · " + evs[0].where : "") + tag(evs[0]));
    if (evs[1]) parts.push("after that: " + evs[1].title + " · " + whenStr(evs[1]) + tag(evs[1]));
  }
  const txt = "~*~ " + parts.join(" ~*~ ") + " ~*~";
  if ($("nextbar").textContent !== txt) $("nextbar").textContent = txt;
}

/* ---------------- today strip: events from the calendar + event-type tasks, today and tomorrow ---------------- */
function renderStrip() {
  const box = $("today-strip"); if (!box) return;
  const now = new Date(), end = new Date(); end.setDate(end.getDate() + 2); end.setHours(0, 0, 0, 0);
  const items = [];
  schedule().forEach(e => {
    if (e.allDay || e.e <= now || e.s >= end) return;
    items.push({ s: e.s, label: e.title, where: e.where, url: e.url, cls: e.kind === "class" ? "cls" : (e.status === "maybe" ? "maybe" : ""), now: e.s <= now });
  });
  const seen = items.map(i => i.label.toLowerCase());
  tasks.forEach(t => {
    if (done[t.id] || !isEventReminder(t)) return;
    const dl = deadlineOf(t); if (!dl || dl < now || dl >= end) return;
    const key = (t.text || "").toLowerCase();
    if (seen.some(s => s && (key.includes(s.slice(0, 12)) || s.includes(key.slice(0, 12))))) return;
    items.push({ s: dl, label: t.text, url: t.link, cls: "", now: false, untimed: !t.dueTime });
  });
  items.sort((a, b) => a.s - b.s);
  if (!items.length) { box.style.display = "none"; return; }
  box.style.display = "flex";
  const short = s => s.length > 34 ? s.slice(0, 33) + "…" : s;
  box.innerHTML = '<span class="ts-lab">TODAY</span>' + items.slice(0, 10).map(i => {
    const d = dayWord(i.s), when = i.untimed ? (d === "today" ? "" : d + " ") : (d === "today" ? "" : d + " ") + clock(i.s) + " ";
    const url = safeUrl(i.url);
    const inner = '<span class="ts-t">' + esc(i.now ? "now" : when.trim()) + "</span> " + esc(short(i.label));
    return (url ? '<a class="ts-chip ' + i.cls + '" href="' + esc(url) + '" target="_blank" rel="noopener">' : '<span class="ts-chip ' + i.cls + '">') + inner + (url ? "</a>" : "</span>");
  }).join("");
}

/* ---------------- social_life.exe: this week's social life, animated ---------------- */
function dudeSVG(maybe, i) {
  const arms = ["M1 6 L5.5 8 L10 5", "M1 4 L5.5 8 L10 4", "M1 9 L5.5 8 L10 3", "M1 3 L5.5 8 L10 9"][i % 4];
  const dash = maybe ? ' stroke-dasharray="1.6 1.2"' : "";
  return '<svg class="' + "dude" + (maybe ? " maybe" : "") + '" viewBox="0 0 11 20" style="animation-delay:-' + ((i * 0.17) % 0.55).toFixed(2) + 's">' +
    '<circle cx="5.5" cy="3" r="2.3" fill="' + (maybe ? "#fff" : "#1e1e1e") + '" stroke="#1e1e1e" stroke-width="1"' + dash + "/>" +
    '<path d="M5.5 5.5 L5.5 12.5 M' + arms.slice(1) + ' M5.5 12.5 L2.5 19 M5.5 12.5 L8.5 19" stroke="#1e1e1e" stroke-width="1.5" fill="none" stroke-linecap="round"' + dash + "/></svg>";
}
function discoSVG() {
  let tiles = "";
  for (let y = -12; y <= 12; y += 4) for (let x = -12; x <= 12; x += 4) {
    if (x * x + y * y > 150) continue;
    const g = ((x + y + 24) / 4) % 3;
    tiles += '<rect x="' + (30 + x - 1.8) + '" y="' + (22 + y - 1.8) + '" width="3.4" height="3.4" fill="' + ["#f2f2f2", "#9a9a9a", "#5a5a5a"][g] + '"/>';
  }
  return '<svg class="soc-disco" width="60" height="42" viewBox="0 0 60 42" aria-hidden="true">' +
    '<line x1="30" y1="0" x2="30" y2="9" stroke="#1e1e1e" stroke-width="1"/>' +
    '<g class="ball"><line x1="30" y1="0" x2="30" y2="9" stroke="transparent"/><circle cx="30" cy="22" r="13" fill="#bdbdbd" stroke="#1e1e1e" stroke-width="1.4"/>' + tiles +
    '<text class="glint" x="38" y="15" font-size="8" fill="#fff" stroke="#000" stroke-width=".4">✦</text>' +
    '<text class="glint g2" x="18" y="30" font-size="7" fill="#fff" stroke="#000" stroke-width=".4">✦</text></g></svg>';
}
function renderSocial() {
  const S = schedule().filter(e => e.social);
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(t0); d.setDate(t0.getDate() + i);
    const d1 = new Date(d); d1.setDate(d.getDate() + 1);
    days.push({ d, evs: S.filter(e => e.s >= d && e.s < d1) });
  }
  const yes = days.reduce((n, x) => n + x.evs.filter(e => e.status !== "maybe").length, 0);
  const maybe = days.reduce((n, x) => n + x.evs.filter(e => e.status === "maybe").length, 0);
  const score = yes + maybe * 0.5;
  const status = score === 0 ? "HERMIT MODE" : score < 3 ? "COZY WEEK" : score < 6 ? "HEALTHY BALANCE" : score < 9 ? "SOCIAL BUTTERFLY" : "BOOKED & BUSY (drink water)";
  const battery = Math.max(0, Math.min(100, Math.round(100 - yes * 10 - maybe * 4)));
  let k = 0, html = discoSVG();
  days.forEach((x, i) => {
    const lbl = x.d.toLocaleDateString([], { weekday: "short" }).toUpperCase().slice(0, 3);
    const tip = x.evs.length ? x.evs.map(e => (e.allDay ? "" : clock(e.s) + " ") + e.title + (e.status === "maybe" ? " (?)" : "")).join("\n") : "nothing planned";
    const crowd = x.evs.length
      ? x.evs.map(e => { const m = e.status === "maybe"; return dudeSVG(m, k++) + dudeSVG(m, k++); }).join("")
      : '<span class="zzz">z</span><span class="zzz">z</span><span class="zzz">z</span>';
    html += '<div class="soc-day' + (i === 0 ? " today" : "") + '" title="' + esc(tip) + '"><span class="soc-lbl">' + lbl + '</span><div class="soc-crowd">' + crowd + "</div></div>";
  });
  html += '<div class="soc-status">' + esc(status) + "</div>" +
    '<div class="inset hpbar" title="social battery"><div class="hpfill" style="width:' + battery + '%"></div></div>' +
    '<div class="soc-legend">social battery ' + battery + "% · " + yes + " going · " + maybe + " maybe</div>";
  $("soc-art").innerHTML = html;

  // this-week agenda for the social column
  const week = days.flatMap(x => x.evs);
  $("soc-week").innerHTML = week.length
    ? "<fieldset><legend>this week (" + week.length + ")</legend><div class=\"agenda\">" + week.map(e =>
        '<div class="arow"><span class="awhen">' + esc(whenStr(e)) + "</span><span>" +
        (safeUrl(e.url) ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.title) + "</a>" : esc(e.title)) +
        (e.where ? " · " + esc(e.where) : "") + (e.status === "maybe" ? '<span class="maybe-tag">MAYBE</span>' : "") + "</span></div>").join("") + "</div></fieldset>"
    : "";
}

renderNext(); setInterval(renderNext, 60000);
renderStrip(); setInterval(renderStrip, 60000);
renderSocial();
renderCats(); renderSlide(); startAuto();
renderTodo(); renderPlant(); renderUrgent();
