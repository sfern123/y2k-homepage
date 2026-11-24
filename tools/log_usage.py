#!/usr/bin/env python3
"""Append this run's token usage to Homepage/usage-log.csv.

Usage (last step of a scheduled run):
    python3 "<path to>/Homepage/tools/log_usage.py" <task-name> [--dry-run]

Reads the current session's transcript (+ any helper-agent transcripts), sums the
token usage Claude recorded for each model call, and appends one CSV row.
Weighted = input + 0.1*cache_read + 2*cache_write + 5*output  (same weighting as the workshop deck).
Note: the run's final reply comes after this step, so it is not counted (small undercount).
"""
import csv, datetime, glob, json, os, sys

task = next((a for a in sys.argv[1:] if not a.startswith("--")), "unknown")
dry = "--dry-run" in sys.argv
here = os.path.dirname(os.path.abspath(__file__))
log_path = os.path.join(os.path.dirname(here), "usage-log.csv")
home = os.environ.get("HOME", "")

mains = glob.glob(os.path.join(home, "mnt/.claude/projects/*/*.jsonl"))
if not mains:
    print("usage-log: no transcript found; nothing logged"); sys.exit(0)
main = max(mains, key=os.path.getmtime)
sid = os.path.splitext(os.path.basename(main))[0]
subs = glob.glob(os.path.join(os.path.dirname(main), sid, "subagents", "*.jsonl"))

K = ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens")
def read(path):
    tot = dict.fromkeys(K, 0); seen = set(); tools = set(); models = set(); ts = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            try: r = json.loads(line)
            except Exception: continue
            if r.get("timestamp"): ts.append(r["timestamp"])
            if r.get("type") != "assistant": continue
            m = r.get("message") or {}
            if m.get("model") and not m["model"].startswith("<"): models.add(m["model"])
            for c in m.get("content") or []:
                if isinstance(c, dict) and c.get("type") == "tool_use": tools.add(c.get("id"))
            u, mid = m.get("usage"), m.get("id")
            if u and mid not in seen:
                seen.add(mid)
                for k in K: tot[k] += u.get(k, 0) or 0
    return tot, len(tools), models, ts

mt, mcalls, models, ts = read(main)
st = dict.fromkeys(K, 0)
for p in subs:
    t, _, ms, _ = read(p); models |= ms
    for k in K: st[k] += t[k]
raw = lambda t: sum(t.values())
allt = {k: mt[k] + st[k] for k in K}
weighted = allt[K[0]] + .1 * allt[K[1]] + 2 * allt[K[2]] + 5 * allt[K[3]]
mins = ""
if ts:
    p = lambda s: datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
    mins = round((p(max(ts)) - p(min(ts))).total_seconds() / 60, 1)
try:
    from zoneinfo import ZoneInfo
    now = datetime.datetime.now(ZoneInfo("America/Los_Angeles"))
except Exception:
    now = datetime.datetime.utcnow()
row = {
    "date_pt": now.strftime("%Y-%m-%d %H:%M"), "weekday": now.strftime("%a"), "task": task, "session": sid[:8],
    "minutes": mins, "tool_calls_main": mcalls, "helper_agents": len(subs),
    "tokens_raw": raw(allt), "tokens_weighted": round(weighted), "output_tokens": allt[K[3]],
    "main_raw": raw(mt), "helpers_raw": raw(st), "models": " ".join(sorted(models)),
}
if dry:
    print("DRY RUN (not written):", row); sys.exit(0)
new = not os.path.exists(log_path)
with open(log_path, "a", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(row)); 
    if new: w.writeheader()
    w.writerow(row)
print("usage-log:", f"{row['tokens_raw']:,} raw / {row['tokens_weighted']:,} weighted tokens,",
      f"{mcalls} tool calls, {len(subs)} helpers, {mins} min → {log_path}")
