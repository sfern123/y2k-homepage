/* ===================== GAME MODE (lab only) ===================== */
(function () {
  const GKEY = "sf_game_v1", MODEKEY = "sf_home_game", SPLASHKEY = "sf_home_splash";
  const QUARTER_START = new Date("2026-09-21T00:00:00-07:00");
  const BASE = { hw: 15, jobs: 25, social: 8, misc: 8 };
  const TITLES = ["NEWBIE", "ROOKIE", "SECTION STAR", "CASE CRACKER", "DEAL SOURCER", "BOSS SLAYER", "CAMPUS LEGEND", "HAPPY SISYPHUS"];
  const BADGES = [
    { id: "p1", e: "🎮", n: "player 1", d: "check off your first task" },
    { id: "ten", e: "💯", n: "10 down", d: "finish 10 tasks" },
    { id: "combo", e: "🔥", n: "combo x3", d: "3 checks within a few minutes" },
    { id: "early", e: "🌅", n: "early bird", d: "check one off before 9am" },
    { id: "owl", e: "🦉", n: "night owl", d: "check one off after 11pm" },
    { id: "apply", e: "💼", n: "applied!", d: "finish a job-hunt task" },
    { id: "hw5", e: "📚", n: "hw hero", d: "finish 5 homework tasks" },
    { id: "soc3", e: "💃", n: "social butterfly", d: "finish 3 social tasks" },
    { id: "misc3", e: "🧹", n: "admin angel", d: "clear 3 misc chores" },
    { id: "fire", e: "🧯", n: "firefighter", d: "finish a task inside its last 24h" },
    { id: "streak3", e: "⭐", n: "3-day streak", d: "check something off 3 days running" },
    { id: "lv5", e: "👑", n: "level 5", d: "reach level 5" }
  ];
  const $g = id => document.getElementById(id);
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let G; try { G = JSON.parse(ls.get(GKEY)); } catch (e) {}
  G = Object.assign({ xp: 0, log: {}, badges: {}, flags: {}, streak: { last: null, count: 0 }, day: {}, best: 0, lastAt: 0, combo: 0 }, G || {});
  const save = () => ls.set(GKEY, JSON.stringify(G));
  const ymd = ms => { const x = new Date(ms); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const levelOf = xp => Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
  const need = L => 50 * L * (L - 1);
  const title = L => TITLES[Math.min(L, TITLES.length) - 1];
  const gameOn = () => document.body.classList.contains("game-on");

  function award(t, live, el) {
    let pts = isWatch(t) ? 5 : (BASE[sectionOf(t)] || 8);
    const notes = [];
    if (live) {
      const now = Date.now(), dl = deadlineOf(t);
      if (dl && dl - now >= 0) {
        pts += 10; notes.push("ON TIME +10");
        if (dl - now <= 24 * 3600e3) { pts += 15; notes.push("CLUTCH +15"); G.flags.fire = 1; }
      }
      G.combo = now - G.lastAt < 4 * 60e3 ? G.combo + 1 : 1; G.lastAt = now;
      if (G.combo > 1) { pts += 5 * G.combo; notes.push("COMBO x" + G.combo); }
      if (G.combo >= 3) G.flags.combo = 1;
      const h = new Date().getHours(); if (h < 9) G.flags.early = 1; if (h >= 23) G.flags.owl = 1;
      const today = ymd(now), yest = ymd(now - 86400e3);
      G.day[today] = (G.day[today] || 0) + pts; G.best = Math.max(G.best, G.day[today]);
      if (G.streak.last !== today) { G.streak.count = G.streak.last === yest ? G.streak.count + 1 : 1; G.streak.last = today; }
      if (el) floatXP(el, pts, notes);
    }
    G.log[t.id] = { pts, sec: isWatch(t) ? "watch" : sectionOf(t), at: live ? Date.now() : 0 };
    G.xp += pts;
  }
  function reconcile(live, el) {
    const before = levelOf(G.xp);
    Object.keys(G.log).forEach(id => {
      if (done[id]) return;
      const r = G.log[id]; G.xp -= r.pts;
      if (r.at) { const d = ymd(r.at); if (G.day[d]) G.day[d] = Math.max(0, G.day[d] - r.pts); }
      delete G.log[id];
    });
    tasks.forEach(t => { if (done[t.id] && !G.log[t.id]) award(t, live, el); });
    G.xp = Math.max(0, G.xp);
    checkBadges(live);
    save(); renderHUD(); renderBook();
    const after = levelOf(G.xp);
    if (live && after > before && gameOn()) levelUp(after);
  }
  function checkBadges(live) {
    const L = Object.values(G.log), c = s => L.filter(x => x.sec === s).length;
    const cond = { p1: L.length >= 1, ten: L.length >= 10, combo: !!G.flags.combo, early: !!G.flags.early, owl: !!G.flags.owl,
      apply: c("jobs") >= 1, hw5: c("hw") >= 5, soc3: c("social") >= 3, misc3: c("misc") >= 3, fire: !!G.flags.fire,
      streak3: G.streak.count >= 3, lv5: levelOf(G.xp) >= 5 };
    const fresh = [];
    BADGES.forEach(b => { if (cond[b.id] && !G.badges[b.id]) { G.badges[b.id] = Date.now(); fresh.push(b); } });
    if (live && gameOn()) fresh.forEach((b, i) => setTimeout(() => achPop(b), 1000 + i * 3200));
  }

  /* ----- HUD ----- */
  const streakNow = () => { const t = ymd(Date.now()), y = ymd(Date.now() - 86400e3); return (G.streak.last === t || G.streak.last === y) ? G.streak.count : 0; };
  function nextDue(filterFn) {
    const now = Date.now(); let b = null;
    tasks.forEach(t => {
      if (done[t.id] || isWatch(t) || (filterFn && !filterFn(t))) return;
      const dl = deadlineOf(t);
      if (dl && dl > now && (!b || dl < b.dl)) b = { t, dl };
    });
    return b;
  }
  function span(ms) {
    const h = Math.floor(ms / 3600e3), m = Math.floor((ms % 3600e3) / 60e3);
    return h >= 48 ? Math.floor(h / 24) + "D " + String(h % 24).padStart(2, "0") + "H" : String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  function renderHUD() {
    const L = levelOf(G.xp), lo = need(L), hi = need(L + 1);
    const nd = nextDue();
    $g("hud-time").textContent = nd ? span(nd.dl - Date.now()) : "∞";
    $g("hud-score").textContent = String(G.xp).padStart(6, "0");
    $g("hud-lv").textContent = L;
    $g("hud-xp").style.width = Math.round((G.xp - lo) / (hi - lo) * 100) + "%";
    $g("hud-xp").parentNode.title = "LV " + L + " " + title(L) + " · " + (hi - G.xp) + " XP to LV " + (L + 1);
    const lap = Math.max(1, Math.min(11, Math.floor((Date.now() - QUARTER_START) / (7 * 86400e3)) + 1));
    $g("hud-lap").textContent = (lap > 10 ? "FINALS" : lap + "/10");
    $g("hud-streak").textContent = streakNow() + (streakNow() ? "🔥" : "");
    $g("hud-hi").textContent = G.best;
    const todayXp = G.day[ymd(Date.now())] || 0;
    const coin = $g("hud-coin");
    coin.textContent = todayXp ? "PLAYER 1 · +" + todayXp + " XP TODAY · " + title(L) : "INSERT COIN · CHECK SOMETHING OFF";
    coin.classList.toggle("insert", !todayXp);
    const boss = nextDue(t => { const s = sectionOf(t); return s === "hw" || s === "jobs"; });
    $g("hud-boss").innerHTML = boss ? "NEXT BOSS ▸ <b>" + esc(boss.t.text) + "</b> ▸ " + span(boss.dl - Date.now()) : "NO BOSSES ON THE MAP · FREE ROAM";
  }
  function renderBook() {
    const got = BADGES.filter(b => G.badges[b.id]).length;
    $g("book-head").textContent = got + "/" + BADGES.length + " stickers collected · LV " + levelOf(G.xp) + " " + title(levelOf(G.xp)) + " · " + G.xp + " XP";
    $g("book").innerHTML = BADGES.map((b, i) => {
      const on = !!G.badges[b.id];
      return '<div class="stk' + (on ? "" : " locked") + '" style="--r:' + ((i * 37) % 9 - 4) + 'deg" title="' + esc(b.d) + '"><span class="e">' + b.e + '</span><span class="n">' + (on ? esc(b.n) : "???") + '</span><span class="d">' + esc(b.d) + "</span></div>";
    }).join("");
  }

  /* ----- juice ----- */
  function floatXP(el, pts, notes) {
    if (!gameOn()) return;
    const r = el.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = "xp-float";
    f.style.left = (r.left + r.width / 2 + 40) + "px"; f.style.top = (r.top) + "px";
    f.innerHTML = '<span class="pts">+' + pts + " XP</span>" + notes.map(n => '<span class="nt">' + esc(n) + "</span>").join("");
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1600);
  }
  let lvTimer = null;
  function levelUp(L) {
    $g("lv-sub").textContent = "LV " + L + " · " + title(L);
    $g("lvlup").classList.add("show");
    celebrate(innerWidth / 2, innerHeight / 2);
    clearTimeout(lvTimer); lvTimer = setTimeout(() => $g("lvlup").classList.remove("show"), 2800);
  }
  $g("lvlup").addEventListener("click", () => $g("lvlup").classList.remove("show"));
  let achTimer = null;
  function achPop(b) {
    $g("ach-e").textContent = b.e; $g("ach-n").textContent = b.n.toUpperCase() + " — " + b.d;
    const a = $g("ach"); a.classList.remove("show"); void a.offsetWidth; a.classList.add("show");
    clearTimeout(achTimer); achTimer = setTimeout(() => a.classList.remove("show"), 3000);
  }

  /* ----- PRESS START ----- */
  function showSplash() {
    const L = levelOf(G.xp);
    const wk = tasks.filter(t => { if (done[t.id] || !t.due) return false; const n = daysUntil(t.due); return n >= 0 && n <= 7; }).length;
    $g("ps-stats").textContent = "LV " + L + " " + title(L) + " · SCORE " + String(G.xp).padStart(6, "0") + " · STREAK " + streakNow() + " · " + wk + " QUESTS DUE THIS WEEK";
    $g("press-start").classList.add("show");
    setTimeout(() => $g("ps-start").focus(), 50);
  }
  function hideSplash() { $g("press-start").classList.remove("show"); ls.set(SPLASHKEY, ymd(Date.now())); }
  $g("ps-start").addEventListener("click", hideSplash);
  if ($g("ps-apply")) $g("ps-apply").addEventListener("click", () => { hideSplash(); const j = $g("sec-jobs"); if (j) j.scrollIntoView({ behavior: "smooth", block: "start" }); });
  $g("press-start").addEventListener("click", e => { if (e.target.id === "press-start") hideSplash(); });
  addEventListener("keydown", e => { if ($g("press-start").classList.contains("show") && e.key !== "Tab") { e.preventDefault(); hideSplash(); } });
  $g("hud-replay").addEventListener("click", showSplash);

  /* ----- wiring ----- */
  document.addEventListener("change", e => {
    const cb = e.target.closest && e.target.closest(".cb[data-id]"); if (!cb) return;
    reconcile(true, cb);
  });
  $g("clear-done").addEventListener("click", () => setTimeout(() => reconcile(false), 60));

  // game mode toggle in the lab switcher
  const sw = document.getElementById("theme-switch");
  const tg = document.createElement("button"); tg.id = "game-toggle"; sw.appendChild(tg);
  function setMode(on) {
    document.body.classList.toggle("game-on", on);
    tg.textContent = "game: " + (on ? "on" : "off"); tg.classList.toggle("on", on);
    ls.set(MODEKEY, on ? "1" : "0");
  }
  tg.addEventListener("click", () => setMode(!gameOn()));
  setMode(ls.get(MODEKEY) !== "0");

  reconcile(false);
  setInterval(renderHUD, 30000);
  if (gameOn() && ls.get(SPLASHKEY) !== ymd(Date.now())) showSplash();
})();
