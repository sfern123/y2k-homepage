/* app-7 (Nov 1, 2026): opportunities.exe + missed.exe
   - opportunities.exe: calm (non-bouncing) deadline board split into fellowships / jobs + internships / classes
     (+ "other deadlines" only when something's there). The bouncing fire banner is homework only (app-2 urgentItems).
   - missed.exe: deadlines that auto-expired (24h+ overdue) and past events, opened from the 🪦 icon on the
     left dock or the "🪦 missed" button in the to-do toolbar. Manual 🗑 trash stays in its own panel.
   Uses app-2 globals by name: DATA, tasks, done, trashed, autoTrashed, dismissed, store, $, esc, safeUrl,
   oppKind, isHomework, isEventReminder, taskForUrgent, deadlineOf, kindOf, dur, trashBtn, onCheck,
   rerenderAll, celebrate, toast, DONE_KEY, TRASH_KEY, DISMISS_KEY, isAutoTrashed. */
(function () {
  const H = 3600000, DAY = 24 * H;
  const RECENT = 14 * DAY; // the badge + top list = deadlines missed in the last 2 weeks
  const OPP_AHEAD = 14 * DAY, OTHER_AHEAD = 48 * H, LATE = 24 * H;
  const COLS = [
    { key: "fellow",  title: "fellowships",          ico: "★" },
    { key: "jobs",    title: "jobs + internships",   ico: "💼" },
    { key: "classes", title: "classes",              ico: "✎" },
    { key: "other",   title: "other deadlines",      ico: "•", hideEmpty: true }
  ];
  const fmtDate = d => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = d => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase().replace(/\s/g, "");

  function oppItems() {
    const now = Date.now(), cols = { fellow: [], jobs: [], classes: [], other: [] }, later = { fellow: 0, jobs: 0, classes: 0, other: 0 };
    tasks.forEach(t => {
      if (done[t.id]) return;
      const dl = deadlineOf(t); if (!dl) return;
      const ms = dl - now; if (ms < -LATE) return;
      let k = oppKind(t);
      if (!k) {
        // "other deadlines": real (non-event, non-homework) deadlines in the next 48h that used to bounce
        if (isHomework(t) || isEventReminder(t) || ms > OTHER_AHEAD) return;
        if (!DEADLINE_RE.test(t.text || "") || EVENT_RE.test(t.text || "")) return; // real to-dos only, not events
        k = "other";
      }
      if (ms > OPP_AHEAD) { later[k]++; return; }
      cols[k].push({ kind: "task", id: t.id, text: t.text, ms, dl, link: t.link, timed: !!t.dueTime });
    });
    (DATA.urgent || []).forEach(u => {
      const dl = new Date(u.deadline);
      if (!u.id || isNaN(dl) || dismissed[u.id]) return;
      if (taskForUrgent(u)) return;            // its to-do is already on the board (or done / trashed)
      if (isHomework({ text: u.text })) return; // homework scan items bounce in the fire banner
      const ms = dl - now; if (ms < -LATE || ms > OPP_AHEAD) return;
      const k = oppKind({ text: u.text }) || "other";
      cols[k].push({ kind: "scan", id: u.id, text: u.text, ms, dl, link: u.link, timed: true });
    });
    Object.keys(cols).forEach(k => {
      cols[k].sort((a, b) => a.ms - b.ms);
      // same deadline captured twice (e.g. two emails about one application) → show it once
      cols[k] = cols[k].filter((it, i, l) => !l.slice(0, i).some(p => p.dl.toDateString() === it.dl.toDateString() &&
        (strongMatch(p.text, it.text) || strongMatch(it.text, p.text))));
    });
    return { cols, later };
  }

  function rowHTML(it) {
    const url = safeUrl(it.link), over = it.ms < 0, hot = !over && it.ms <= DAY;
    const left = over ? "overdue " + dur(-it.ms) : it.ms < 2 * DAY ? dur(it.ms) + " left" : Math.ceil(it.ms / DAY) + " days";
    const when = fmtDate(it.dl) + (it.timed ? " · " + fmtTime(it.dl) : "");
    const ctl = it.kind === "task"
      ? '<input type="checkbox" class="cb" data-id="' + esc(it.id) + '" aria-label="mark done: ' + esc(it.text) + '">'
      : '<button type="button" class="opp-out" data-ouid="' + esc(it.id) + '" title="put it out (done / not doing)" aria-label="dismiss: ' + esc(it.text) + '">✓</button>';
    return '<div class="opp-row' + (hot ? " hot" : "") + (over ? " over" : "") + '">' + ctl +
      '<div class="opp-body"><div class="opp-text">' + esc(it.text) + "</div>" +
      '<div class="opp-meta"><span class="opp-left">' + esc(left) + '</span><span class="opp-when">' + esc(when) + "</span>" +
      (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">go &gt;&gt;</a>' : "") + "</div></div>" +
      (it.kind === "task" ? trashBtn(it.id) : "") + "</div>";
  }

  function renderOpps() {
    const box = $("opp-board"); if (!box) return;
    const { cols, later } = oppItems();
    let total = 0;
    box.innerHTML = COLS.filter(c => !(c.hideEmpty && !cols[c.key].length && !later[c.key])).map(c => {
      const l = cols[c.key]; total += l.length;
      const hot = l.filter(x => x.ms <= DAY).length;
      return '<section class="opp-col opp-' + c.key + '" aria-label="' + esc(c.title) + '">' +
        '<div class="opp-head"><span>' + c.ico + " " + esc(c.title) + '</span><span class="opp-n">' + l.length +
        (hot ? ' · <b>' + hot + " today</b>" : "") + "</span></div>" +
        '<div class="opp-list">' + (l.length ? l.map(rowHTML).join("") : '<div class="opp-empty">*~ nothing due in the next 2 weeks ~*</div>') + "</div>" +
        (later[c.key] ? '<a class="opp-later" href="#sec-jobs">+' + later[c.key] + " more after 2 weeks</a>" : "") +
        "</section>";
    }).join("");
    const n = $("opp-count"); if (n) n.textContent = total ? "(" + total + " in the next 2 weeks)" : "";
  }

  /* ---------------- missed.exe ---------------- */
  function missedLists() {
    const all = DATA.tasks.filter(t => isAutoTrashed(t.id) && !done[t.id]);
    const by = (a, b) => (deadlineOf(b) || 0) - (deadlineOf(a) || 0);
    const cut = Date.now() - RECENT;
    const dl = all.filter(t => kindOf(t) === "deadline").sort(by);
    return { recent: dl.filter(t => deadlineOf(t) >= cut), older: dl.filter(t => deadlineOf(t) < cut), ev: all.filter(t => kindOf(t) !== "deadline").sort(by) };
  }
  function missedRow(t) {
    const d = deadlineOf(t), url = safeUrl(t.link);
    return '<div class="item miss-row"><div class="item-body"><div class="item-text">' + esc(t.text) + "</div>" +
      '<div class="item-meta"><span class="due past">' + (d ? "WAS DUE " + esc(fmtDate(d).toUpperCase()) + (t.dueTime ? " " + esc(fmtTime(d)) : "") : "EXPIRED") + "</span>" +
      (url ? '<a class="item-link" href="' + esc(url) + '" target="_blank" rel="noopener">[go]</a>' : "") + "</div></div>" +
      '<span class="miss-btns"><button type="button" class="btn" data-didit="' + esc(t.id) + '" title="I did it after all">✓ did it</button>' +
      '<button type="button" class="btn" data-unmiss="' + esc(t.id) + '" title="put it back on my lists">♻ bring back</button></span></div>';
  }
  function renderMissed() {
    const { recent, older, ev } = missedLists();
    document.querySelectorAll(".miss-n").forEach(el => { el.textContent = recent.length ? String(recent.length) : ""; el.hidden = !recent.length; });
    const body = $("missed-body"); if (!body) return;
    body.innerHTML =
      '<p class="miss-intro">deadlines clear off the page 24h after they pass, and events ~2h after they start. they wait here in case you want one back.</p>' +
      "<fieldset><legend>missed in the last 2 weeks (" + recent.length + ")</legend>" + (recent.length ? recent.map(missedRow).join("") : '<div class="sec-empty">*~ nothing missed lately. iconic. ~*</div>') + "</fieldset>" +
      (older.length ? '<details class="miss-ev"><summary>older missed deadlines (' + older.length + ")</summary>" + older.map(missedRow).join("") + "</details>" : "") +
      (ev.length ? '<details class="miss-ev"><summary>past events (' + ev.length + ")</summary>" + ev.map(missedRow).join("") + "</details>" : "");
  }
  function openMissed(open) {
    const w = $("missed-win"); if (!w) return;
    w.hidden = !open;
    if (open) { renderMissed(); const c = $("missed-close"); if (c) c.focus(); }
  }

  /* ---------------- wiring ---------------- */
  const board = $("opp-board");
  if (board) {
    board.addEventListener("change", onCheck); // same handler as the lists: saves done, fireworks, boulder
    board.addEventListener("click", e => {
      const b = e.target.closest("[data-ouid]"); if (!b) return;
      dismissed[b.dataset.ouid] = true; store.set(DISMISS_KEY, dismissed);
      const r = b.getBoundingClientRect(); celebrate(r.left + r.width / 2, r.top + r.height / 2);
      toast("✓ off the board."); renderOpps();
    });
  }
  document.querySelectorAll("[data-missed-open]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); openMissed(true); }));
  const mw = $("missed-win");
  if (mw) {
    mw.addEventListener("click", e => {
      if (e.target === mw || e.target.closest("#missed-close")) { openMissed(false); return; }
      const did = e.target.closest("[data-didit]"), back = e.target.closest("[data-unmiss]");
      if (!did && !back) return;
      const id = (did || back).dataset[did ? "didit" : "unmiss"];
      delete trashed[id]; store.set(TRASH_KEY, trashed); // autoTrashed stays, so it won't auto-expire again
      if (did) { done[id] = true; store.set(DONE_KEY, done); const r = did.getBoundingClientRect(); celebrate(r.left + r.width / 2, r.top + r.height / 2); toast("✓ late but done. counts."); }
      else toast("♻ back on your lists.");
      rerenderAll();
    });
    addEventListener("keydown", e => { if (e.key === "Escape" && !mw.hidden) openMissed(false); });
  }

  // re-render the board + missed count wherever app-2 re-renders the fire banner (checks, trash, every 30s)
  const baseUrgent = renderUrgent;
  renderUrgent = function () { baseUrgent(); renderOpps(); renderMissed(); };
  renderOpps(); renderMissed();
})();
