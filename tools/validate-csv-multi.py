#!/usr/bin/env python3
"""Sanity check across all five sample-telemetry CSVs."""
import csv, os, collections, statistics

BASE = "/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture/reports/sample-telemetry"

GAMES = [
    ("Concept Cascade",     "telemetry_events.csv"),
    ("Pulse Realms",        "pulse_realms_events.csv"),
    ("Knowledge Quest",     "knowledge_quest_events.csv"),
    ("Lab Explorer",        "lab_explorer_events.csv"),
    ("Survival Equation",   "survival_equation_events.csv"),
]


def summarize(name, path):
    if not os.path.exists(path):
        print(f"\n=== {name} — FILE MISSING ({path}) ===")
        return
    rows = []
    with open(path) as f:
        for row in csv.DictReader(f):
            rows.append(row)
    size_mb = os.path.getsize(path) / 1024 / 1024
    sessions = set(r["session_id"] for r in rows)
    students = set(r["student_id"] for r in rows)
    print(f"\n=== {name} — {len(rows)} rows · {size_mb:.2f} MB ===")
    print(f"  sessions: {len(sessions)}   students: {len(students)}   "
          f"events/session avg: {len(rows)/max(1,len(sessions)):.1f}")

    types = collections.Counter(r["event_type"] for r in rows)
    print("  event types (top 10):")
    for t, c in types.most_common(10):
        print(f"    {t:35s} {c:6d}")

    qa = [r for r in rows if r["event_type"] == "question_answered"]
    if qa:
        print(f"  question_answered: {len(qa)}")
        by_persona = collections.defaultdict(lambda: [0, 0])
        for r in qa:
            by_persona[r["persona"]][0] += 1
            if r["correct"] == "true":
                by_persona[r["persona"]][1] += 1
        print("  persona accuracy:")
        for p, (total, correct) in sorted(by_persona.items()):
            pct = correct / total * 100 if total else 0
            print(f"    {p:25s} {correct:5d}/{total:5d} = {pct:5.1f}%")

        rts = [float(r["response_time_ms"]) for r in qa if r["response_time_ms"]]
        if rts:
            print(f"  response_time_ms — min:{min(rts):.0f} max:{max(rts):.0f} "
                  f"mean:{statistics.mean(rts):.0f} median:{statistics.median(rts):.0f}")


for name, fname in GAMES:
    summarize(name, os.path.join(BASE, fname))

print("\n=== Done ===")
