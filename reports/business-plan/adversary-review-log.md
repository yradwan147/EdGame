# Adversary Review Log — EdGame Seed Round

## Round 1 — Jennifer Carolan, Reach Capital

**To:** Reach Capital IC
**From:** Jennifer Carolan
**Re:** EdGame — pre-seed, $500K @ $4M pre, KAUST capstone team
**Date:** May 2026

---

I read the plan twice. There is real product here — five live games, a working telemetry pipeline, 90K events, and a public Railway demo are more than 90% of pre-seed decks I see. That earns the team a real read, not a polite pass. But this is a $4M pre with a 10x MOIC narrative from a capstone team in a geography I have zero pattern recognition in, and the deck systematically over-promises on the things that actually drive EdTech outcomes. Holes below.

### S1 — Deal-killers (must address or I pass)

**S1.1 — "[FOUNDER_NAME]" / "[CTO_BIO]" placeholders in the team section.**
The single most important page in a pre-seed deck is Section 8, and it is literally unfilled. I do not invest in templates. ClassDojo's Sam Chaudhary and Liam Don spent two years finding their motion together before we wrote a check; Newsela's Matthew Gross had ten years at a curriculum publisher before we backed him. Founder-market-fit is the entire pre-seed thesis. **Fix:** Replace every placeholder with real bios. Tell me which co-founder has taught K-12. Tell me who has shipped a B2B SaaS to schools before. If the answer is "nobody," tell me that and tell me which advisor compensates. Without this, the deck is unreadable for an investor.

**S1.2 — "10.8x MOIC base case" rests on a multiple, not on outcomes.**
Section 10.2 anchors the return story on "10x forward ARR per EdTech median." That number was true in 2021. In May 2026, public EdTech is trading at 4-6x revenue (your own Duolingo May-2026 comp at 4.8x in the table on lines 671-679 contradicts the 10x assumption in the same section). A Series A at 10x forward Y4 ARR of $5.94M would price the round at $59M post — which is delusional for a pre-revenue-at-seed team. **Fix:** Re-run MOIC at 4-6x forward ARR, show me bear/base/bull at *current* multiples, and tell me the truth: at honest multiples this is a 3-5x deal, not a 10x deal. I would rather back an honest 4x than a fictional 10x.

**S1.3 — GCC beachhead with zero GCC operating experience visible.**
Section 2.5 leans hard on KAUST + NEOM access. I have never funded a GCC company. The reason is not bias — it is that I cannot validate distribution from California. NEOM "earmarked $10B for education" (line 79) is a press-release number, not a procurement pipeline. GEMS raised from Brookfield because they had 30 years of operating history; that comp does not transfer to a 5-person team. **Fix:** I need a signed LOI or paid pilot from a GCC operator (KAUST School counts; GEMS/Taaleem/SABIS counts more) before I can underwrite the geography. "Access" is not traction.

**S1.4 — Five games shipped is the wrong KPI; one game with retained students is the right one.**
Section 9.1 leads with "5 live playable games, ~43,000 lines of code." This is a capstone-team metric, not an EdTech metric. Prodigy is one game. Duolingo is one product. Photomath (our portfolio) is one product. Five games at pre-seed signals scope-creep, not focus, and it dilutes the data moat the deck claims (Section 3.5) — five thin telemetry streams are weaker than one deep one. **Fix:** Tell me which of the five is your wedge. Show me 8-week retention on one cohort of real students playing that one game. I will take 50 retained students over 90K synthetic telemetry events every day.

### S2 — Material concerns (would need to be addressed in revised deck)

**S2.1 — "90,593 real telemetry events from automated and human playthroughs."**
Section 1 / 9.1. The word "automated" is doing enormous work in that sentence. Bot-generated events are not evidence of student engagement; they are evidence of a working pipeline. Be specific: how many of the 90K are from real children in real classrooms vs your own bots? My guess from the language is <5% human. **Fix:** Separate human vs synthetic in every traction stat. Report human-only N.

**S2.2 — Stealth-assessment efficacy claims rest on 2013/2016 meta-analyses, not your data.**
Section 2.3 cites Clark (2016) g=0.33 and Wouters (2013) d=0.29. Those are field-level effect sizes for game-based learning broadly, not for EdGame's instrument. Investors and ministries will read that as a sleight of hand. **Fix:** Commit to a small efficacy study by Q4 2027 (the roadmap mentions it on line 649 — make it a Series A gate, not a "nice to have") and stop implying the meta-analysis effect sizes are yours.

**S2.3 — The "Classcraft gap" thesis is overstated.**
Sections 1, 2.4, 4.3 lean on Classcraft's June-2024 shutdown as the market-opening event. Classcraft was a behavior-management/gamification layer, not a stealth-assessment platform — they are not the same buyer. A Change.org petition (line 73, citation 16) is not a market. ClassDojo (our portfolio) absorbed most of that displaced demand for free. **Fix:** Drop "Classcraft gap" as a hero argument. Replace with first-party demand evidence (teacher waitlist, pilot LOIs).

**S2.4 — LTV/CAC math is unfalsifiable at pre-revenue.**
Section 5.3 / line 605: "LTV/CAC = 5.4x school, 6.7x teacher." You have no paying customers. These are aspirational benchmarks copy-pasted from B2B SaaS reports, not measured unit economics. I have seen this exact slide from 100+ pre-seed EdTech decks; the realized numbers are universally worse. **Fix:** Reframe as "target unit economics, to be validated by month 12." Show the cohort math, not the steady-state ratio.

**S2.5 — Pricing strategy contradicts itself.**
Section 5.1 says "penetration pricing 60% below IXL, then raise 20-30%/year as the analytics moat compounds." Schools do not accept 20-30% annual price increases. Procurement cycles in K-12 are budget-bound and renew flat-to-+5%. This is the single most common pricing fantasy I see in EdTech decks. **Fix:** Model 3-7% annual increases. If the model breaks at honest pricing, the model is wrong.

**S2.6 — Six dimensions across five games is academic over-engineering.**
Section 3.2 / Appendix D. Six dimensions × ECD × BKT × xAPI × CASEL × PISA is what a dissertation looks like, not what a teacher uses on Monday morning. The dashboard description in Section 3.3 (one paragraph) is 1/20th the depth of the framework description. Teachers want "Maria needs help with fractions," not "Mastery probability ∈ [0.4, 0.8] — optimal learning zone." **Fix:** Cut to two dimensions for V1: cognitive mastery + engagement. Ship the SEL/social/strategic lenses in Year 2 only if teachers ask for them. PLG dies the moment your dashboard requires a PD session to interpret.

**S2.7 — Teacher-led PLG claimed but no PLG evidence shown.**
Section 6.2 / line 175 invokes our thesis ("teacher-led product-led growth") and the 3.8-month edu-SaaS CAC payback benchmark. Then where are your free signups? ClassDojo took three years and a hand-built network of 50 teacher evangelists to find PLG-fit. You have a free tier on paper, zero free users in the traction section. **Fix:** Launch the Teacher Basic tier this quarter and report weekly active free teachers by the time you re-pitch.

**S2.8 — Y5 $10.3M ARR built on 8 revenue streams.**
Section 5.2 + Appendix A.1 (lines 715-729) splits Y5 revenue across Teacher Pro, School Standard, School Premium, District, Parent Premium, After-School, OEM API, and Custom Dev. Eight bets at a 5-person company. Each line item is a different motion (PLG vs enterprise vs DTC vs B2B2C vs API), and each requires its own playbook. Your Y3 sales walkthrough on lines 219-227 already smuggles in "+$1.7M from parent/after-school/partner channels" with zero detail. **Fix:** Kill 4 of the 8 lines. Defend the remaining 4 with the channel motion plan that gets you there.

**S2.9 — Use-of-funds: only 25% to GTM at a stage where GTM is the bottleneck.**
Section 12.2 / lines 699-711. $200K (40%) to engineering, $125K (25%) to GTM. You already have shipped product. The risk at this stage is not "can we build it" — it is "can we sell it to schools." This allocation says the team is more comfortable engineering than selling, which matches the capstone-team pattern but is exactly what I expect to fail. **Fix:** Flip to 50/30 GTM/engineering. Or convince me why the product is not yet good enough to sell (which would itself be informative).

**S2.10 — Sales cycle assumption ("6-12 mo vs assumed 3-4 mo") is backwards.**
Section 11 / line 683 calls a 6-12 month cycle a *risk*. In US K-12 the median enterprise sales cycle is 9-15 months; GCC procurement is rarely faster. The plan's *base case* assumes 3-4 months, which is fantasy. The Phase-1 funnel on line 183 (100 → 60 → 40 → 15 in Year 1) is therefore not credible at the proposed runway. **Fix:** Re-base the model on 9-month cycles. Show me the cash impact and how Phase-1 founder-led BD compresses it.

### S3 — Nice-to-fix (would not block, but signals polish)

**S3.1 — Citation [28] and [29] literally read "(no source)" in the references (lines 477-479).**
For a deck that leans on credentialing, this is an own-goal on the compliance section that matters most to schools. Fix the citations.

**S3.2 — "5x engineering velocity from Claude API" (line 245).**
I love the tool. I do not love unverifiable velocity claims in a deck. Drop it or quantify it (cycle time before/after).

**S3.3 — "KAPLAY.js chosen over Phaser, 80KB vs 700KB" (line 235).**
A nice technical detail but it is in the investor deck, not the engineering wiki. Move to appendix. Investors do not buy bundle sizes.

**S3.4 — Figure references (Figures 1-14) without figures in the text version.**
Make sure the rendered PDF actually contains the figures. If they exist only as captions, that is a credibility hit on first read.

---

### Pattern-match summary

This deck is the strongest *artifact* in a capstone pre-seed I have seen recently — the public repo, the Railway demo, the telemetry CSVs are real and verifiable, and the team has clearly internalized the EdTech vocabulary (ECD, BKT, xAPI, CASEL). That is rare and meaningful. What it is *not* yet is an investable company. The pattern I am matching is "very capable students who have built impressive coursework and are now translating it into investor language" — which is closer to Photomath circa 2014 (also students, also strong artifact) than to ClassDojo circa 2011 (founders with a refined wedge and live teacher network). Photomath is in our portfolio; ClassDojo is in our portfolio; both took 18-30 months between artifact and Series A readiness.

### Current decision

**NEEDS REVISION.**

Conditions that would move me to WILLING TO INVEST (lead or follow):

1. Filled-in founder bios with at least one co-founder showing prior K-12 or B2B SaaS shipping experience, or a named operator-advisor with that experience and real time commitment.
2. One signed paid pilot LOI from a GCC operator (KAUST School + one of GEMS/Taaleem/SABIS/NEOM Schools) before close.
3. MOIC math re-run at honest 2026 EdTech multiples (4-6x ARR), with an honest 3-5x base-case story I can take to IC.
4. Choice of *one* wedge game with 8-week retention data from a real classroom cohort (n ≥ 30 human students, not bots).
5. Y5 revenue model collapsed from 8 streams to ≤4 defensible streams.
6. Use of funds rebalanced toward GTM (≥50%).

If 1-4 land in the next 90 days, I would do the work on a $3M pre / $500K SAFE with an MFN and a board observer seat. The 10x narrative will not survive my IC; a clean 3-5x with real GCC distribution moat *would*.

**Round 1 verdict: NEEDS REVISION**

---

## Round 1 — a16z General Partner

**Reviewer persona:** Senior GP at Andreessen Horowitz. Generalist seat — a16z has no dedicated EdTech fund, and Marc's AI-tutor musings are not a thesis. Mandate: return a $1.5B+ vehicle. Heuristics: ≥$10B TAM, defensibility via network effects or proprietary data, exceptional founder-market fit, 10x-better product, and venture-scale exit math. Indifferent to CASEL, ECD, or pedagogy frameworks that don't translate into distribution or moat.

**Severity scale:** S1 = pass-trigger (single issue is enough to kill the meeting); S2 = material (must be resolved before a second look); S3 = minor (fix-up before partner meeting).

### Opening read

This is more thoughtful than 90% of decks I see this week. Five live games, ~43K LOC, 90K telemetry events, a public Railway demo, an honest five-year P&L — that's real product hygiene at pre-seed. But "thoughtful" isn't the bar. The bar is: does this return the fund. On that question, the BP either dodges or argues itself into a corner. Reach already gave you the EdTech-specialist read — I'm going to give you the generalist tier-1 read, which is harsher because we don't get credit for category fluency, only for unicorns.

---

### S1 — Pass-triggers

**S1.1 — The 10x is a paper mark, not a return.**

> "Series A in month 24 returns 10.8x MOIC on the seed cheque; Series B at Year 5 returns 15.9x MOIC."

This is the part that bothers me most. 10.8x on a paper Series A markup is not a return — it's an unrealized NAV bump that depends on someone else paying 10x forward Year-4 ARR at month 24 when you have ~$1M ARR. The number a16z underwrites is **DPI at exit**, not interim markups. At $10.3M Year-5 ARR and a generous 10x revenue multiple at Year 7-8 exit, you are pitching a ~$100-150M outcome. Post seed + A + B dilution (your own model implies ~33% combined), seed proceeds on a $500K cheque cap out around $7-12M realized. That's a 14-24x MOIC for an angel — fine. But a16z's smallest fund (~$1.5B) needs **$150M+** of distributions from a single position to "matter." This deal cannot meaningfully move a tier-1 fund. **What would satisfy me:** rewrite §10 around realized exit math, not Series A markup. Show me the path to $100M+ ARR (not $10M) and a $1B+ outcome — or stop pitching tier-1 generalists and route to specialist seed funds where $20M outcomes return the vehicle.

**S1.2 — GCC beachhead is concentration risk dressed up as advantage.**

> "Our beachhead — GCC private K-12 — is a $3.02B market today growing to $4.47B by 2030… KAUST origin gives unique access to KAUST School + NEOM Schools as pilot anchors."

A $4B SAM is a beachhead, fine. But the BP treats GCC adjacency as a moat ("no Western EdTech founder can replicate"). For a16z, that's a feature for a $20M outcome and a bug for a $1B outcome — every dollar of GCC-specific advantage (Arabic content, PDPL residency, ministry relationships, Vision 2030 timing) is a dollar that doesn't transfer to the US market, which is where every K-12 venture-scale exit has actually happened (IXL, Prodigy, Kahoot's pre-take-private peak, Duolingo). You're building distribution muscle that doesn't compound into the only geography that produces unicorns in this category. The cultural-content gap (Arabic curriculum, Islamic-context word problems, Saudi national curriculum mapping) is the *opposite* of US-transferable. **What would satisfy me:** an honest "GCC is the cash-flowing wedge; US K-12 via Clever/Google Classroom is the venture story" framing — with the US plan as Section 1, not Section 6.3 Phase 2. Named US design partners, not "Clever Year 2."

**S1.3 — AI-displacement risk is hand-waved.**

> "Khan Academy / Duolingo / Google pivot into stealth assessment | Medium | High"

This is the single existential threat to the company and the BP buries it in row 4 of the risk table with a one-line mitigation about "data + curriculum + GCC distribution moats compound." That is not a serious answer. **Duolingo is down 79%** from peak because the market believes ChatGPT eats consumer language learning — your own comp table (line 673) acknowledges Duolingo trades at 4.8x today, not the 26x you reach for on the upside. Khan Academy's Khanmigo is free for educators. Google's LearnLM is targeting the same teacher dashboard you are. A generalist tier-1 has to ask: in a world where every teacher has a GPT-5-class tutor in the browser, why does a school district pay $6-14/student/year for stealth assessment instead of asking the LLM "which of my students is guessing?" The honest answer might exist (real-time multi-modal behavioral signal that an LLM cannot infer from text alone), but the BP doesn't make it. **What would satisfy me:** a dedicated section — not a risk-table row — that explains why the moat survives a 10x cheaper LLM-native competitor that ships in 2027. Show me what is *uniquely defensible* about your telemetry that a foundation model cannot synthesize.

**S1.4 — Capstone team is a founder-commitment red flag.**

> "Founder bandwidth (capstone status through Sep 2026) | Medium | Medium"

a16z does not invest in part-time founders. Period. Self-rating this risk "Medium/Medium" tells me the team doesn't yet appreciate the bar. If the four founders aren't 100% full-time at seed close, the deal is dead — Reach Capital is more generous on this than we are. Worse, the BP still lists `[FOUNDER_NAME]` and `[FOUNDER_BIO]` placeholders. For a tier-1 read, **founder-market fit *is* the deal**. We back the people first; the deck is downstream. **What would satisfy me:** named founders with real bios, signed full-time commitments effective at seed close (not Sep 2026), and explicit "who walks away from what other obligation" detail. If anyone is doing this part-time post-funding, I pass without a second meeting.

---

### S2 — Material

**S2.1 — "Data moat" is not a moat at venture scale.**

> "Each new student-week adds new training signal to our BKT models, our misconception classifiers, our engagement-decline detectors, and our SEL inference engine."

Every Series A deck in the last decade has claimed a data moat. The honest version is: data accumulation is a moat only when (a) the data is hard to replicate, (b) it has direct network effects on product quality, and (c) competitors structurally can't access equivalent signal. 22M events/year from 50 schools is rounding error compared to what Khan Academy, Duolingo, or any foundation-model player already touches. BKT is a 1995 algorithm — anyone can implement it. The novel signal here is multi-game cross-construct behavioral telemetry, but you haven't shown that this signal **predicts an outcome teachers will pay more for** vs. cheaper alternatives. **What would satisfy me:** a concrete data-flywheel diagram with numbers — at X events, classifier accuracy hits Y, which unlocks Z teacher behavior change, which drives N% retention uplift. Not vibes.

**S2.2 — No signaling from a real EdTech VC.**

> "Round structure: SAFE (Y-Combinator post-money) or priced equity, investor's preference."

No mention of Reach, Owl, NewSchools, GSV, or Learn Capital anchoring or even diligencing the round. For a $500K seed at $4M pre, you should be able to fill this round 3x over from the specialist syndicate if the story is real. The absence of a specialist lead is the loudest signal in the deck. a16z follows specialists into EdTech; we don't lead category bets we don't know. **What would satisfy me:** at least one named specialist EdTech fund as lead or co-lead with a signed term sheet, plus 1-2 named operator angels (ex-Kahoot, ex-Prodigy, ex-IXL — you literally list these as targets in §12.3, so go get them).

**S2.3 — Five games is product sprawl at pre-seed.**

> "5 playable browser games covering math, science, applied STEM, and SEL."

At pre-seed, focus is the asset. Five genres means none is depth-tested. Pulse Realms (3v3 arena), Knowledge Quest (RPG), Lab Explorer (sim) — wildly different design surfaces. Either one of them has 10x retention vs. the others (in which case kill four and double down) or none does (in which case you don't yet have product-market fit). The "portfolio covers all six dimensions" argument is a research framing, not a product strategy. Reach made the same point — I'll add the venture-scale version: a portfolio strategy is a Series C move, not a pre-seed move. **What would satisfy me:** session-frequency and 4-week retention data per game, willingness to sunset the bottom three, and a single wedge with a measured PMF signal.

**S2.4 — Unit economics are aspirational, not measured.**

> "School license (blended): ACV $3,400, CAC $6,500, LTV/CAC 5.4x (with NRR uplift), CAC payback 29 mo."

Zero paid schools as of May 2026 — every number in §5.3 is a forecast. 29-month CAC payback on the school channel is *not* "within Enterprise SaaS healthy zone" — it's exactly the kind of number that breaks at Series A when actual sales cycles run 9-12 months and renewals run 65%, not 85%. **What would satisfy me:** label every unit-economics number "forecast" vs "actual," and gate the Series A on 5-10 paid schools with 12-month measured CAC payback and NRR ≥100%.

**S2.5 — The "Classcraft gap" is overplayed.**

> "The behavioral-analytics-for-individual-teachers segment now has no strong incumbent."

Classcraft at peak had ~$10M ARR. HMH shut it down because the individual-teacher segment doesn't scale to district economics — which is exactly the market you're walking into. The "gap" is a feature for a small-business EdTech outcome, not a venture outcome. The reason a real incumbent didn't refill it is the unit economics don't support venture-grade growth at the individual-teacher tier. **What would satisfy me:** acknowledge that individual-teacher PLG is a top-of-funnel motion only, and that the venture story is districts + OEM. Then show the district plan with named pilots, not "Phase 3."

**S2.6 — TAM framing is misleading.**

> "Global game-based learning market is projected to grow from $13.17B in 2024 to $49.52B by 2035."

You're conflating game-based learning (Minecraft Education, Kahoot, Roblox EDU) with stealth assessment (a niche of a niche). Realistic SAM for paid behavioral-analytics K-12 platforms is probably $500M-$1B globally. That doesn't disqualify the deal, but the BP loses credibility quoting the wrong TAM. **What would satisfy me:** drop the $49B headline, replace with honest stealth-assessment SAM bounds and a defensible expansion path into adjacent EdTech SaaS.

---

### S3 — Minor

**S3.1 — Comp set leans on Kahoot at delisting (11.1x) and Duolingo at IPO (26x).** Both peak-of-cycle. Use today's median (4-6x ARR public, 8-10x private growth) for base case, save 10x+ for bull case.

**S3.2 — "AI tooling: Anthropic Claude API… ~5x engineering velocity."** This is a tooling choice, not a moat. Every competitor has the same access. Remove from defensibility narrative.

**S3.3 — KAPLAY.js bundle-size argument** (line 235) is engineering-wiki material. Investors don't buy bundle sizes. Cut from §7.1 narrative.

**S3.4 — Citations [28] and [29] are marked "(no source)" in Appendix B.** In a section about compliance, this is an own-goal.

**S3.5 — Year-5 revenue-per-FTE of $270K is mid-band, not best-in-class.** If you're selling a "lean, AI-leveraged" team, target $400K+ and show me the headcount math.

**S3.6 — Use-of-funds underweights GTM** at 25% when product is shipped and selling is the gating risk. Reach already flagged this; I concur, flip to ≥50% GTM.

---

### What I'd want before a second meeting

1. Revised §10 underwriting a $1B+ outcome on realized exit math, not Series A markup. If the answer is "this isn't a billion-dollar company," say so and route elsewhere.
2. US distribution plan with named design partners, not "Clever Year 2."
3. Dedicated AI-displacement section that survives a hostile read.
4. Named, full-time founders. No `[FOUNDER_NAME]` placeholders.
5. Named EdTech-specialist lead investor at terms.
6. Honest TAM, honest unit-economics labels (forecast vs measured), Series A gating metrics in writing.

### What I genuinely like

The repo is real. The telemetry is real. The 6-dimension framework is more rigorous than any "AI-powered learning" deck I've seen this cycle. The KAUST/NEOM access is non-trivial. If this team becomes full-time, raises a specialist-led seed, and gets to 10 paid schools with measured retention by month 12 — I would take a Series A meeting. But not the seed.

### Decision

**PASS at seed.** Generalist tier-1 doesn't lead pre-seed K-12, the round size is sub-scale for our fund, the team isn't full-time, and the venture-scale outcome math doesn't pencil at honest 2026 multiples. Refer to Reach, Owl, GSV. Track for Series A if they hit $1M+ ARR with measured unit economics and a named US channel.

**Round 1 verdict: PASS — revisit at Series A on real US traction.**
