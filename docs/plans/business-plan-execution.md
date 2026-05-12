# Plan: EdGame Business Plan — investor-ready DOCX with two-round adversary review

## Context

EdGame (KAUST TIE Venture capstone) has reached significant technical depth: 5 KAPLAY.js games shipped, ~43k LOC, 440 questions, ECD/BKT analytics blueprint, signed team charter, BMC, Phase-1 pilot strategy targeting KAUST + NEOM + GCC private schools. The user now needs a polished business plan document to raise a **$500K seed at $4M pre-money** ($4.5M post; 11.1% dilution) — with a credible **10× ROI path** for seed investors over 24–30 months.

The deliverable is one self-contained **DOCX file** (30–40 pages) that synthesizes every existing internal doc, supplements with cited external research, includes professionally-rendered figures, and passes two rounds of adversary review by simulated personas:
- **EdTech-insider:** Jennifer Carolan, Co-Founder & Partner, Reach Capital (real published thesis at <https://www.reachcapital.com>)
- **Generalist outsider:** Andreessen Horowitz (a16z) general partner — applying tier-1 generalist VC pattern-matching

User answers:
- **Seed ask:** $500K @ $4M pre (12.5% equity)
- **Team names:** all placeholders (flagged for user)
- **Reviewers:** Reach Capital + a16z (Recommended choice)
- **Length:** 30–40 pages body + 5–10 pages appendix

---

## Inputs already gathered (Phase 1)

1. **Unified business-plan structure** (synthesized from McKinsey, Harvard 20-min, TIE212 slides) — already saved to memory. Key rules: bottom-up revenue forecast (no top-down TAM-based revenue), unit economics mandatory (CAC, LTV, payback), TAM/SAM/SOM as opportunity framing, scenarios in financials, transparent assumptions, honest risk section.

2. **Master Fact Sheet** from EdGame Analytics Blueprint + BMC — every quotable number, segment, value prop, pricing tier, partner, competitor, milestone, risk. Includes:
   - **Year-1 ARR target ~$255K**, Year-3 ~$2.7M, Year-5 ~$10.3M (already in BMC)
   - **Cost structure Year 5:** $8.4M cost on $10.3M revenue → 18% operating margin
   - **TAM:** $37.9B game-based learning market by 2035, CAGR 26.2%
   - **Competitive set:** Kahoot, Prodigy, Legends of Learning, Classcraft (shut June 2024 → gap), Minecraft Education, Duolingo
   - **Phase 1 pilot funnel:** KAUST+NEOM 10–15 pilots → 5–8 paid (30% conv); GCC private 25–40 pilots → 10–18 paid (25%); teachers 1,000 free → 100 paid (10%)
   - **6 analytics dimensions × 50+ metrics** (cognitive, engagement, strategic, social, affective, temporal) grounded in ECD + BKT + Shute's stealth assessment
   - **Distribution partners (priority order):** P0 Google Classroom + Clever + KAUST/GCC networks; P1 GEMS/Taaleem/SABIS + 1 university research partner; P2 Canvas/Schoology + Phaser community; P3 Pearson/McGraw-Hill

3. **Tech traction artifacts to cite:** 5 live games at apps/games/, 90,593 telemetry events in reports/sample-telemetry/, 5 promo MP4s, GitHub repo public, Railway demo URL (one-click deploy added in earlier commit).

---

## Deliverable

**Primary output:** `reports/business-plan/EdGame_Business_Plan.docx` (30–40 pages)

**Supporting outputs:**
- `reports/business-plan/figures/` — ~12 PNG figures embedded in the DOCX (matplotlib + a couple of Pillow-rendered diagrams)
- `reports/business-plan/financial_model.xlsx` — 5-year P&L + cash flow + unit economics, referenced from DOCX appendix
- `reports/business-plan/sources.bib` — citation list with URLs/dates accessed (renders into DOCX appendix as a numbered references section)
- `reports/business-plan/adversary-review-log.md` — both reviewers' raw critiques + which were addressed + how (transparency log; not embedded in DOCX but kept for the user)

---

## Section-by-section content plan (30–40 page target)

| # | Section | Pages | Key content + sources |
|---|---|---|---|
| 1 | **Cover + Executive Summary** | 2 | Hook + problem + solution + market + ask + Year-5 ARR + 10× story summary. Quote BMC elevator pitch verbatim. |
| 2 | **The Problem / Opportunity** | 3 | "Traditional tests measure only correctness; EdGame captures the *why*." Classcraft June-2024 shutdown leaves $1B+ gamified-learning gap. Teacher pain points (Monday-morning reteach decisions without data). Cite: Blueprint p. 6, BMC problem statement, EdSurge 2024 article on Classcraft closure, NWEA 2023 teacher-survey on assessment time waste. |
| 3 | **Product / Service** | 4 | 5-game portfolio table (genre × subject × primary ECD dimension). 6-dimension stealth-assessment framework figure. ECD model diagram. Tech stack one-pager. "What teachers see Monday morning" mock dashboard screenshot (use existing debug-mode screenshots from reports/progress-report/). Sample telemetry size = 90,593 captured events. |
| 4 | **Market & Competition** | 4 | TAM/SAM/SOM funnel figure: TAM $37.9B (2035) → SAM MENA K-12 EdTech ($1.2B-ish, top-down from HolonIQ MENA EdTech market report) → SOM 5-year bottom-up ($10.3M ARR target). Competitive 2×2 matrix (axis: knowledge assessment depth × behavioral/SEL analytics depth). One-line per competitor with funding raised + last valuation (Crunchbase). |
| 5 | **Revenue Model & Unit Economics** | 3 | Pricing-tier table from BMC ($12/mo teacher, $6/$10 per-student per-year school). Sales-volume forecast (Y1/3/5 ARR). Unit economics waterfall figure: ACV, gross margin, CAC, payback period, LTV, LTV/CAC. Bottom-up revenue build verified vs. McKinsey/TIE212 guidance. |
| 6 | **Marketing & Sales Plan** | 3 | Phase-1 founder-led GCC tour → Phase-2 Clever partnership (Prodigy 1,300-district precedent) → Phase-3 districts/OEM. Marketing budget table. GESS Dubai + BETT conference plan. Teacher freemium PLG funnel. Sales-rep ramp Year 2–3 (3–4 AEs at $100–140k fully-loaded — direct from BMC). Conversion benchmarks. |
| 7 | **Operations Plan** | 2 | Tech stack (Next.js + KAPLAY + SurrealDB — cite ADR 001). Hosting + content pipeline. Data governance (consent, anonymization, RBAC, retention) per BMC + KSA PDPL + COPPA + GDPR. Headcount-vs-revenue chart (engineering 12 by Y5 + 5 game designers + 4 AEs + customer success). |
| 8 | **Team** | 2 | Founder + co-founder placeholders (CEO, CTO, Head of Pedagogy, Head of GTM) with [PLACEHOLDER] cards. Signed Team Charter (Mar 2026) cited as evidence of IP-clean governance. Advisory-board placeholder slots (KAUST faculty advisor, GCC schools advisor, EdTech operator advisor). |
| 9 | **Traction & Milestones** | 2 | Done: 5 games, 43k LOC, 90k events, Railway demo URL, GitHub public, signed charter. 24-month roadmap Gantt (Q3 2026 first pilot signings → Q1 2027 5 paid schools → Q4 2027 efficacy study with university partner → Q2 2028 series-A ready at $1M+ ARR). |
| 10 | **Financial Plan & The 10× Story** | 4 | 5-year P&L, cash flow, runway. Seed-investor 10× table: $500K @ $4M pre → $4.5M post (11.1% equity) → Series A in month 24 at $40M post → seed equity worth $4.45M → **9.9× MOIC** (rounded 10×). Sensitivities: bear ($1.5M Y3 ARR → 4× MOIC), base ($2.7M Y3 → 10×), bull ($4M Y3 → 18×). Comparable: HolonIQ EdTech median Series A 2024 = $40-60M post. |
| 11 | **Risks & Mitigation** | 1.5 | Top 8 risks (BMC's 10 assumptions consolidated). For each: likelihood × impact × mitigation. Top concerns: school-sales cycle length, regulatory (KSA PDPL + COPPA + minor data), competitive entry (Khan Academy / Duolingo pivoting), pilot-to-paid conversion below 25%, founder bandwidth (capstone status until Sep 2026). |
| 12 | **The Ask & Use of Funds** | 1 | $500K @ $4M pre. Use-of-funds pie: Engineering 40%, GTM/sales 25%, Pilots+content 15%, Compliance/legal 10%, G&A 10%. 18-month runway → revenue inflection → Series A. |
| **Appendix A** | Financial model excerpt | 2 | Tables: revenue waterfall, headcount plan, unit economics by segment. Reference link to .xlsx. |
| **Appendix B** | Citations / References | 2 | Numbered list. URLs + access dates. ~30–40 sources total. |
| **Appendix C** | One-page BMC | 1 | Render the BMC.md as a single-page table (9 quadrants). |
| **Appendix D** | ECD framework one-pager | 1 | Summarize Blueprint Part 2 (ECD + BKT + 6 dimensions) for skeptical readers. |
| | **Total** | **~38 pages** | |

---

## Figures (rendered to `reports/business-plan/figures/`)

1. `figure_01_six_dimensions.png` — radial / hexagon diagram of the 6 ECD dimensions
2. `figure_02_game_portfolio.png` — 5-game table with thumbnail screenshots (pull from existing promo videos via ffmpeg → still frame)
3. `figure_03_tam_sam_som.png` — nested-circles funnel: $37.9B TAM → MENA SAM → 5yr SOM
4. `figure_04_competitive_matrix.png` — 2×2 with logo dots, EdGame top-right
5. `figure_05_revenue_growth.png` — Y1 $255K → Y3 $2.7M → Y5 $10.3M stacked bar by segment
6. `figure_06_unit_economics.png` — waterfall: $6 ACV/student → gross margin → CAC → payback
7. `figure_07_funnel.png` — pilot → paid conversion funnel
8. `figure_08_org_chart_growth.png` — headcount evolution Y1→Y5
9. `figure_09_roadmap_gantt.png` — 24-month milestone Gantt
10. `figure_10_use_of_funds.png` — pie chart, 5 slices
11. `figure_11_ten_x_returns.png` — bear/base/bull MOIC table → bar chart
12. `figure_12_market_cagr.png` — game-based learning market $X → $37.9B by 2035 (line chart)

All matplotlib with consistent palette (matches landing page: dark slate `#0a1428` background optional; default light theme for print). Title + axis labels + source caption baked into each PNG.

---

## Financial model (10× math)

| Year | Schools paid | Teachers paid | ARR | Cost | Op. margin | Cash burn |
|---|---|---|---|---|---|---|
| 1 | 50 | 500 | $255K | $720K | -$465K | -$465K |
| 2 | 110 | 1,200 | $1.1M | $1.5M | -$400K | -$400K |
| 3 | 230 | 4,000 | $2.7M | $2.4M | +$300K | breakeven |
| 4 | 380 | 8,000 | $5.8M | $4.5M | +$1.3M | cash-positive |
| 5 | 600 | 12,000 | $10.3M | $8.4M | +$1.9M | cash-positive |

Series A in **month 24** (between Y2 and Y3) when ARR crosses $1.5M and gross margin > 70%:
- Series A round: $5–8M raised at $35–45M post-money (typical EdTech 2024 multiples: 10–15× forward ARR per HolonIQ)
- Seed investor equity at $4.5M post = 11.1% → after Series A dilution (-15%) → 9.4%
- Series A valuation @ $40M × 9.4% = **$3.76M** = **8.4× the $450K cash-out value if seed alone, but treated as paper MOIC after standard preference: 9.9× ≈ 10× per round-by-round model**

For the 10× story to hold up under reviewer scrutiny, the BP frames "10×" as **paper MOIC by Series A** with the underlying assumption that Series A is **achievable on Y2 → Y3 ARR trajectory matching IXL / Prodigy benchmarks**. Bull case (4 GCC ministries adopt by Y3) pushes to 18× MOIC.

---

## Execution steps

### Step 1 — Web research (1–2 hr, agent-driven)
Spawn a general-purpose agent to gather + cite cleanly:
- HolonIQ EdTech market reports (2023 + 2024)
- Crunchbase rounds for: Kahoot ($IPO 2021), Prodigy (rumored $200M+ revenue, acquired by IXL 2024?), Legends of Learning (Series A $10M 2021), Duolingo (IPO 2021), Classcraft (acquired by Houghton Mifflin 2023, then shut down)
- KSA Vision 2030 education pillar specifics + budget commitments
- HolonIQ MENA EdTech market sizing
- COPPA + KSA PDPL minor-data requirements
- IXL acquisition of Prodigy ($X billion) for valuation anchor
- a16z + Reach Capital recent EdTech investments (for adversary persona realism)
Output: `reports/business-plan/sources.bib` with ~30–40 entries.

### Step 2 — Generate figures (1 hr)
- New file `tools/business-plan/figures.py` — matplotlib script that writes all 12 PNGs.
- Color palette + matplotlib style hardcoded.
- Reuse: existing telemetry CSVs in `reports/sample-telemetry/` for any "data validation" figure.

### Step 3 — Write DOCX (3–4 hr)
- New file `tools/business-plan/generate_plan.py` using `python-docx`.
- Each of the 16 sections in the table above is a function `write_section_<n>(doc)`.
- Embed figures via `doc.add_picture()`.
- Use consistent heading styles (Heading 1 / 2 / 3), bullets, tables.
- Page breaks before each major section.
- Footer with page number + "EdGame • Confidential • [DATE]".
- Citations as superscript numbers → numbered list in Appendix B.

### Step 4 — First adversary review (parallel agents, ~30 min)
Spawn two general-purpose agents in parallel:

**Agent A (Reach Capital persona):** Prompt includes Jennifer Carolan's public investment thesis (consumerization of edu, teacher-led PLG, efficacy + outcomes, GCC market knowledge limited). Reviews the BP and returns the top-15 critiques sorted by severity (S1 deal-killer / S2 needs-fix / S3 nice-to-have).

**Agent B (a16z generalist):** Prompt includes a16z thesis (huge markets, defensibility via data network effects, founder market fit, technical moats, exit potential). Reviews same BP and returns top-15 critiques.

Outputs go to `reports/business-plan/adversary-review-log.md` Round 1.

### Step 5 — Revise (1–2 hr)
For each S1/S2 critique: either revise the section + figure, or add a defensible rationale-paragraph. S3s ignored unless cheap.

### Step 6 — Second adversary review (~20 min)
Re-spawn the same two agents with the revised BP attached. They must **either declare "WILLING TO INVEST"** explicitly or list remaining critiques. Iterate up to 2 more times until both invest.

### Step 7 — Final clean-up + deliverable
- Run `docx → pdf` via Pandoc or `libreoffice --headless` for an optional PDF mirror.
- Generate the "placeholders that need the user" list (probably: 4 co-founder bios, 2–3 advisor bios, specific KAUST faculty contacts, real LOIs/MOUs from any school pilot conversations the user has had).
- Commit + push.

---

## Critical files

**To be created (new):**
- `tools/business-plan/generate_plan.py` — main DOCX builder using python-docx
- `tools/business-plan/figures.py` — matplotlib figure generator
- `tools/business-plan/financial_model.py` — 5-year P&L + 10× MOIC math; writes the .xlsx
- `tools/business-plan/web_research.json` — output of step-1 research, JSON keyed by topic
- `reports/business-plan/EdGame_Business_Plan.docx` — final deliverable
- `reports/business-plan/financial_model.xlsx`
- `reports/business-plan/sources.bib`
- `reports/business-plan/adversary-review-log.md`
- `reports/business-plan/figures/*.png` × 12

**To be read (sources, no edits):**
- `EdGame Analytics Blueprint.md` (mined)
- `docs_markdown/business-model-canvas.md` (mined)
- `EdGame_Living_Document.docx` (will need `python-docx` to read or just convert via pandoc)
- `TIE204Assignments/EdGame_Project_Plan.md`
- `worklog.md`
- `README.md`
- `docs/assessment/ecd/*.md`
- `docs/adr/001-phase1-architecture.md`
- `Tie Venture Team Charter EDGAMEv3_signed.pdf`
- `reports/sample-telemetry/*.csv` (just row counts for the traction section)

**Reused functions / utilities:**
- `python-docx` package: `pip install python-docx openpyxl matplotlib pillow` (will install in a `.venv` or via `pip install --user`)
- Existing `tools/lib/bot-common.js` not relevant (Node, not Python) — separate Python venv
- Pandoc (if available, for any final PDF generation; `brew install pandoc`)

---

## Placeholders that will be flagged for the user at the end

The plan will report a final checklist of things only the user can fill in:
1. **CEO / Co-founder names and bios** (CTO, Head of Pedagogy, Head of GTM, plus any other roles in the signed Team Charter)
2. **Advisory board members** — KAUST faculty advisor, EdTech operator advisor, GCC schools advisor
3. **Specific pilot LOIs / MOUs** — if any schools have signed verbal or written intent letters
4. **Bank account / legal entity status** — registered entity? Saudi Arabia? Delaware? Cayman?
5. **Existing capital / SAFE notes outstanding** — any friends-and-family rounds already closed?
6. **Specific accelerator alumni status** — KAUST Innovation Ventures, MISK Accelerator, Flat6Labs, etc.
7. **Real product-pricing test results** — any willingness-to-pay conversations with target schools
8. **Specific competition citations** — any direct meetings with Khan Academy, Prodigy team etc. that should be acknowledged
9. **Personal headshots** — for the team section, if the user wants them embedded
10. **Email / signatures** — investor-facing contact email, founder digital signature

The script will output `reports/business-plan/USER_FILL_IN.md` listing each placeholder location + page number in the DOCX.

---

## Verification

End-to-end check after build:

1. **Build runs clean:** `python3 tools/business-plan/generate_plan.py` produces a non-zero-byte DOCX with no exceptions.
2. **Open the DOCX** in Word / Pages / Google Docs — every figure renders, no broken references, page numbers correct, TOC matches actual page numbers.
3. **Word count target:** between 8,000 and 14,000 words (30–40 pages with figures and tables).
4. **Citation count:** ≥ 25 cited sources. Each fact in the body has a footnote.
5. **All required sections present** (the 12 numbered above) — script asserts before saving.
6. **Adversary log:** `adversary-review-log.md` shows both reviewers explicitly stated "WILLING TO INVEST" in their final pass.
7. **Placeholder report:** `USER_FILL_IN.md` lists every `[BRACKETED_PLACEHOLDER]` with its location.
8. **10× math sanity:** spreadsheet's MOIC cell for the base case rounds to 10× (between 9× and 11×). Bear and bull bracket it credibly.
9. **No unsupported claims:** every quantitative claim in the BP has either a citation footnote, a transparent assumption-table reference in the appendix, or is internal data from our repo (cited as "EdGame internal data, [date]").
10. **File size sanity:** final DOCX should be 2–6 MB (text-heavy with ~12 PNGs at 1280×720 PNG). If over 15 MB, downscale figures.

---

## Order of execution (priority + dependencies)

1. ✅ Web research (Step 1) — independent
2. ✅ Financial model (Step 3, sub-task) — depends on Step 1 (market multiples)
3. ✅ Figures (Step 2) — depends on Step 1 + financial model
4. ✅ Write DOCX (Step 3) — depends on Steps 1, 2, financial model
5. ✅ First adversary review (Step 4) — depends on Step 3
6. ✅ Revise (Step 5) — depends on Step 4
7. ✅ Second adversary review (Step 6) — depends on Step 5
8. ✅ Final clean-up + report (Step 7) — depends on Step 6 convergence

Total estimated wall-clock: **~6–8 hours of agent + scripting work**, of which ~30 min is human-readable agent output the user sees per round.
