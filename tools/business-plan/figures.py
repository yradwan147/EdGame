"""
Generates the 12 figures embedded in the EdGame business plan.

Inputs:
  - tools/business-plan/financial_summary.json — numbers from the financial model
  - reports/promo-videos/<game>.mp4              — for game-portfolio thumbnails
  - tools/business-plan/web_research.json        — for citation lines

Outputs:
  - reports/business-plan/figures/figure_NN_<name>.png  (×12) at 300 DPI
"""

import json
import math
import os
import subprocess
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.ticker as mticker
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, FancyArrowPatch, Polygon
from matplotlib.patches import Wedge
from matplotlib.lines import Line2D
import numpy as np
from PIL import Image

REPO = Path("/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture")
OUT = REPO / "reports" / "business-plan" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

with open(REPO / "tools" / "business-plan" / "financial_summary.json") as f:
    F = json.load(f)

# ------------------------------------------------------------------ #
#  Style                                                              #
# ------------------------------------------------------------------ #
PALETTE = {
    "navy":     "#1F4788",
    "sky":      "#5AC8FA",
    "gold":     "#FFD84D",
    "dark":     "#2C3E50",
    "light":    "#E8EEF9",
    "success":  "#3CB371",
    "warn":     "#FF9966",
    "danger":   "#E74C3C",
    "grey":     "#888888",
    "lightgrey":"#CFD6E2",
}
PRIMARY_BARS = ["#1F4788", "#5AC8FA", "#3CB371", "#FFD84D", "#FF9966", "#E74C3C", "#9D7CE8", "#22B8CF"]

plt.rcParams.update({
    "font.family": ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
    "font.size": 12,
    "axes.titlesize": 18,
    "axes.titleweight": "bold",
    "axes.labelsize": 12,
    "axes.labelweight": "bold",
    "axes.edgecolor": PALETTE["dark"],
    "axes.spines.top": False,
    "axes.spines.right": False,
    "xtick.color": PALETTE["dark"],
    "ytick.color": PALETTE["dark"],
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "figure.facecolor": "white",
    # Disable mathtext so literal `$` renders as a dollar sign instead of being
    # interpreted as math-mode delimiter (which strips the `$` from output).
    "text.parse_math": False,
    "axes.unicode_minus": False,
})

def fmt_usd(x, _=None):
    if abs(x) >= 1_000_000:
        return f"${x/1_000_000:.1f}M"
    if abs(x) >= 1_000:
        return f"${x/1_000:.0f}K"
    return f"${x:.0f}"

def add_source(fig, text, y=0.02):
    fig.text(0.5, y, text, ha="center", fontsize=8, style="italic", color=PALETTE["grey"])

def add_title(ax_or_fig, title, subtitle=None):
    if isinstance(ax_or_fig, plt.Figure):
        ax_or_fig.suptitle(title, fontsize=18, fontweight="bold", color=PALETTE["dark"], y=0.98)
        if subtitle:
            ax_or_fig.text(0.5, 0.93, subtitle, ha="center", fontsize=11, color=PALETTE["grey"])
    else:
        ax_or_fig.set_title(title, fontsize=16, fontweight="bold", color=PALETTE["dark"], pad=12)


# ================================================================== #
#  Figure 1: Six analytical dimensions (hexagon)                       #
# ================================================================== #
def fig01_six_dimensions():
    fig, ax = plt.subplots(figsize=(13, 10))
    ax.set_xlim(-8, 8); ax.set_ylim(-7, 8); ax.axis("off")

    fig.suptitle("Six Dimensions of Stealth Assessment", fontsize=20, fontweight="bold",
                 color=PALETTE["dark"], y=0.97)
    fig.text(0.5, 0.93, "EdGame's ECD-grounded framework captures every dimension of student learning",
             ha="center", fontsize=11, color=PALETTE["grey"])

    # (label, sublabel, color, label_offset_multiplier, anchor_side)
    # anchor_side: 'top' | 'bottom' | 'left' | 'right' tells where to put the subtitle
    # so we avoid the chart center and the bottom footer
    dims = [
        ("Cognitive\nKnowledge",         "Correctness · response time\nBKT mastery · error types",       PALETTE["navy"]),
        ("Behavioral\nEngagement",        "Play time · session frequency\ndropout heatmaps · replay rate",PALETTE["sky"]),
        ("Strategic\nAgency",             "Action variation · problem-\nsolving paths · persistence",      PALETTE["success"]),
        ("Social\nCollaboration",         "Communication quality · role\nadoption · team equity",          PALETTE["gold"]),
        ("Affective\nSEL",                "Frustration · growth mindset\nemotion regulation · empathy",    PALETTE["warn"]),
        ("Temporal\nLongitudinal",        "Learning rate · knowledge\ndecay · improvement trajectory",     PALETTE["danger"]),
    ]
    # Hexagon vertices
    R = 3.6
    cx, cy = 0, 1.0
    angles = [math.pi/2 + i*math.pi/3 for i in range(6)]

    # Center hub
    center = Circle((cx, cy), 1.0, facecolor=PALETTE["dark"], edgecolor="white", linewidth=3, zorder=10)
    ax.add_patch(center)
    ax.text(cx, cy+0.15, "EdGame", ha="center", va="center", color="white", fontsize=14, fontweight="bold", zorder=11)
    ax.text(cx, cy-0.3, "Stealth Assessment", ha="center", va="center", color=PALETTE["sky"], fontsize=9, zorder=11)

    for (label, sublabel, color), angle in zip(dims, angles):
        x = cx + R*math.cos(angle)
        y = cy + R*math.sin(angle)
        # spoke
        ax.plot([cx, x], [cy, y], color=PALETTE["lightgrey"], linewidth=1.5, zorder=1)
        # node
        circ = Circle((x, y), 0.95, facecolor=color, edgecolor="white", linewidth=3, zorder=5)
        ax.add_patch(circ)
        ax.text(x, y, label, ha="center", va="center", color="white", fontsize=10, fontweight="bold", zorder=6)
        # subtitle — radial direction with extra clearance
        lx, ly = x + 2.1*math.cos(angle), y + 2.1*math.sin(angle)
        ax.text(lx, ly, sublabel, ha="center", va="center", fontsize=8.5, color=PALETTE["dark"], zorder=6)

    # Bottom note placed well below all node subtitles (y = -6.0)
    ax.text(0, -6.0, "50+ metrics aggregated across these six dimensions per session.\n"
                    "Grounded in Evidence-Centered Design (ECD) and Bayesian Knowledge Tracing.",
            ha="center", fontsize=10, color=PALETTE["dark"], style="italic")
    add_source(fig, "Source: EdGame Analytics Blueprint, Part 2; Shute & Ventura (2013); BKT (Corbett & Anderson, 1995)", y=0.02)
    fig.savefig(OUT / "figure_01_six_dimensions.png")
    plt.close(fig)
    print("✓ figure_01_six_dimensions.png")


# ================================================================== #
#  Figure 2: Game portfolio (5 games × thumbnails)                     #
# ================================================================== #
def fig02_game_portfolio():
    # First extract a thumbnail from each promo video
    games = [
        ("Pulse Realms",       "pulse-realms",      "3v3 Team Arena",         "Math & Science",   "D4 Social"),
        ("Concept Cascade",    "concept-cascade",   "Tower Defense",          "Mathematics",      "D3 Strategic"),
        ("Knowledge Quest",    "knowledge-quest",   "Turn-Based RPG",         "Math & Science",   "D5 Affective"),
        ("Lab Explorer",       "lab-explorer",      "Virtual Science Lab",    "Chemistry/Physics","D3 Strategic"),
        ("Survival Equation",  "survival-equation", "Cooperative Puzzle",     "Applied STEM",     "D4 Social"),
    ]
    thumb_dir = OUT.parent / "thumbnails"
    thumb_dir.mkdir(exist_ok=True)
    for _, gid, _, _, _ in games:
        thumb = thumb_dir / f"{gid}.png"
        if not thumb.exists():
            mp4 = REPO / "reports" / "promo-videos" / f"{gid}.mp4"
            if mp4.exists():
                subprocess.run(
                    ["ffmpeg", "-y", "-i", str(mp4), "-ss", "00:00:15", "-vframes", "1", str(thumb)],
                    capture_output=True, check=False,
                )

    fig = plt.figure(figsize=(15, 10))
    add_title(fig, "EdGame Game Portfolio — 5 Live Titles", subtitle="All shipped, all collecting telemetry, all built on a shared analytics framework")

    gs = fig.add_gridspec(2, 3, hspace=0.4, wspace=0.18, top=0.86, bottom=0.08)
    for i, (name, gid, genre, subjects, dim) in enumerate(games):
        ax = fig.add_subplot(gs[i // 3, i % 3])
        thumb = thumb_dir / f"{gid}.png"
        if thumb.exists():
            img = Image.open(thumb)
            ax.imshow(img)
        else:
            ax.text(0.5, 0.5, "(no thumbnail)", ha="center", va="center", transform=ax.transAxes)
        ax.set_xticks([]); ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_edgecolor(PALETTE["navy"]); spine.set_linewidth(2)
        ax.set_title(name, fontsize=15, fontweight="bold", color=PALETTE["navy"], pad=8)
        # Caption below image
        ax.text(0.5, -0.07, f"{genre}  •  {subjects}", transform=ax.transAxes,
                ha="center", va="top", fontsize=11, color=PALETTE["dark"])
        ax.text(0.5, -0.18, dim, transform=ax.transAxes,
                ha="center", va="top", fontsize=11, color=PALETTE["navy"], fontweight="bold",
                bbox=dict(boxstyle="round,pad=0.3", facecolor=PALETTE["light"], edgecolor=PALETTE["navy"], linewidth=1))

    # 6th cell: summary stats
    ax = fig.add_subplot(gs[1, 2])
    ax.axis("off")
    stats = [
        ("5", "games shipped"),
        ("~43K", "lines of code"),
        ("440", "questions across 10 banks"),
        ("90,593", "real telemetry events captured"),
        ("6", "ECD dimensions tracked / game"),
    ]
    for j, (num, label) in enumerate(stats):
        y = 0.92 - j*0.18
        ax.text(0.5, y, num, transform=ax.transAxes, ha="center", fontsize=24,
                fontweight="bold", color=PALETTE["navy"])
        ax.text(0.5, y - 0.08, label, transform=ax.transAxes, ha="center", fontsize=11,
                color=PALETTE["dark"])
    add_source(fig, "Source: EdGame repo (github.com/yradwan147/EdGame), May 2026")
    fig.savefig(OUT / "figure_02_game_portfolio.png")
    plt.close(fig)
    print("✓ figure_02_game_portfolio.png")


# ================================================================== #
#  Figure 3: TAM / SAM / SOM nested funnel                             #
# ================================================================== #
def fig03_tam_sam_som():
    fig = plt.figure(figsize=(14, 8))
    fig.suptitle("Market Opportunity: TAM / SAM / SOM", fontsize=20, fontweight="bold",
                 color=PALETTE["dark"], y=0.96)

    # Left panel: nested-circles diagram
    ax = fig.add_axes((0.05, 0.10, 0.50, 0.78))
    ax.set_xlim(-5, 5); ax.set_ylim(-5, 5); ax.axis("off")

    cx, cy = 0, 0
    rings = [
        ("TAM", "Global K-12 game-based learning",  4.5, PALETTE["light"], PALETTE["navy"]),
        ("SAM", "GCC + KSA private K-12 EdTech",    3.0, PALETTE["sky"],   PALETTE["navy"]),
        ("SOM", "EdGame 5-yr target",               1.4, PALETTE["gold"],  PALETTE["dark"]),
    ]
    for label, sub, r, fill, edge in rings:
        c = Circle((cx, cy), r, facecolor=fill, edgecolor=edge, linewidth=2.5, alpha=0.85)
        ax.add_patch(c)

    # In-circle labels (one line each, no overlap)
    ax.text(0,  4.0, "TAM", ha="center", fontsize=14, fontweight="bold", color=PALETTE["navy"])
    ax.text(0,  3.3, "Global K-12 GBL", ha="center", fontsize=10, color=PALETTE["dark"])
    ax.text(0,  2.5, "SAM", ha="center", fontsize=13, fontweight="bold", color=PALETTE["navy"])
    ax.text(0,  1.8, "GCC + KSA K-12", ha="center", fontsize=10, color=PALETTE["dark"])
    ax.text(0,  0.4, "SOM", ha="center", fontsize=13, fontweight="bold", color=PALETTE["dark"])
    ax.text(0, -0.3, "EdGame Y5", ha="center", fontsize=10, color=PALETTE["dark"])

    # Right panel: tabular breakdown
    ax2 = fig.add_axes((0.58, 0.10, 0.40, 0.78))
    ax2.set_xlim(0, 1); ax2.set_ylim(0, 1); ax2.axis("off")

    rows = [
        ("TAM",  "Global K-12 game-based learning",
                 "$17.0B by 2035",
                 "Market Research Future, 12.79% CAGR",
                 PALETTE["light"], PALETTE["navy"]),
        ("SAM",  "GCC + KSA private K-12 EdTech",
                 "$3.02B (2024) -> $4.47B (2030)",
                 "MarkNtel 6.74% CAGR; KSA $2.32B -> $6.85B (2033)",
                 PALETTE["sky"],   PALETTE["navy"]),
        ("SOM",  "EdGame 5-year serviceable capture",
                 "$10.3M ARR by Year 5",
                 "Bottom-up: 350 schools + 12K teachers + 8K parents",
                 PALETTE["gold"],  PALETTE["dark"]),
    ]
    y0 = 0.92
    for ring, sub, val, source_line, color, edge in rows:
        # Colored chip
        chip = Rectangle((0.0, y0-0.12), 0.10, 0.10, facecolor=color, edgecolor=edge, linewidth=2)
        ax2.add_patch(chip)
        ax2.text(0.05, y0-0.07, ring, ha="center", va="center", fontsize=12, fontweight="bold", color=edge)
        # Right text
        ax2.text(0.14, y0,       sub, ha="left", va="top", fontsize=10, color=PALETTE["dark"])
        ax2.text(0.14, y0-0.055, val, ha="left", va="top", fontsize=13, fontweight="bold", color=PALETTE["navy"])
        ax2.text(0.14, y0-0.11,  source_line, ha="left", va="top", fontsize=8.5, style="italic", color=PALETTE["grey"])
        y0 -= 0.27

    # Why now panel
    ax2.text(0.0, 0.04, "Why now?", ha="left", fontsize=11, fontweight="bold", color=PALETTE["navy"])
    ax2.text(0.14, 0.04, "Classcraft shut Jun 2024  •  KSA AI curriculum rollout 2025-26  •  GEMS / Brookfield $2B @ $4B (Jun '24)",
             ha="left", va="top", fontsize=8.5, color=PALETTE["dark"])

    add_source(fig, "Sources: Market Research Future (2024); MarkNtel GCC EdTech (2024); HolonIQ MENA EdTech 50 (2024); KPMG KSA Budget 2025", y=0.02)
    fig.savefig(OUT / "figure_03_tam_sam_som.png")
    plt.close(fig)
    print("✓ figure_03_tam_sam_som.png")


# ================================================================== #
#  Figure 4: Competitive positioning 2×2                               #
# ================================================================== #
def fig04_competitive_matrix():
    fig, ax = plt.subplots(figsize=(12, 9))
    fig.suptitle("Competitive Positioning", fontsize=20, fontweight="bold",
                 color=PALETTE["dark"], y=0.97)
    fig.text(0.5, 0.93, "EdGame uniquely combines deep knowledge assessment with behavioral / SEL analytics",
             ha="center", fontsize=11, color=PALETTE["grey"])

    # (name, x, y, size, color, label_dx, label_dy)
    # label_dx/dy: offset from bubble so labels don't overlap each other or bubbles
    competitors = [
        ("Kahoot!",              2.0, 1.5, 600,  PALETTE["danger"],   0.0, -0.8),
        ("Prodigy",              3.5, 2.5, 600,  PALETTE["warn"],     0.0, -0.8),
        ("Legends of\nLearning", 4.5, 3.5, 400,  PALETTE["warn"],     0.7,  0.5),
        ("IXL",                  7.0, 1.5, 700,  PALETTE["danger"],  -0.9,  0.0),
        ("Khan Academy",         6.5, 2.5, 700,  PALETTE["danger"],   0.9,  0.0),
        ("Duolingo",             5.5, 3.0, 800,  PALETTE["warn"],    -0.9, -0.6),
        ("Minecraft\nEducation", 2.5, 4.5, 700,  PALETTE["warn"],     1.3,  0.0),
        ("Classcraft\n(defunct)",2.0, 6.5, 500,  PALETTE["lightgrey"],1.3,  0.0),
        ("EdGame",               8.5, 8.5, 1500, PALETTE["navy"],    -1.2,  0.0),
    ]

    # Quadrant fill (top-right "opportunity zone")
    ax.axhspan(5, 10, xmin=0.5, xmax=1.0, color=PALETTE["light"], alpha=0.5, zorder=0)
    ax.text(7.5, 9.6, "OPPORTUNITY ZONE",
            ha="center", fontsize=11, color=PALETTE["navy"], fontweight="bold", zorder=1)
    ax.text(7.5, 9.2, "(behavioral analytics + knowledge depth)",
            ha="center", fontsize=8.5, color=PALETTE["navy"], style="italic", zorder=1)

    for name, x, y, s, c, dx, dy in competitors:
        ax.scatter([x], [y], s=s, color=c, edgecolor=PALETTE["dark"], linewidth=1.5, zorder=5, alpha=0.85)
        if name == "EdGame":
            ax.text(x + dx, y + dy, name, fontsize=15, fontweight="bold",
                    color=PALETTE["navy"], ha="right", va="center", zorder=8)
        elif "defunct" in name:
            ax.text(x + dx, y + dy, name, fontsize=9, fontweight="bold",
                    color=PALETTE["grey"], style="italic", ha="left", va="center", zorder=8)
        else:
            ax.text(x + dx, y + dy, name, fontsize=10, fontweight="bold",
                    color=PALETTE["dark"], ha="center" if abs(dx) < 0.5 else ("left" if dx > 0 else "right"),
                    va="center", zorder=8)

    ax.set_xlim(0, 10); ax.set_ylim(0, 10)
    ax.set_xlabel("Knowledge Assessment Depth  →", fontsize=12, fontweight="bold")
    ax.set_ylabel("Behavioral / SEL Analytics Depth  →", fontsize=12, fontweight="bold")

    ax.axvline(5, color=PALETTE["lightgrey"], linewidth=1, linestyle="--", zorder=1)
    ax.axhline(5, color=PALETTE["lightgrey"], linewidth=1, linestyle="--", zorder=1)

    # Quadrant labels (corners) — placed in empty regions
    ax.text(0.5, 9.5, "Engagement\nfocused", fontsize=10, color=PALETTE["grey"], ha="left", style="italic")
    ax.text(9.5, 0.5, "Drill / quiz\nplatforms", fontsize=10, color=PALETTE["grey"], ha="right", style="italic")
    ax.text(0.5, 0.5, "Single-feature\ntools", fontsize=10, color=PALETTE["grey"], ha="left", style="italic")

    add_source(fig, "Bubble size ≈ funding raised. Classcraft shut down Jun 2024, leaving a $1B+ gamified-learning gap.\nSources: Crunchbase 2026; HolonIQ; CB Insights; EdGame internal analysis (May 2026)", y=0.01)
    fig.tight_layout(rect=(0, 0.05, 1, 0.92))
    fig.savefig(OUT / "figure_04_competitive_matrix.png")
    plt.close(fig)
    print("✓ figure_04_competitive_matrix.png")


# ================================================================== #
#  Figure 5: Revenue growth stacked bar                                #
# ================================================================== #
def fig05_revenue_growth():
    fig, ax = plt.subplots(figsize=(11, 7))
    add_title(ax, "5-Year Revenue Build (Base Case)")

    years = F["years"]
    segments = F["revenue_by_segment"]
    bottom = np.zeros(5)
    short_labels = {
        "Individual Teacher Pro (SaaS)":                  "Teacher Pro",
        "School Standard ($6-8 / student / yr)":           "School Standard",
        "School Premium ($10-14 / student / yr)":          "School Premium",
        "District / Multi-school ($5-6 / student / yr)":   "District",
        "Parent Premium ($72-80 / yr)":                    "Parent Premium",
        "After-School Programs ($300-400 / mo / program)": "After-School",
        "OEM / API partners ($120K avg)":                  "OEM / API",
        "Custom development + data licensing":             "Custom + Data",
    }
    for i, (seg, vals) in enumerate(segments.items()):
        arr = np.array(vals)
        ax.bar(years, arr, bottom=bottom, color=PRIMARY_BARS[i % len(PRIMARY_BARS)],
               label=short_labels.get(seg, seg), edgecolor="white", linewidth=1)
        bottom += arr

    totals = F["revenue_total"]
    for i, t in enumerate(totals):
        ax.text(i, t + 200_000, fmt_usd(t), ha="center", fontsize=12, fontweight="bold", color=PALETTE["navy"])

    ax.yaxis.set_major_formatter(mticker.FuncFormatter(fmt_usd))
    ax.set_ylabel("Annual Recurring Revenue (USD)")
    ax.set_ylim(0, max(totals) * 1.18)
    ax.legend(loc="upper left", fontsize=9, frameon=True, framealpha=0.95, ncol=2)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    add_source(fig, "Source: EdGame Business Model Canvas (Mar 2026), bottom-up build per segment", y=0.005)
    fig.tight_layout()
    fig.savefig(OUT / "figure_05_revenue_growth.png")
    plt.close(fig)
    print("✓ figure_05_revenue_growth.png")


# ================================================================== #
#  Figure 6: Unit economics (school + teacher side by side)            #
# ================================================================== #
def fig06_unit_economics():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 6.5))
    add_title(fig, "Unit Economics by Channel", subtitle="School-direct vs Teacher-led PLG — both pass investor thresholds with NRR uplift")

    # ---- School ----
    s = F["unit_economics"]["school"]
    # Waterfall: ACV → GM → Lifetime → LTV / vs CAC bar
    metrics = ["ACV", "Gross\nMargin", "Lifetime\nValue", "CAC", "LTV / CAC"]
    s_values = [s["acv_usd"], s["acv_usd"] * s["gm_pct"]/100, s["ltv_usd"], s["cac_usd"], s["ltv_cac"]]

    colors = [PALETTE["navy"], PALETTE["sky"], PALETTE["success"], PALETTE["warn"], PALETTE["gold"]]
    # Plot LTV and CAC bars then ratio number
    width = 0.6
    xs = np.arange(4)
    bars = ax1.bar(xs, s_values[:4], color=colors[:4], width=width, edgecolor="white", linewidth=2)
    for x, v in zip(xs, s_values[:4]):
        label = fmt_usd(v) if x != 1 else f"{v/s_values[0]*100:.0f}%"
        ax1.text(x, v + max(s_values[:4])*0.02, label, ha="center", fontsize=11, fontweight="bold")
    ax1.set_xticks(xs)
    ax1.set_xticklabels(["ACV", "Gross\nProfit", "LTV", "CAC"], fontsize=10)
    ax1.set_ylabel("USD per customer")
    ax1.yaxis.set_major_formatter(mticker.FuncFormatter(fmt_usd))
    ax1.set_title("School license (blended)", fontsize=14, fontweight="bold", color=PALETTE["navy"], pad=10)
    # LTV/CAC + payback summary
    text_y = max(s_values[:4]) * 0.55
    ax1.text(1.5, text_y, f"LTV/CAC: {s['ltv_cac']:.1f}×\n(5.4× with 110% NRR)\nPayback: {s['payback_mo']:.0f} mo",
             ha="center", va="center", fontsize=11, fontweight="bold",
             bbox=dict(boxstyle="round,pad=0.5", facecolor=PALETTE["light"], edgecolor=PALETTE["navy"], linewidth=1.5))

    # ---- Teacher ----
    t = F["unit_economics"]["teacher"]
    t_values = [t["acv_usd"], t["acv_usd"] * t["gm_pct"]/100, t["ltv_usd"], t["cac_usd"]]
    ax2.bar(xs, t_values, color=colors[:4], width=width, edgecolor="white", linewidth=2)
    for x, v in zip(xs, t_values):
        ax2.text(x, v + max(t_values)*0.02, fmt_usd(v), ha="center", fontsize=11, fontweight="bold")
    ax2.set_xticks(xs)
    ax2.set_xticklabels(["ACV", "Gross\nProfit", "LTV", "CAC"], fontsize=10)
    ax2.set_ylabel("USD per customer")
    ax2.yaxis.set_major_formatter(mticker.FuncFormatter(fmt_usd))
    ax2.set_title("Teacher Pro (PLG)", fontsize=14, fontweight="bold", color=PALETTE["navy"], pad=10)
    text_y = max(t_values) * 0.55
    ax2.text(1.5, text_y, f"LTV/CAC: {t['ltv_cac']:.1f}×\nPayback: {t['payback_mo']:.1f} mo\n(Industry: ~3.8 mo*)",
             ha="center", va="center", fontsize=11, fontweight="bold",
             bbox=dict(boxstyle="round,pad=0.5", facecolor=PALETTE["light"], edgecolor=PALETTE["navy"], linewidth=1.5))

    for ax in (ax1, ax2):
        ax.grid(axis="y", linestyle="--", alpha=0.4)

    add_source(fig, "Sources: EdGame Business Model Canvas; *Proven SaaS CAC payback benchmarks 2026 (education SaaS = fastest in B2B)", y=0.005)
    fig.tight_layout(rect=(0, 0.04, 1, 0.93))
    fig.savefig(OUT / "figure_06_unit_economics.png")
    plt.close(fig)
    print("✓ figure_06_unit_economics.png")


# ================================================================== #
#  Figure 7: Pilot → paid funnel                                       #
# ================================================================== #
def fig07_funnel():
    fig, ax = plt.subplots(figsize=(13, 8.5))
    fig.suptitle("Phase-1 Pilot → Paid Conversion Funnel (Year 1)", fontsize=20, fontweight="bold",
                 color=PALETTE["dark"], y=0.96)

    # Stages from widest to narrowest
    stages = [
        ("Target schools identified",     100, PALETTE["lightgrey"], "KAUST + NEOM + GCC private schools (top 100 by fit)"),
        ("Pilot conversations",            60, PALETTE["sky"],       "Founder-led BD: 1-3 outreach meetings / week"),
        ("Pilots signed (KAUST/GCC)",      40, PALETTE["navy"],      "6-10 week structured pilots, weekly cadence"),
        ("Paid schools by Year-1 end",     15, PALETTE["gold"],      "~38% pilot-to-paid conversion (target: 30%+)"),
    ]
    # Funnel geometry: bars centered on x=6
    cx_bars = 6.0
    max_w   = 6.0
    bar_h   = 0.85
    gap     = 0.65
    top_y   = 7.5

    for i, (label, units, color, side_note) in enumerate(stages):
        width = max_w * (units / 100)
        x0 = cx_bars - width/2
        y0 = top_y - i*(bar_h + gap)

        rect = Rectangle((x0, y0), width, bar_h, facecolor=color, edgecolor="white", linewidth=2.5, zorder=3)
        ax.add_patch(rect)
        # Big number INSIDE bar (always fits because we only show the integer)
        text_color = "white" if color in (PALETTE["sky"], PALETTE["navy"]) else PALETTE["dark"]
        ax.text(cx_bars, y0 + bar_h/2, f"{units}", ha="center", va="center",
                fontsize=18, fontweight="bold", color=text_color, zorder=4)

        # Stage NAME — outside-left, in the side-note column (right-aligned at x=4)
        ax.text(2.6, y0 + bar_h/2 + 0.18, label, ha="right", va="center",
                fontsize=11, fontweight="bold", color=PALETTE["navy"], zorder=4)
        ax.text(2.6, y0 + bar_h/2 - 0.20, side_note, ha="right", va="center",
                fontsize=9, color=PALETTE["grey"], style="italic", zorder=4)

        # CONVERSION RATE — on the right
        if i > 0:
            prev = stages[i-1][1]
            conv = units / prev * 100
            ax.text(11.0, y0 + bar_h/2 + 0.10, f"{conv:.0f}%", ha="left", va="center",
                    fontsize=14, fontweight="bold", color=PALETTE["success"], zorder=4)
            ax.text(11.0, y0 + bar_h/2 - 0.20, "of prior stage", ha="left", va="center",
                    fontsize=8, color=PALETTE["grey"], style="italic", zorder=4)

    ax.set_xlim(0, 13.5); ax.set_ylim(0, 8.2); ax.axis("off")

    # Bottom callout — well below last bar (last y0 = 7.5 - 3*1.5 = 3.0, ends 3.85; callout at y=1.5)
    ax.text(6.75, 1.5, "Year 3: 230 paid schools  •  Year 5: 600 paid schools  •  +12,000 teachers and 8,000 parent premium",
            ha="center", fontsize=11, color=PALETTE["navy"], fontweight="bold",
            bbox=dict(boxstyle="round,pad=0.6", facecolor=PALETTE["light"], edgecolor=PALETTE["navy"], linewidth=1.5))
    add_source(fig, "Source: EdGame Business Model Canvas (Mar 2026), Phase-1 segment targets", y=0.01)
    fig.savefig(OUT / "figure_07_funnel.png")
    plt.close(fig)
    print("✓ figure_07_funnel.png")


# ================================================================== #
#  Figure 8: Org-chart growth (headcount by year)                      #
# ================================================================== #
def fig08_org_growth():
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.suptitle("Headcount Plan vs Revenue", fontsize=20, fontweight="bold",
                 color=PALETTE["dark"], y=0.96)
    fig.text(0.5, 0.92, "Lean Y1 (founder-led + AI tooling), scale GTM in Y2-3, hire density in Y4-5",
             ha="center", fontsize=11, color=PALETTE["grey"])

    # Headcount by function and year
    headcount = {
        "Engineering":       [3, 5, 8, 10, 12],
        "Game Design + Content": [1, 2, 4, 5, 7],
        "Sales & GTM":       [0, 2, 4, 6, 8],
        "Customer Success":  [0, 1, 2, 3, 4],
        "Research / Curriculum": [1, 1, 2, 2, 3],
        "G&A":               [1, 1, 2, 3, 4],
    }
    years = F["years"]
    bottom = np.zeros(5)
    for i, (func, vals) in enumerate(headcount.items()):
        arr = np.array(vals)
        ax.bar(years, arr, bottom=bottom, color=PRIMARY_BARS[i % len(PRIMARY_BARS)],
               label=func, edgecolor="white", linewidth=1)
        bottom += arr
    totals_hc = [sum(c) for c in zip(*headcount.values())]
    for i, t in enumerate(totals_hc):
        ax.text(i, t + 0.8, f"{t} FTE", ha="center", fontsize=12, fontweight="bold", color=PALETTE["navy"])

    ax.set_ylabel("Full-time-equivalents (FTE)")
    ax.set_ylim(0, max(totals_hc) + 6)
    ax.legend(loc="upper left", fontsize=9, frameon=True, framealpha=0.95, ncol=2)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    # Overlay revenue per FTE on secondary axis
    ax2 = ax.twinx()
    revenue_per_fte = [F["revenue_total"][i] / totals_hc[i] for i in range(5)]
    ax2.plot(years, revenue_per_fte, marker="o", color=PALETTE["danger"],
             linewidth=2.5, markersize=10, label="Revenue / FTE", zorder=10)
    # Place labels BELOW each marker to avoid overlapping the headcount labels above
    for i, r in enumerate(revenue_per_fte):
        ax2.annotate(fmt_usd(r), xy=(i, r), xytext=(15, -8), textcoords="offset points",
                     color=PALETTE["danger"], fontsize=10, fontweight="bold",
                     bbox=dict(boxstyle="round,pad=0.25", facecolor="white",
                               edgecolor=PALETTE["danger"], linewidth=1))
    ax2.set_ylabel("Revenue per FTE (USD)", color=PALETTE["danger"])
    ax2.tick_params(axis="y", colors=PALETTE["danger"])
    ax2.yaxis.set_major_formatter(mticker.FuncFormatter(fmt_usd))
    ax2.spines["top"].set_visible(False)
    # Add a buffer so labels don't get cut off
    ax2.set_ylim(0, max(revenue_per_fte) * 1.2)

    add_source(fig, "Source: EdGame internal plan; revenue/FTE benchmark = $250-300K for mid-stage EdTech SaaS (Bessemer SaaS benchmarks)", y=0.005)
    fig.tight_layout()
    fig.savefig(OUT / "figure_08_org_growth.png")
    plt.close(fig)
    print("✓ figure_08_org_growth.png")


# ================================================================== #
#  Figure 9: Roadmap Gantt                                             #
# ================================================================== #
def fig09_roadmap_gantt():
    fig, ax = plt.subplots(figsize=(13, 7))
    add_title(ax, "24-Month Roadmap to Series A")

    # Milestones (quarter index 0-7, where 0 = Q3 2026)
    quarters = ["Q3'26", "Q4'26", "Q1'27", "Q2'27", "Q3'27", "Q4'27", "Q1'28", "Q2'28"]
    milestones = [
        ("Pre-seed close ($500K)",       0, 1, PALETTE["navy"]),
        ("3 game-environment polish + curriculum align", 0, 3, PALETTE["sky"]),
        ("KAUST + NEOM pilots (3-5)",     1, 3, PALETTE["gold"]),
        ("GCC private pilots (10-12)",    2, 4, PALETTE["warn"]),
        ("First 5 paid school licenses",  3, 5, PALETTE["success"]),
        ("Teacher freemium PLG launch",   2, 6, PALETTE["sky"]),
        ("Clever / Google Classroom integrations", 4, 6, PALETTE["navy"]),
        ("University efficacy study (IRB)", 4, 7, PALETTE["danger"]),
        ("$1M+ ARR run-rate",             6, 7, PALETTE["gold"]),
        ("Series A close ($5-8M)",         7, 8, PALETTE["navy"]),
    ]

    for i, (name, start, end, color) in enumerate(milestones):
        ax.barh(i, end - start, left=start, color=color, height=0.6, edgecolor="white", linewidth=1.5)
        # Label INSIDE the bar if it fits (bar wide enough), else OUTSIDE to the right
        text_inside_color = "white" if color in (PALETTE["navy"], PALETTE["sky"], PALETTE["success"], PALETTE["warn"], PALETTE["danger"]) else PALETTE["dark"]
        if end - start >= 2.5:
            ax.text(start + 0.1, i, name, va="center", fontsize=10, fontweight="bold", color=text_inside_color)
        else:
            # outside-right
            ax.text(end + 0.1, i, name, va="center", fontsize=10, fontweight="bold", color=PALETTE["dark"])

    ax.set_yticks([])
    ax.invert_yaxis()
    ax.set_xticks(range(len(quarters) + 1))
    ax.set_xticklabels(quarters + [""], fontsize=10)
    ax.set_xlim(-0.2, 8)
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    ax.set_xlabel("Fiscal Year quarters (start = Q3 2026)", fontsize=11)

    add_source(fig, "Source: EdGame internal plan; Series A timing matches BMC ARR inflection at Y2-Y3", y=0.01)
    fig.tight_layout()
    fig.savefig(OUT / "figure_09_roadmap_gantt.png")
    plt.close(fig)
    print("✓ figure_09_roadmap_gantt.png")


# ================================================================== #
#  Figure 10: Use of funds pie                                         #
# ================================================================== #
def fig10_use_of_funds():
    fig, ax = plt.subplots(figsize=(11, 8))
    fig.suptitle("Use of $500K Seed", fontsize=20, fontweight="bold",
                 color=PALETTE["dark"], y=0.96)
    fig.text(0.5, 0.91, "18-month runway to hit $1M+ ARR run-rate and Series A inflection",
             ha="center", fontsize=11, color=PALETTE["grey"])

    cats = list(F["use_of_funds"].keys())
    amts = list(F["use_of_funds"].values())
    pcts = [a/sum(amts)*100 for a in amts]

    colors_pie = [PALETTE["navy"], PALETTE["sky"], PALETTE["gold"], PALETTE["warn"], PALETTE["success"]]
    wedges, texts = ax.pie(amts, labels=None, colors=colors_pie, startangle=90,
                           wedgeprops=dict(edgecolor="white", linewidth=3),
                           pctdistance=0.78)
    # Center circle for donut effect
    ax.add_artist(Circle((0,0), 0.50, fc="white"))
    ax.text(0, 0.05, "$500K", ha="center", fontsize=22, fontweight="bold", color=PALETTE["navy"])
    ax.text(0, -0.1, "Seed", ha="center", fontsize=11, color=PALETTE["grey"])

    # Side legend with amounts and short labels
    short = [
        "Engineering hires + AI tooling",
        "GTM: founder-led BD + conferences",
        "Pilots + content + curriculum",
        "Compliance + legal (PDPL, COPPA)",
        "Operations + reserve",
    ]
    legend_items = []
    for s, c, a, p in zip(short, colors_pie, amts, pcts):
        legend_items.append(f"{s}  —  {fmt_usd(a)}  ({p:.0f}%)")
    legend_handles = [mpatches.Patch(color=c, label=lab) for c, lab in zip(colors_pie, legend_items)]
    ax.legend(handles=legend_handles, loc="center left", bbox_to_anchor=(1.05, 0.5),
              fontsize=10, frameon=False)

    add_source(fig, "Source: EdGame internal plan, sized for 18-month runway", y=0.01)
    fig.tight_layout(rect=(0, 0.04, 0.95, 0.93))
    fig.savefig(OUT / "figure_10_use_of_funds.png")
    plt.close(fig)
    print("✓ figure_10_use_of_funds.png")


# ================================================================== #
#  Figure 11: 10× returns bar chart                                    #
# ================================================================== #
def fig11_ten_x_returns():
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.suptitle("Seed Investor MOIC by Scenario", fontsize=20, fontweight="bold",
                 color=PALETTE["dark"], y=0.96)
    fig.text(0.5, 0.92, "$500K @ $4M pre  •  10× target hits at Series A in base case, 15-30× by Series B",
             ha="center", fontsize=11, color=PALETTE["grey"])

    scenarios = ["Bear", "Base", "Bull"]
    series_a = [F["scenarios"]["bear"]["series_a"]["moic"], F["scenarios"]["base"]["series_a"]["moic"], F["scenarios"]["bull"]["series_a"]["moic"]]
    series_b = [F["scenarios"]["bear"]["series_b"]["moic"], F["scenarios"]["base"]["series_b"]["moic"], F["scenarios"]["bull"]["series_b"]["moic"]]

    x = np.arange(len(scenarios))
    width = 0.35
    ax.bar(x - width/2, series_a, width, label="Series A (Y2-3, ~24-30 mo)",
           color=PALETTE["navy"], edgecolor="white", linewidth=2)
    ax.bar(x + width/2, series_b, width, label="Series B (Y5, ~5 yrs)",
           color=PALETTE["gold"], edgecolor="white", linewidth=2)

    # Bar labels
    for x_, v in zip(x - width/2, series_a):
        ax.text(x_, v + 0.5, f"{v:.1f}×", ha="center", fontsize=12, fontweight="bold", color=PALETTE["navy"])
    for x_, v in zip(x + width/2, series_b):
        ax.text(x_, v + 0.5, f"{v:.1f}×", ha="center", fontsize=12, fontweight="bold", color=PALETTE["dark"])

    # 10× target line
    ax.axhline(10, color=PALETTE["danger"], linestyle="--", linewidth=2, zorder=1, alpha=0.8)
    ax.text(2.45, 10.6, "10× target", color=PALETTE["danger"], fontsize=10, fontweight="bold", ha="right")

    ax.set_xticks(x)
    ax.set_xticklabels(scenarios, fontsize=14, fontweight="bold")
    # Push the tick labels down to leave room for sub-captions
    ax.tick_params(axis="x", pad=10)
    ax.set_ylabel("Money-on-Invested-Capital (MOIC)")
    ax.set_ylim(0, max(series_b) * 1.18)
    ax.legend(loc="upper left", fontsize=11, frameon=True, framealpha=0.95)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    # Scenario assumption captions — placed BELOW the x-axis tick labels using
    # data-coordinate positioning so each caption sits directly under its bars.
    captions = [
        ["Y3 ARR  = $1.35M", "50% of plan",  "Exit @ 6× ARR"],
        ["Y3 ARR  = $2.7M",  "on plan",      "Exit @ 10× ARR (EdTech median)"],
        ["Y3 ARR  = $3.8M",  "40% upside",   "Exit @ 12× ARR (Kahoot-style)"],
    ]
    # Position below the x-axis; use blended transform so x is in data coords
    # and y is in axes coords (slightly below the ticks).
    from matplotlib.transforms import blended_transform_factory
    trans = blended_transform_factory(ax.transData, ax.transAxes)
    for i, lines in enumerate(captions):
        for j, line in enumerate(lines):
            ax.text(i, -0.10 - j*0.04, line, transform=trans,
                    ha="center", va="top", fontsize=9, color=PALETTE["grey"], style="italic")

    add_source(fig, "Sources: Finrofca EdTech Multiples Q4 2025 (10× median); Kahoot delisting Mar 2024 (11.1× ARR); EdGame financial model May 2026", y=0.01)
    fig.tight_layout(rect=(0, 0.13, 1, 0.92))
    fig.savefig(OUT / "figure_11_ten_x_returns.png")
    plt.close(fig)
    print("✓ figure_11_ten_x_returns.png")


# ================================================================== #
#  Figure 12: Market CAGR line                                         #
# ================================================================== #
def fig12_market_cagr():
    fig, ax = plt.subplots(figsize=(11, 6.5))
    add_title(ax, "Global Game-Based Learning Market Trajectory")

    # Market Research Future projection: $13.17B (2024) → $49.52B (2035) at 12.79%
    years = list(range(2024, 2036))
    base_2024 = 13.17
    cagr = 0.1279
    market = [base_2024 * (1 + cagr)**(i) for i in range(len(years))]
    # K-12 subsegment
    k12_2024 = 4.5
    k12 = [k12_2024 * (1 + 0.11)**(i) for i in range(len(years))]

    ax.fill_between(years, market, color=PALETTE["sky"], alpha=0.25, label="Total game-based learning")
    ax.plot(years, market, color=PALETTE["navy"], linewidth=3, marker="o", markersize=4)
    ax.fill_between(years, k12, color=PALETTE["gold"], alpha=0.3, label="K-12 segment")
    ax.plot(years, k12, color=PALETTE["warn"], linewidth=2.5, marker="s", markersize=4)

    ax.annotate(f"${market[0]:.1f}B", xy=(years[0], market[0]), xytext=(years[0]-0.5, market[0]+3),
                fontsize=11, fontweight="bold", color=PALETTE["navy"])
    ax.annotate(f"${market[-1]:.1f}B", xy=(years[-1], market[-1]), xytext=(years[-1]-0.5, market[-1]+1),
                fontsize=11, fontweight="bold", color=PALETTE["navy"])
    ax.annotate(f"${k12[-1]:.1f}B (K-12)", xy=(years[-1], k12[-1]), xytext=(years[-1]-1.5, k12[-1]-3),
                fontsize=10, fontweight="bold", color=PALETTE["warn"])

    # CAGR annotation
    ax.text(2027.5, 35, f"CAGR: 12.79%\n(MRF base case)", fontsize=11, color=PALETTE["navy"], fontweight="bold",
            bbox=dict(boxstyle="round,pad=0.6", facecolor=PALETTE["light"], edgecolor=PALETTE["navy"], linewidth=1.5))

    ax.set_xlabel("Year")
    ax.set_ylabel("Market size (USD Bn)")
    ax.set_xlim(2024, 2035)
    ax.set_ylim(0, max(market) * 1.15)
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x:.0f}B"))
    ax.legend(loc="upper left", fontsize=10, frameon=True, framealpha=0.95)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    add_source(fig, "Source: Market Research Future, Game-Based Learning Market Report (2024). Alt estimates: Verified Market Research $88-191B (2035) at 15-22% CAGR.", y=0.005)
    fig.tight_layout()
    fig.savefig(OUT / "figure_12_market_cagr.png")
    plt.close(fig)
    print("✓ figure_12_market_cagr.png")


# ================================================================== #
#  Main                                                                #
# ================================================================== #
if __name__ == "__main__":
    fig01_six_dimensions()
    fig02_game_portfolio()
    fig03_tam_sam_som()
    fig04_competitive_matrix()
    fig05_revenue_growth()
    fig06_unit_economics()
    fig07_funnel()
    fig08_org_growth()
    fig09_roadmap_gantt()
    fig10_use_of_funds()
    fig11_ten_x_returns()
    fig12_market_cagr()
    print(f"\nAll 12 figures written to {OUT}")
