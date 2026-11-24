/* events.exe (added Oct 19, 2026): every calendar event for today + the next 3 days, nothing hidden.
   Events that start at the same time stack under one time ("3 options").
   Sign-ups (RSVP / register / decide…) left the fire banner; they show here as a 📝 note on the matching
   event, or as their own row at the sign-up deadline when no event matches.
   Uses app-2 globals: DATA, tasks, done, trashed, dismissed, store, esc, safeUrl, deadlineOf, SIGNUP_RE, schedule, clock. */
(function () {
  const box = document.getElementById("events-feed");
  if (!box) return;
  const FILTER_KEY = "sf_feed_filter";
  const DAYS = 4;
  const CATS = [["all", "all"], ["club", "club"], ["career", "career"], ["social", "social"], ["acad", "academic"], ["class", "class"], ["me", "1:1"]];
  let filter = store.get(FILTER_KEY, "all");
  if (!CATS.some(c => c[0] === filter)) filter = "all";

  const ACAD_RE = /\b(ABLS|office hours|OH|TA review|CA review|review session|academic|advising|tutorial|study group|exam)\b/i;
  const CAREER_RE = /\b(info session|career|recruit\w*|coffee chat|networking|internship|interview|employer|trek|12twenty|consult\w*|banking|search fund|search)\b/i;
  const ONE_RE = / \/ |\b(1:1|call|walk|catch[- ]?up|mentorship)\b/i;
  function catOf(text, e) {
    if (e && ["club", "career", "social", "acad", "class", "me"].includes(e.cat)) return e.cat;
    if (e && e.kind === "class") return "class";
    if (e && e.social) return "social";
    if (ACAD_RE.test(text)) return "acad";
    if (CAREER_RE.test(text)) return "career";
    if (ONE_RE.test(text)) return "me";
    return "club";
  }
  const LABEL = { club: "club", career: "career", social: "social", acad: "academic", class: "class", me: "1:1" };

  /* sign-ups: open tasks + scanned urgent items that are RSVP / register / decide … (isSignup, app-2) */
  function signups(now) {
    const out = [];
    tasks.forEach(t => {
      if (done[t.id] || trashed[t.id] || !isSignup(t.text)) return;
      const dl = deadlineOf(t); if (!dl || dl < now) return;
      out.push({ text: t.text, by: dl, untimed: !t.dueTime, link: t.link });
    });
    (DATA.urgent || []).forEach(u => {
      if (!u.id || dismissed[u.id] || !isSignup(u.text)) return;
      const dl = new Date(u.deadline); if (isNaN(dl) || dl < now) return;
      out.push({ text: u.text, by: dl, link: u.link });
    });
    return out;
  }
  const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  function mentionedDays(text) { // "Oct 20", "10/20" → list of {m, d}
    const out = []; let m;
    const r1 = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/gi, r2 = /\b(1[0-2]|0?[1-9])\/(\d{1,2})\b/g;
    while ((m = r1.exec(text))) out.push({ m: MON[m[1].toLowerCase().slice(0, 3)], d: +m[2] });
    while ((m = r2.exec(text))) out.push({ m: +m[1] - 1, d: +m[2] });
    return out;
  }
  function fits(it, s) { // event date is plausible for this sign-up
    const days = mentionedDays(s.text);
    if (days.length) return days.some(x => it.s.getMonth() === x.m && it.s.getDate() === x.d);
    const lo = new Date(s.by); lo.setHours(0, 0, 0, 0);
    return it.s >= lo && it.s - lo < 3 * 86400000;
  }
  const verb = t => { const m = t.match(SIGNUP_RE); const v = m ? m[1].toLowerCase() : "sign up"; return v === "in or out" || v === "respond to invite" ? "reply" : v === "registration" ? "register" : v; };
  const byStr = s => s.untimed ? "by " + dayShort(s.by) : "by " + clock(s.by) + (sameDay(s.by, new Date()) ? "" : " " + dayShort(s.by));

  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const dayShort = d => d.toLocaleDateString([], { weekday: "short" }).toLowerCase();
  function dayHead(d, now) {
    const t0 = new Date(now); t0.setHours(0, 0, 0, 0);
    const n = Math.round((new Date(d).setHours(0, 0, 0, 0) - t0) / 86400000);
    const md = (d.getMonth() + 1) + "/" + d.getDate(), wd = d.toLocaleDateString([], { weekday: "short" });
    if (n === 0) return (now.getHours() >= 17 ? "Tonight" : "Today") + " · " + wd + " " + md;
    if (n === 1) return "Tomorrow · " + wd + " " + md;
    return wd + " " + md;
  }
  const mins = ms => { const m = Math.round(ms / 60000); return m < 60 ? m + " min" : Math.floor(m / 60) + "h " + (m % 60) + "m"; };

  function build() {
    const now = new Date();
    const end = new Date(now); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() + DAYS);
    const items = [];
    schedule().forEach(e => {
      if (e.s >= end) return;
      if (e.allDay ? new Date(e.s).setHours(23, 59, 59, 999) < now : e.e <= now) return;
      const opt = /\(optional\)/i.test(e.title);
      items.push({ s: e.s, e: e.e, allDay: !!e.allDay, title: e.title.replace(/\s*\(optional\)/i, ""), where: e.where, url: e.url,
        cat: catOf(e.title + " " + (e.where || ""), e), opt, maybe: e.status === "maybe", live: !e.allDay && e.s <= now && e.e > now, notes: [] });
    });
    const events = items.slice(), rows = [];
    signups(now).forEach(s => {
      let best = null, bestScore = 0;
      events.forEach(it => { const sc = strongMatch(it.title, s.text); if (sc > bestScore && fits(it, s)) { best = it; bestScore = sc; } });
      const addNote = it => { const k = verb(s.text) + byStr(s); if (!it.notes.some(n => verb(n.text) + byStr(n) === k)) it.notes.push(s); };
      if (best) { addNote(best); return; }
      if (s.by >= end) return;
      const dup = rows.find(r => strongMatch(r.title, s.text) || strongMatch(s.text, r.title));
      if (dup) { addNote(dup); return; }
      const row = { s: s.by, e: s.by, signupOnly: true, title: s.text, url: s.link, cat: catOf(s.text), notes: [s], live: false };
      rows.push(row); items.push(row);
    });
    return items.sort((a, b) => (b.allDay - a.allDay) || (a.s - b.s) || a.title.localeCompare(b.title));
  }

  function evHTML(it) {
    const url = safeUrl(it.url);
    const name = url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(it.title) + "</a>" : esc(it.title);
    const bits = [];
    if (it.where) bits.push(esc(it.where));
    if (!it.allDay && !it.signupOnly && it.e > it.s) bits.push("til " + clock(it.e));
    if (it.maybe) bits.push('<span class="ef-maybe">maybe</span>');
    it.notes.forEach(n => {
      const l = safeUrl(n.link), txt = "📝 " + verb(n.text) + " " + byStr(n);
      bits.push(l ? '<a class="ef-note" href="' + esc(l) + '" target="_blank" rel="noopener">' + esc(txt) + "</a>" : '<span class="ef-note">' + esc(txt) + "</span>");
    });
    return '<div class="ef-ev' + (it.opt ? " opt" : "") + '" data-cat="' + it.cat + '"><div><div class="ef-n">' + name + "</div>" +
      (bits.length ? '<div class="ef-w">' + bits.join(" · ") + "</div>" : "") + "</div>" +
      '<span class="ef-c ' + it.cat + '">' + (it.signupOnly ? "sign-up" : it.opt ? "optional" : LABEL[it.cat]) + "</span></div>";
  }

  function render() {
    const now = new Date(), all = build();
    const show = all.filter(it => filter === "all" || it.cat === filter);
    const real = all.filter(it => !it.signupOnly);
    /* now / next */
    const live = real.filter(it => it.live);
    const nextT = real.filter(it => !it.allDay && it.s > now).map(it => +it.s).sort((a, b) => a - b)[0];
    const nextList = nextT ? real.filter(it => +it.s === nextT) : [];
    const names = l => l.slice(0, 3).map(it => esc(it.title)).join(" / ") + (l.length > 3 ? " +" + (l.length - 3) : "");
    let nowHTML = "";
    if (live.length) nowHTML += '<div>▶ NOW <b>' + names(live) + "</b></div>";
    if (nextList.length) nowHTML += "<div>▶ NEXT " + clock(new Date(nextT)) + " (" + mins(nextT - now) + ") · " + names(nextList) + "</div>";
    if (!nowHTML) nowHTML = "<div>▶ nothing else on the calendar. go touch grass</div>";

    /* days → time slots */
    let list = "";
    const t0 = new Date(now); t0.setHours(0, 0, 0, 0);
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(t0); d.setDate(d.getDate() + i);
      const dayItems = show.filter(it => sameDay(it.s, d));
      const nReal = dayItems.filter(it => !it.signupOnly).length;
      list += '<div class="ef-day">' + esc(dayHead(d, now)) + "<small>" + nReal + " event" + (nReal === 1 ? "" : "s") + "</small></div>";
      if (!dayItems.length) { list += '<div class="ef-empty">nothing ' + (filter === "all" ? "" : "here ") + "~ free day?</div>"; continue; }
      const slots = new Map();
      dayItems.forEach(it => { const k = it.allDay ? "allday" : String(+it.s); if (!slots.has(k)) slots.set(k, []); slots.get(k).push(it); });
      slots.forEach((g, k) => {
        const live = g.some(it => it.live), n = g.length;
        const t = k === "allday" ? "all day" : clock(g[0].s);
        list += '<div class="ef-slot' + (live ? " live" : "") + '"><div class="ef-t">' + t + (live ? "<em>● LIVE</em>" : "") +
          (n > 1 ? '<span class="ef-cnt">' + n + " options</span>" : "") + '</div><div class="ef-opts">' + g.map(evHTML).join("") + "</div></div>";
      });
    }
    const total = real.filter(it => filter === "all" || it.cat === filter).length;
    const sc = box.querySelector(".ef-scroll"), keep = sc ? sc.scrollTop : 0;
    box.innerHTML =
      '<div class="titlebar"><span>■ events.exe</span><span class="btns"><span>_</span><span>x</span></span></div>' +
      '<div class="ef-now">' + nowHTML + "</div>" +
      '<div class="ef-filters" role="group" aria-label="filter events">' + CATS.map(c =>
        '<button type="button" class="ef-f' + (c[0] === "all" ? "" : " ef-c " + c[0]) + (c[0] === filter ? " on" : "") + '" data-ef="' + c[0] + '" aria-pressed="' + (c[0] === filter) + '">' + c[1] + "</button>").join("") + "</div>" +
      '<div class="ef-scroll">' + list + "</div>" +
      '<div class="ef-foot"><span>' + total + " events · next " + DAYS + ' days · nothing hidden</span><a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noopener">calendar ↗</a></div>';
    const sc2 = box.querySelector(".ef-scroll"); if (sc2) sc2.scrollTop = keep;
  }

  box.addEventListener("click", e => {
    const b = e.target.closest("[data-ef]"); if (!b) return;
    filter = b.dataset.ef; store.set(FILTER_KEY, filter);
    render(); const sc = box.querySelector(".ef-scroll"); if (sc) sc.scrollTop = 0;
  });
  render();
  setInterval(render, 60000);
  window.renderEventsFeed = render;
})();
