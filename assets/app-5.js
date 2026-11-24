/* ============ LAB: it-girl sisyphus + phone / IM / spam social section ============ */
(function () {
  /* ---------- original pixel "it girl" (not any branded character) ---------- */
  const PAL = { H: "#2b1a12", S: "#a86b45", M: "#ff4fa3", E: "#1e1e1e", L: "#d94f8c", P: "#ff6fb0", p: "#ffd1e6", D: "#7a9be0", W: "#ffffff", w: "#cfd3e6" };
  const PUSH = [
    ".........HH...HH....",
    "........HHHH.HHHH...",
    ".........HHHHHHHM...",
    "........HHHHHHHHH...",
    "........HHHSSSSSHH..",
    ".......HHHSSSESSSH..",
    ".......HHHSSSSSSS...",
    "......HHHHSSSSLS....",
    "......HHHH.SSSS.....",
    ".....HHHHPPPSS......",
    ".....HHHPPPPPSSSSSSS",
    ".....HHPPPPPPSSSSSSS",
    "....HHHPPPPPP.......",
    "....HH.PPpPPP.......",
    ".......SSSSSS.......",
    "......SSSSSS........",
    "......DDDDDDD.......",
    ".....DDDDDDDD.......",
    ".....DDDDDDDDDSS....",
    "....SSS....SSSSS....",
    "....SS.....WWWWW....",
    "...SSS.....wwwww....",
    "...SS...............",
    "..SSS...............",
    "..SS................",
    ".SSS................",
    ".WWW................",
    "WWWW................",
    "WWWW................",
    "wwww................"
  ];
  const YAY = [
    "S.....H..H.....S",
    "SS...HHHHHH...SS",
    ".SS..HHHHHHM.SS.",
    "..S.HHHHHHHH.S..",
    "..SSHSSSSSSHSS..",
    "...SHSESSESHS...",
    "...SHSSSSSSHS...",
    "....HSSLLSSH....",
    "....HHSSSSHH....",
    "....HH.SS.HH....",
    "....PPPPPPPP....",
    "....PPPPPPPP....",
    "....PPpPPpPP....",
    ".....PPPPPP.....",
    ".....SSSSSS.....",
    ".....SSSSSS.....",
    "....DDDDDDDD....",
    "....DDDDDDDD....",
    "....DDDDDDDD....",
    ".....SS..SS.....",
    ".....SS..SS.....",
    ".....SS..SS.....",
    ".....SS..SS.....",
    "....WWW..WWW....",
    "....WWW..WWW....",
    "....WWW..WWW....",
    "...wwww..wwww..."
  ];
  const sprite = (rows, ox, oy) => rows.map((r, y) => Array.from(r).map((c, x) => PAL[c] ? '<rect x="' + (ox + x).toFixed(1) + '" y="' + (oy + y).toFixed(1) + '" width="1.05" height="1.05" fill="' + PAL[c] + '"/>' : "").join("")).join("");
  const orig = plantSVG;
  const recolor = svg => svg.replace('fill="#a8a8a8"', 'style="fill:var(--hill,#a8a8a8)"').replace(/fill="#cfcfcf"/g, 'style="fill:var(--rock,#cfcfcf)"');
  plantSVG = function (h) {
    if (h >= 0.999) {
      let svg = orig(1).replace(/<path[^>]*stroke-width="2\.4"[^>]*\/>/g, "").replace(/<circle cx="119" cy="12" r="5"[^>]*\/>/, "");
      return recolor(svg).replace("</svg>", '<g shape-rendering="crispEdges">' + sprite(YAY, 110, 17) + "</g></svg>");
    }
    let svg = orig(h).replace(/<g class="push">[\s\S]*?<\/g>/, "");
    const A = [4, 130], B = [116, 44], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
    const n = [dy / L, -dx / L], r = 15, sb = 0.4 + h * 0.46;
    const C = [A[0] + dx * sb + n[0] * r, A[1] + dy * sb + n[1] * r];
    const slopeY = x => A[1] + (x - A[0]) * dy / dx;
    let ox = C[0] - 45, oy = 0;
    for (; ox < C[0]; ox += 0.25) { oy = slopeY(ox + 1.5) - 30; if (Math.hypot(ox + 19.5 - C[0], oy + 10.5 - C[1]) <= r + 0.8) break; }
    const sweat = h < 0.5 ? '<rect class="drip" x="' + (ox + 6).toFixed(1) + '" y="' + (oy + 3).toFixed(1) + '" width="1.5" height="2.5" fill="#7fd3ff"/>' : "";
    const sparkle = h >= 0.75 ? '<text x="' + (ox + 2).toFixed(1) + '" y="' + (oy + 2).toFixed(1) + '" font-size="8" fill="#fff" stroke="#000" stroke-width=".4">✦</text>' : "";
    return recolor(svg).replace("</svg>", '<g class="push" shape-rendering="crispEdges">' + sprite(PUSH, ox, oy) + sweat + sparkle + "</g></svg>");
  };

  /* ---------- phone: this week's social calendar ---------- */
  const origSocial = renderSocial;
  renderSocial = function () {
    origSocial();
    const S = schedule().filter(e => e.social);
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const end = new Date(t0); end.setDate(t0.getDate() + 10);
    const list = S.filter(e => e.e >= t0 && e.s < end);
    const w7 = new Date(t0); w7.setDate(t0.getDate() + 7);
    const wk = list.filter(e => e.s < w7);
    const yes = wk.filter(e => e.status !== "maybe").length, maybe = wk.length - yes;
    const batt = Math.max(0, Math.min(100, Math.round(100 - yes * 10 - maybe * 4)));
    let body = "", lastDay = "";
    list.forEach(e => {
      const dk = e.s.toDateString();
      if (dk !== lastDay) { lastDay = dk; body += '<div class="ph-day">' + esc(dayWord(e.s).toUpperCase()) + "</div>"; }
      const url = safeUrl(e.url);
      body += '<div class="ph-ev' + (e.status === "maybe" ? " maybe" : "") + '"><span class="t">' + (e.allDay ? "all day" : esc(clock(e.s))) + '</span><span class="w">' +
        (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(e.title) + "</a>" : esc(e.title)) + (e.where ? " · " + esc(e.where) : "") + "</span></div>";
    });
    if (!body) body = '<div class="ph-empty">no plans 💤<br>text someone?</div>';
    $("soc-week").innerHTML =
      '<div class="fun-h">📱 social cal</div>' +
      '<div class="phone"><div class="ph-speaker"></div><div class="ph-screen">' +
      '<div class="ph-status"><span>▂▄▆█</span><span id="ph-clock">' + esc(clock(new Date())) + "</span><span>🔋" + batt + "%</span></div>" +
      '<div class="ph-title">✿ my social life ✿</div>' +
      '<div class="ph-list" id="ph-list">' + body + "</div>" +
      '<div class="ph-soft"><span>Menu</span><span>' + yes + " going · " + maybe + " maybe</span><span>Back</span></div></div>" +
      '<div class="ph-nav"><button data-s="-80" aria-label="scroll up">▲</button><button class="ok" data-s="0" aria-label="top">OK</button><button data-s="80" aria-label="scroll down">▼</button></div>' +
      '<div class="ph-keys">' + ["1", "2 abc", "3 def", "4 ghi", "5 jkl", "6 mno", "7 pqrs", "8 tuv", "9 wxyz", "*", "0 ␣", "#"].map(k => "<span>" + k + "</span>").join("") + "</div></div>";
  };
  document.addEventListener("click", e => {
    const b = e.target.closest(".ph-nav button"); if (!b) return;
    const l = $("ph-list"); const d = +b.dataset.s;
    if (d === 0) l.scrollTop = 0; else l.scrollBy({ top: d, behavior: "smooth" });
  });
  setInterval(() => { const c = $("ph-clock"); if (c) c.textContent = clock(new Date()); }, 30000);

  /* ---------- social tasks: IM (to decide) + spam pop-ups (to do) ---------- */
  const isDecide = t => /^\s*(decide|pick|in or out)|\bdecide\b|\bin or out\b|\bpick one\b|\?/i.test(t.text);
  const clean = x => x.replace(/^\s*decide(\s*\+\s*[a-z]+)?\s*:\s*/i, "");
  const ASKS = ["u going?? 👀", "u in or nah", "decide pls 🥺", "rsvp or regret 💅", "yes? no? maybe?? 🫣", "don't leave me on read"];
  const BANNERS = [["v0", "YOU HAVE A NEW MESSAGE", "Message"], ["v1", "FREE STUFF", "Special Offer"], ["v2", "YOU ARE A WINNER!", "winner.exe"],
    ["v3", "⚠ SYSTEM ALERT ⚠", "Warning"], ["v4", "CLICK HERE NOW!!", "untitled.htm"], ["v5", "LIMITED TIME OFFER", "Alert!"], ["v6", "100 HOURS FREE", "Offer"]];
  const hash = str => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const cbx = t => '<input type="checkbox" class="cb" data-id="' + esc(t.id) + '"' + (done[t.id] ? " checked" : "") + ' aria-label="' + esc(t.text) + '">';
  const stamp = t => t.due ? new Date(t.due + "T00:00:00").toLocaleDateString([], { weekday: "short", month: "numeric", day: "numeric" }).toUpperCase() : "someday";

  function renderSocialFun() {
    const vis = tasks.filter(t => sectionOf(t) === "social" && (filter === "all" || (filter === "open" ? !done[t.id] : !!done[t.id]))).sort(byDue);
    const dec = vis.filter(isDecide), todo = vis.filter(t => !isDecide(t));
    let im = "";
    dec.forEach(t => {
      const h = hash(t.id), url = safeUrl(t.link), d = !!done[t.id];
      im += '<div class="im-msg' + (d ? " done" : "") + '"><span class="im-av">🌼</span><div><div class="im-who">fomo_4ever [' + esc(stamp(t)) + "]:</div>" +
        '<div class="im-bub">' + esc(clean(t.text)) + " " + ASKS[h % ASKS.length] + (url ? ' <a href="' + esc(url) + '" target="_blank" rel="noopener">[link]</a>' : "") + "</div>" +
        (t.note ? '<div class="im-bub">' + esc(t.note) + "</div>" : "") + "</div></div>" +
        '<div class="im-msg me' + (d ? " done" : "") + '"><span class="im-av">💖</span><div><div class="im-who">me:</div>' +
        '<div class="im-bub"><label>' + cbx(t) + (d ? "decided ✓ ttyl" : "hmm lemme think…") + "</label> " + dueTag(t.due, t) + " " + trashBtn(t.id, "nah") + "</div></div></div>";
    });
    if (!im) im = '<div class="im-empty">no new messages 💤</div>';
    let spam = "";
    todo.forEach((t, i) => {
      const h = hash(t.id), [v, ban, ttl] = BANNERS[h % BANNERS.length], url = safeUrl(t.link), d = !!done[t.id];
      const r = ((h % 7) - 3) * 0.8, x = (h % 5) - 2, y = i % 2 ? 6 : -2;
      spam += '<div class="spam' + (d ? " done" : "") + '" style="--r:' + r.toFixed(1) + "deg;--x:" + x + "px;--y:" + y + 'px">' +
        '<div class="spam-bar"><span>' + esc(ttl) + '</span><i class="spam-x" data-trash="' + esc(t.id) + '" title="trash it">x</i></div>' +
        '<div class="spam-ban ' + v + '">' + ban + "</div>" +
        '<div class="spam-body">' + esc(t.text) + '<div class="item-meta">' + dueTag(t.due, t) + "</div>" + (t.note ? '<div class="item-note">' + esc(t.note) + "</div>" : "") + "</div>" +
        '<div class="spam-foot"><label class="spam-btn">' + cbx(t) + (d ? "CLAIMED ✓" : "CLAIM (mark done)") + "</label>" +
        (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">CLICK HERE &gt;&gt;</a>' : "") + trashBtn(t.id) + "</div></div>";
    });
    if (!spam) spam = '<div class="spam-empty">SCAN COMPLETE · 0 THREATS FOUND · your pc is clean ✨</div>';
    $("sec-social").innerHTML =
      '<div class="fun-h">💬 to decide (' + dec.length + ")</div>" +
      '<div class="im"><div class="im-title"><span>💬 fomo_4ever &lt;3</span><span class="b"><i>_</i><i>□</i><i>x</i></span></div>' +
      '<div class="im-tools"><span><b>👥</b>Invite</span><span><b>📁</b>Files</span><span><b>📷</b>Webcam</span><span><b>💗</b>Love</span></div>' +
      '<div class="im-log">' + im + "</div>" +
      '<div class="im-input"><div class="im-box">' + (dec.length ? "ok ok i'll decide by tonight" : "brb") + '</div><button class="im-send" type="button">Send</button></div>' +
      '<div class="im-status">' + (dec.length ? 'fomo_4ever is typing<span class="dots"></span>' : "fomo_4ever is away") + "</div></div>" +
      '<div class="fun-h">🚨 to do (' + todo.length + ")</div>" +
      '<div class="spam-wall">' + spam + "</div>";
  }
  const origTodo = renderTodo;
  renderTodo = function () { origTodo(); renderSocialFun(); };

  renderPlant(); renderSocial(); renderTodo();
})();
