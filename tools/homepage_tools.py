#!/usr/bin/env python3
"""Deterministic helpers for the two scheduled runs, so the main session never
dumps data.js into its context or hand-writes a long merge script every day.

  python3 homepage_tools.py hp-prep     # morning: scratch dir + compact views
  python3 homepage_tools.py hp-merge    # morning: coverage + output checks, merge, verify, write
  python3 homepage_tools.py it-prep     # nightly: scratch dir + compact views
  python3 homepage_tools.py it-check    # nightly: weekday/date check + to-do dedupe hints
  python3 homepage_tools.py it-append   # nightly: append tasks only, verify, write

Scratch dirs: /tmp/homepage-run-<user> (morning) and /tmp/instinct-run-<user> (nightly); prep prints the exact path.
The runs only ever write data.js and tasks-archive.js (usage-log.csv via log_usage.py).
Writes are verify-then-swap: new files are checked with node on temp copies, then
swapped in with os.replace (archive first). Nothing is written if a check fails, so
rerunning after a FAIL is always safe. New tasks whose thread/link/text already exist
are skipped, so a rerun can't create duplicates either.

Gmail thread ids: the Gmail tools return hex ids (e.g. 1a2b3c4d5e6f7a8b); homepage links
use the decimal form (thread-f:1885000000000000000). norm() maps both to decimal.

data.js format: the DATA object between the markers must be strict JSON (quoted keys,
no comments), followed by `;`. The script writes it back in that same format.
"""
import datetime, json, os, re, shutil, subprocess, sys, tempfile
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
HOME_DIR = os.environ.get("HOMEPAGE_DIR_TEST") or os.path.dirname(HERE)  # env var only for dry tests on a copy
DATA = os.path.join(HOME_DIR, "data.js")
ARCH = os.path.join(HOME_DIR, "tasks-archive.js")
COURSES = os.path.join(HOME_DIR, "courses.js")
PT = ZoneInfo("America/Los_Angeles")
# /tmp is shared between Cowork sessions that run as different Linux users, so a fixed
# path can't be emptied by the next run. Each session gets its own scratch dir; prep prints it.
try:
    import getpass; _USER = getpass.getuser()
except Exception:
    _USER = str(os.getuid())
HP = os.environ.get("HOMEPAGE_SCRATCH") or f"/tmp/homepage-run-{_USER}"
IT = os.environ.get("INSTINCT_SCRATCH") or f"/tmp/instinct-run-{_USER}"
FIELDS = ["generatedAt", "urgent", "news", "today", "schedule", "tasks"]
SECTIONS = {"hw", "jobs", "social", "misc"}
NEWS_CATS = {"AI", "POLITICS", "HEADLINES"}
THREAD_RE = re.compile(r"thread-f:([0-9A-Za-z]+)")
START, END = "/* DATA:START */", "/* DATA:END */"
# Link prefix for Gmail threads. Set HOMEPAGE_GMAIL_PREFIX to use another account, e.g.
# "https://mail.google.com/mail/?authuser=you@school.edu#all/thread-f:"
GMAIL = os.environ.get("HOMEPAGE_GMAIL_PREFIX") or "https://mail.google.com/mail/u/0/#all/thread-f:"


def die(msg):
    print("FAIL:", msg)
    print("(nothing was written; fix the cause and rerun)")
    sys.exit(1)


def now():
    return datetime.datetime.now(PT)


def offset(dt):
    s = dt.strftime("%z")
    return s[:3] + ":" + s[3:]


def norm(tid):
    """Gmail thread id (hex from the API, or decimal from a link) -> decimal string."""
    tid = str(tid or "").strip().lower()
    if not tid:
        return ""
    try:
        return str(int(tid, 16)) if len(tid) <= 16 else str(int(tid))
    except ValueError:
        return tid


def threads_in(text):
    return {norm(t) for t in THREAD_RE.findall(text or "")}


# ---------------------------------------------------------------- data.js io
def parse_data(src):
    if START not in src or END not in src:
        die("data.js markers missing")
    head, rest = src.split(START, 1)
    body, tail = rest.split(END, 1)
    m = re.search(r"const DATA\s*=\s*(\{.*\})\s*;\s*$", body, re.S)
    if not m:
        die("could not parse DATA object (must be strict JSON followed by ';')")
    return head, json.loads(m.group(1)), tail


def read_data():
    return parse_data(open(DATA, encoding="utf-8").read())


def render_data(head, data, tail):
    return head + START + "\nconst DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n" + END + tail


def render_archive(tasks):
    s = open(ARCH, encoding="utf-8").read()
    if not tasks:
        return s
    i = s.rstrip().rfind("];")
    if i < 0:
        die("tasks-archive.js has no closing ];")
    before = s[:i].rstrip()
    sep = "" if before.endswith("[") else ","
    add = ",\n".join("  " + json.dumps(t, ensure_ascii=False) for t in tasks)
    return before + sep + "\n" + add + "\n" + s[i:]


NODE_JS = r"""
const fs=require('fs'),vm=require('vm');const ctx={window:{}};vm.createContext(ctx);
for(const f of ['courses.js','tasks-archive.js']){vm.runInContext(fs.readFileSync(f,'utf8'),ctx);}
const src=fs.readFileSync('data.js','utf8');
if(!src.includes('/* DATA:START */')||!src.includes('/* DATA:END */'))throw new Error('markers missing');
vm.runInContext(src+';this.__D=DATA;',ctx);const D=ctx.__D;
for(const k of ['generatedAt','urgent','news','today','schedule','tasks'])if(!(k in D))throw new Error('DATA missing '+k);
const all=[...ctx.window.COURSE_TASKS,...ctx.window.TASK_ARCHIVE,...D.tasks].map(t=>t.id);
const dup=all.filter((x,i)=>all.indexOf(x)!==i);if(dup.length)throw new Error('duplicate ids '+dup);
console.log('node verify OK: '+D.tasks.length+' tasks in data.js, '+ctx.window.TASK_ARCHIVE.length+' archived, '+all.length+' ids unique');
"""


def verify_and_swap(data_src, arch_src):
    """Check the new files with node in a temp dir; only if that passes, swap them in."""
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, "data.js"), "w", encoding="utf-8").write(data_src)
        open(os.path.join(d, "tasks-archive.js"), "w", encoding="utf-8").write(arch_src)
        shutil.copy(COURSES, os.path.join(d, "courses.js"))
        r = subprocess.run(["node", "-e", NODE_JS], cwd=d, capture_output=True, text=True)
        if r.returncode:
            die("node verify: " + (r.stderr.strip().splitlines() or ["?"])[-1])
        ok = r.stdout.strip()
    # swap: archive first, so a task is never missing from both files
    for path, src in ((ARCH, arch_src), (DATA, data_src)):
        if open(path, encoding="utf-8").read() == src:
            continue
        tmp = path + ".tmp"
        try:
            open(tmp, "w", encoding="utf-8").write(src)
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
    print(ok)


# ---------------------------------------------------------------- shared
def other_ids_and_threads():
    """Ids and thread ids in courses.js and tasks-archive.js, by regex."""
    ids, threads = set(), set()
    for p in (COURSES, ARCH):
        if os.path.exists(p):
            s = open(p, encoding="utf-8").read()
            ids |= set(re.findall(r'"id"\s*:\s*"([^"]+)"', s))
            threads |= threads_in(s)
    return ids, threads


def fresh_dir(d):
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))


def write_views(d, data):
    _, threads = other_ids_and_threads()
    lines = []
    for t in data["tasks"]:
        th = threads_in(t.get("link", "") + " " + t.get("note", ""))
        threads |= th
        lines.append(" | ".join([t["id"], t.get("section", "-"), t.get("cat", ""),
                                 (t.get("due", "") + " " + t.get("dueTime", "")).strip(),
                                 t.get("text", "")[:110], ",".join(f"{x}/{int(x):x}" for x in th if x.isdigit())]))
    # both forms per id, so the helpers can compare literally with what the Gmail tools return
    both = sorted(threads) + sorted(f"{int(x):x}" for x in threads if x.isdigit())
    open(os.path.join(d, "captured_ids.txt"), "w").write("\n".join(both) + "\n")
    open(os.path.join(d, "tasks_compact.txt"), "w").write(
        "# id | section | cat | due | text | thread ids (decimal/hex)\n" + "\n".join(lines) + "\n")
    return threads


def load_captured(d):
    return {norm(x) for x in open(os.path.join(d, "captured_ids.txt")).read().split()}


def next_ids(prefix, existing, n):
    day = now().strftime("%Y%m%d")
    k, out = 1, []
    while len(out) < n:
        cand = f"{prefix}{day}-{k}"
        if cand not in existing:
            out.append(cand)
            existing.add(cand)
        k += 1
    return out


def check_task(t):
    if t.get("section") not in SECTIONS:
        die(f"task '{t.get('text','')[:50]}': bad section {t.get('section')}")
    if not t.get("text") or not t.get("cat"):
        die(f"task missing text/cat: {t}")
    if t.get("due") and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", t["due"]):
        die(f"bad due {t['due']}")
    if t.get("dueTime") and not re.fullmatch(r"\d{2}:\d{2}", t["dueTime"]):
        die(f"bad dueTime {t['dueTime']}")


def append_tasks(data, new, prefix):
    """Append new tasks (ids assigned here). Skips exact repeats already in data.js
    (same thread link + same text, or same text + same due) so a rerun can't duplicate."""
    ids, _ = other_ids_and_threads()
    ids |= {t["id"] for t in data["tasks"]}
    have = {(t.get("text", "").strip().lower(), t.get("due", "")) for t in data["tasks"]}
    have_link = {(th, t.get("text", "").strip().lower()) for t in data["tasks"] for th in threads_in(t.get("link", ""))}
    keys = ["id", "section", "cat", "text", "due", "dueTime", "link", "note"]
    added, skipped = [], []
    for t in new:
        t = dict(t)
        if not t.get("link") and t.get("thread"):
            t["link"] = GMAIL + norm(t["thread"])
        t = {k: t[k] for k in keys if t.get(k) not in (None, "")}
        check_task(t)
        txt = t["text"].strip().lower()
        if (txt, t.get("due", "")) in have or any((th, txt) in have_link for th in threads_in(t.get("link", ""))):
            skipped.append(t["text"][:60])
            continue
        t["id"] = next_ids(prefix, ids, 1)[0]
        data["tasks"].append({k: t[k] for k in keys if k in t})
        have.add((txt, t.get("due", "")))
        added.append(t["id"])
    for s in skipped:
        print(f"note: skipped repeat of an existing task: {s}")
    return added


# ---------------------------------------------------------------- morning
def hp_prep():
    fresh_dir(HP)
    _, data, _ = read_data()
    threads = write_views(HP, data)
    open(os.path.join(HP, "news_titles.txt"), "w").write(
        "\n".join(f"{n.get('cat')} | {n.get('title')} | {n.get('url')}" for n in data["news"]) + "\n")
    t = now()
    cutoff = (t.date() - datetime.timedelta(days=21)).isoformat()
    print(f"today {t:%a %Y-%m-%d %H:%M} PT, offset {offset(t)}")
    print(f"data.js: {len(data['tasks'])} tasks, {len(data['schedule'])} schedule, {len(data['news'])} news; "
          f"{len(threads)} captured thread ids")
    print(f"will archive {sum(1 for x in data['tasks'] if x.get('due') and x['due'] < cutoff)} tasks due before {cutoff}")
    for x in data["tasks"]:
        if not x.get("section"):
            print(f"no section: {x['id']} | {x.get('cat','')} | {x.get('text','')[:90]}")
    print(f"scratch: {HP} (captured_ids.txt, tasks_compact.txt, news_titles.txt)")


def coverage(captured):
    p = os.path.join(HP, "email.json")
    if not os.path.exists(p):
        die("email.json missing: the email helper did not finish")
    e = json.load(open(p))
    th = e.get("threads") or []
    ids = [norm(x.get("id")) for x in th]
    if len(ids) != len(set(ids)):
        die("email.json: duplicate thread ids")
    bad = []
    by = {"on_list": [], "noise": [], "needs_reply": [], "actionable": []}
    for x in th:
        c, i = x.get("class"), norm(x.get("id"))
        if c not in by:
            bad.append(f"{x.get('id')} bad class {c}")
            continue
        by[c].append(i)
        if c in ("needs_reply", "actionable") and not x.get("opened"):
            bad.append(f"{x.get('id')} is {c} but was not opened")
        if c == "on_list" and i not in captured:
            bad.append(f"{x.get('id')} marked on_list but its id is not in captured_ids.txt")
    items = e.get("items") or []
    item_threads = {norm(i.get("thread")) for i in items}
    for c in ("needs_reply", "actionable"):
        for i in by[c]:
            if i not in item_threads:
                bad.append(f"{i} (hex {int(i):x}) is {c} but has no entry in items")
    if not th:
        bad.append("no threads at all (searches returned nothing or helper failed)")
    if bad:
        die("email coverage check:\n  " + "\n  ".join(bad))
    opened = sum(1 for x in th if x.get("opened"))
    nr = len({norm(i.get("thread")) for i in items if i.get("class") == "needs_reply" and not i.get("replied")})
    line = (f"72h: scanned {len(ids)}, {len(by['on_list'])} already on list, opened {opened}, "
            f"{len(by['noise'])} noise")
    print(f"email coverage OK · {nr} need a reply · {line}")
    return nr, line, items


def output_check(items, m):
    """Every email item that still needs handling must land in new_tasks, urgent,
    dueTime_fixes or skipped (with a reason)."""
    landed = set()
    for t in (m.get("new_tasks") or []) + (m.get("urgent") or []):
        if t.get("thread"):
            landed.add(norm(t["thread"]))
        landed |= threads_in(t.get("link", ""))
    landed |= {norm(k) for k in (m.get("skipped") or {})}
    updated = set((m.get("task_updates") or {}).keys())
    miss = []
    for i in items:
        if i.get("no_action"):
            continue
        if i.get("matches_task") and not i.get("update"):
            continue
        if i.get("update") and i.get("matches_task") in updated:
            continue
        if norm(i.get("thread")) not in landed:
            miss.append(f"{i.get('thread')} | {i.get('from','')} | {i.get('ask','')[:70]}")
    if miss:
        die("email items not in new_tasks / urgent / task_updates / skipped (add each, or skip it with a reason):\n  " + "\n  ".join(miss))


def hp_merge():
    mp = os.path.join(HP, "main.json")
    if not os.path.exists(mp):
        die("main.json missing")
    m = json.load(open(mp))
    captured = load_captured(HP)
    if m.get("email_failed"):
        nr, inbox_line = 0, "EMAIL SCAN FAILED: inbox not checked this run"
        print("WARNING email_failed set: coverage check skipped")
    else:
        nr, inbox_line, items = coverage(captured)
        output_check(items, m)
    head, data, tail = read_data()  # read fresh: the nightly run may have appended since prep
    t = now()
    data["generatedAt"] = t.strftime("%a, %b %-d %Y · %-I:%M %p PT")
    # schedule / news from helper files; keep existing if missing, empty or invalid
    try:
        sched = json.load(open(os.path.join(HP, "schedule.json")))
        assert isinstance(sched, list) and (sched or m.get("allow_empty_schedule")), "empty schedule"
        for s in sched:
            assert s["start"] and s["end"] and s["title"] and s["kind"] in ("class", "event"), s
        data["schedule"] = sched
        print(f"schedule: {len(sched)} items from calendar helper")
    except Exception as ex:
        print(f"WARNING schedule kept as-is ({ex.__class__.__name__}: {str(ex)[:120]})")
    try:
        news = json.load(open(os.path.join(HP, "news.json")))
        cnt = {c: 0 for c in NEWS_CATS}
        for n in news:
            assert n["cat"] in NEWS_CATS and n["title"] and n["blurb"] and n["src"], n
            assert re.match(r"https?://", n["url"]), n["url"]
            cnt[n["cat"]] += 1
        assert 9 <= len(news) <= 14, f"{len(news)} news items"
        if any(not 3 <= v <= 5 for v in cnt.values()):
            print(f"note: news per category {cnt} (target 3–5 each)")
        data["news"] = news
        print(f"news: {len(news)} items {cnt}")
    except Exception as ex:
        print(f"WARNING news kept as-is ({ex.__class__.__name__}: {str(ex)[:120]})")
    # urgent: replace; assign ids
    urg = []
    for k, u in enumerate(m.get("urgent") or [], 1):
        if not u.get("link") and u.get("thread"):
            u["link"] = GMAIL + norm(u["thread"])
        if not (u.get("text") and re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[-+]\d{2}:00", u.get("deadline", ""))):
            die(f"bad urgent item {u}")
        # Stable id from the text (NOT date/position), so "put it out" dismissals survive refreshes.
        import hashlib
        base = "us" + hashlib.sha1(re.sub(r"\W+", " ", u["text"].lower()).strip().encode()).hexdigest()[:8]
        u["id"] = base
        n = 2
        while any(x["id"] == u["id"] for x in urg):
            u["id"] = f"{base}-{n}"; n += 1
        urg.append({x: u[x] for x in ("id", "text", "deadline", "source", "link") if u.get(x)})
    data["urgent"] = urg
    # today: replace; the script inserts the inbox line with verified counts
    today = m.get("today") or {}
    items_t = [i for i in today.get("items", []) if i.get("when") != "inbox"]
    who = (m.get("inbox_who") or "").strip()
    inbox = {"when": "inbox", "what": (f"{nr} need a reply · " + (who + " · " if who else "") + inbox_line)
             if not m.get("email_failed") else inbox_line}
    pos = next((k for k, i in enumerate(items_t) if i.get("when") == "canvas"), len(items_t))
    items_t.insert(pos, inbox)
    data["today"] = {"headline": today.get("headline", ""), "items": items_t}
    # existing tasks: only fill a missing section / dueTime
    byid = {x["id"]: x for x in data["tasks"]}
    for i, s in (m.get("section_fixes") or {}).items():
        if i in byid and not byid[i].get("section") and s in SECTIONS:
            byid[i]["section"] = s
    for i, v in (m.get("dueTime_fixes") or {}).items():
        if i in byid and not byid[i].get("dueTime") and re.fullmatch(r"\d{2}:\d{2}", v):
            byid[i]["dueTime"] = v
    # changed date/time/details for a task already on the list: update it IN PLACE (same id, same text),
    # so her checkmark and trash state carry over. Never add an "Updated: ..." copy.
    for i, u in (m.get("task_updates") or {}).items():
        if i not in byid:
            die(f"task_updates: no task {i} in data.js")
        x = byid[i]
        if u.get("due"):
            assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", u["due"]), u
            x["due"] = u["due"]
        if u.get("dueTime"):
            assert re.fullmatch(r"\d{2}:\d{2}", u["dueTime"]), u
            x["dueTime"] = u["dueTime"]
        add = " ".join(filter(None, [f"Updated {t:%b %-d}: " + (u.get("note") or "details changed"),
                                     GMAIL + norm(u["thread"]) if u.get("thread") else ""]))
        x["note"] = (x.get("note", "") + " · " + add).strip(" ·")
        print(f"updated in place: {i} ({', '.join(k for k in ('due','dueTime') if u.get(k)) or 'note only'})")
    for t_ in m.get("new_tasks") or []:
        if re.match(r"\s*updated?\b", t_.get("text", ""), re.I):
            die(f"new task '{t_['text'][:60]}' looks like an update of an existing task: use task_updates on that task's id instead")
    new_ids = append_tasks(data, m.get("new_tasks") or [], "h")
    # archive tasks due more than 21 days ago
    cutoff = (t.date() - datetime.timedelta(days=21)).isoformat()
    arch = [x for x in data["tasks"] if x.get("due") and x["due"] < cutoff]
    data["tasks"] = [x for x in data["tasks"] if not (x.get("due") and x["due"] < cutoff)]
    for f in FIELDS:
        if f not in data:
            die(f"DATA missing {f}")
    verify_and_swap(render_data(head, data, tail), render_archive(arch))
    print(f"wrote data.js: +{len(new_ids)} tasks {new_ids}, archived {len(arch)}, urgent {len(data['urgent'])}")


# ---------------------------------------------------------------- nightly
def it_prep():
    fresh_dir(IT)
    _, data, _ = read_data()
    threads = write_views(IT, data)
    t = now()
    print(f"today {t:%a %Y-%m-%d %H:%M} PT, offset {offset(t)}; {len(data['tasks'])} tasks, {len(threads)} captured thread ids")
    print(f"scratch: {IT} (captured_ids.txt, tasks_compact.txt)")


def it_check():
    items = json.load(open(os.path.join(IT, "items.json")))
    _, data, _ = read_data()
    _, arch_threads = other_ids_and_threads()
    today = now().date()
    stop = set("the a an and or of for to in on at with by from your you is are be rsvp event due deadline".split())
    tasks = data["tasks"]
    by_thread = {}
    for x in tasks:
        for th in threads_in(x.get("link", "")):
            by_thread.setdefault(th, []).append(x["id"])
    for k, it in enumerate(items):
        idx = it.get("idx", k)
        flags = []
        d = it.get("date")
        dd = None
        if d:
            try:
                dd = datetime.date.fromisoformat(d)
            except ValueError:
                flags.append(f"BAD-DATE {d!r}")
        if dd:
            if dd < today:
                flags.append("PAST")
            sw = (it.get("stated_weekday") or "").strip()[:3].lower()
            if sw and sw != dd.strftime("%a").lower():
                flags.append(f"DATE-CONFLICT stated {it['stated_weekday']} but {d} is {dd:%A}")
        th = norm(it.get("thread"))
        if th in by_thread:
            flags.append("thread already linked from task " + ",".join(by_thread[th]))
        elif th in arch_threads:
            flags.append("thread already linked from tasks-archive.js/courses.js")
        words = {w for w in re.findall(r"[a-z0-9]+", it.get("title", "").lower()) if w not in stop and len(w) > 2}
        hits = []
        for x in tasks:
            tw = set(re.findall(r"[a-z0-9]+", x.get("text", "").lower()))
            score = len(words & tw)
            if score >= 2 or (score >= 1 and d and x.get("due") == d):
                hits.append((score, x["id"], x.get("text", "")[:70]))
        hits.sort(reverse=True)
        print(f"[{idx}] {d or '-'} {it.get('time') or ''} | {it.get('title')} | {' · '.join(flags) or 'ok'}")
        for s, i, tx in hits[:3]:
            print(f"      possible to-do match {i}: {tx}")
    print(f"{len(items)} items checked. For anything unclear, grep {IT}/tasks_compact.txt.")


def it_append():
    p = os.path.join(IT, "tasks.json")
    new = json.load(open(p)) if os.path.exists(p) else []
    head, data, tail = read_data()  # read fresh, just before writing
    new_ids = append_tasks(data, new, "i")
    verify_and_swap(render_data(head, data, tail), render_archive([]))
    print(f"appended {len(new_ids)} tasks {new_ids}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    {"hp-prep": hp_prep, "hp-merge": hp_merge, "it-prep": it_prep,
     "it-check": it_check, "it-append": it_append}.get(cmd, lambda: die("unknown command " + cmd))()
