# EdGame – Bill of Materials v2.0

**Document Version:** 2.0  
**Status:** Order-Ready (Phased)  
**Last Updated:** February 2026

This document provides a complete, order-ready Bill of Materials for EdGame infrastructure, software licenses, and services. Unlike the original BoM (which specified $605K Year 1 costs for enterprise infrastructure), this version aligns with our phased architecture strategy: **start lean, scale when usage demands it.**

---

## 1. Executive Summary

| Category | Year 1 Total | Monthly Avg | Notes |
|---|---|---|---|
| **Cloud Infrastructure** | $5,400 | $450 | Supabase + Vercel (Phase 1 stack) |
| **Software Licenses** | $3,600 | $300 | AI tools, dev tools, SaaS |
| **Third-Party Services** | $1,800 | $150 | Email, analytics, integrations |
| **Contractors (Game Art)** | $36,000 | $3,000 | Part-time 2D artist |
| **Marketing & Travel** | $10,000 | ~$830 | GCC school visits, conferences |
| **Total Year 1** | **~$57,000** | **~$4,750** | **90% lower than original** |

**Why the dramatic reduction?**
- Original BoM assumed AWS EKS, Kafka, Spark, 35-person team from Day 1
- This BoM follows successful EdTech playbook: start simple, scale when needed
- Supabase + Vercel handles 50K+ MAU before requiring migration

---

## 2. Cloud Infrastructure (Year 1)

### 2.1 Primary Stack: Supabase + Vercel

| Service | Plan | Monthly | Annual | What We Get |
|---|---|---|---|---|
| **Supabase** | Pro | $25 | $300 | PostgreSQL (8GB), Auth, Realtime, Storage, 500K MAU, daily backups |
| **Vercel** | Pro | $20 | $240 | Unlimited deploys, Edge Functions, 100GB bandwidth, Analytics |
| **Cloudflare** | Free | $0 | $0 | DNS, CDN, DDoS protection, SSL |
| **Upstash Redis** | Free → Pay-as-go | $0-30 | $0-360 | Rate limiting, caching (free to ~10K commands/day) |
| **Year 1 Total** | | **$45-75** | **~$900** | |

### 2.2 Phase 2 Additions (When Triggered)

These are NOT ordered in Year 1 unless migration triggers are hit:

| Service | Trigger | Monthly | Purpose |
|---|---|---|---|
| **SpacetimeDB** | Multiplayer launch | $200-500 | Real-time game state sync |
| **Supabase Team** | >50K MAU | $599 | More connections, dedicated support |
| **Vercel Enterprise** | >100K requests/day sustained | Custom | Higher limits, SLA |
| **AWS (EC2/RDS)** | Enterprise compliance | $2,000+ | Self-managed infrastructure |

### 2.3 Phase 3 Additions (Year 3+)

| Service | Trigger | Monthly | Purpose |
|---|---|---|---|
| **AWS EKS** | >50K concurrent, SLA requirements | $3,000+ | Container orchestration |
| **AWS MSK (Kafka)** | Real-time streaming analytics | $1,500+ | Event streaming |
| **Snowflake/BigQuery** | >1M events/day, complex analytics | $1,000+ | Data warehouse |
| **AWS ElastiCache** | High-throughput caching | $500+ | Managed Redis cluster |

**Year 1 infrastructure remains at ~$900 total** — we don't pre-purchase capacity we don't need.

---

## 3. Software Licenses

### 3.1 AI Development Tools

| Tool | Plan | Users | Monthly/User | Annual Total | Purpose |
|---|---|---|---|---|---|
| **Cursor Pro** | Pro | 2 | $20 | $480 | AI-native IDE with multi-file editing |
| **Claude Pro** | Pro | 2 | $20 | $480 | Long-context reasoning, architecture |
| **GitHub Copilot** | Individual | 2 | $10 | $240 | Inline code completion |
| **Subtotal** | | | | **$1,200** | |

### 3.2 Development & Collaboration

| Tool | Plan | Users | Monthly | Annual | Purpose |
|---|---|---|---|---|---|
| **GitHub** | Team | 2 | $4/user | $96 | Repos, Actions, Issues |
| **Linear** | Free | 2 | $0 | $0 | Project management |
| **Figma** | Free (Starter) | 2 | $0 | $0 | Design, prototyping |
| **Notion** | Free | 2 | $0 | $0 | Documentation, wiki |
| **1Password** | Teams | 2 | $8 (total) | $96 | Secrets management |
| **Subtotal** | | | | **$192** | |

### 3.3 Game Development

| Tool | License | Cost | Purpose |
|---|---|---|---|
| **Phaser 3** | MIT (Free) | $0 | Game engine |
| **Tiled** | Free | $0 | Level/map editor |
| **Aseprite** | One-time | $20 | Pixel art creation |
| **TexturePacker** | One-time | $40 | Sprite sheet generation |
| **Audacity** | Free | $0 | Audio editing |
| **Subtotal** | | **$60** | One-time purchases |

### 3.4 Asset Packs (One-Time)

| Source | Type | Budget |
|---|---|---|
| **itch.io** | 2D game assets, UI kits | $200 |
| **Humble Bundle** | Game dev asset bundles | $50 |
| **Kenney.nl** | Free CC0 assets | $0 |
| **Subtotal** | | **$250** |

**Year 1 Software Total: ~$1,700**

---

## 4. Third-Party Services

### 4.1 Email & Communications

| Service | Plan | Monthly | Annual | Purpose |
|---|---|---|---|---|
| **Resend** | Free → Pro | $0-20 | $0-240 | Transactional email (assignments, reports) |
| **Google Workspace** | Business Starter | $7/user | $168 | Professional email (optional) |
| **Subtotal** | | | **$168-408** | |

### 4.2 Analytics & Monitoring

| Service | Plan | Monthly | Annual | Purpose |
|---|---|---|---|---|
| **PostHog** | Free | $0 | $0 | Product analytics (1M events/mo) |
| **Sentry** | Free | $0 | $0 | Error tracking (5K errors/mo) |
| **Vercel Analytics** | Included | $0 | $0 | Web vitals |
| **Subtotal** | | | **$0** | |

### 4.3 Payments & Billing

| Service | Model | Cost | Notes |
|---|---|---|---|
| **Stripe** | Pay-as-you-go | 2.9% + $0.30/txn | Only pay when we charge customers |
| **Stripe Atlas** | One-time | $500 | Delaware C-Corp formation (optional) |

### 4.4 Authentication & Integrations

| Service | Plan | Cost | Purpose |
|---|---|---|---|
| **Supabase Auth** | Included | $0 | Auth is part of Supabase |
| **Google Cloud** | Free tier | $0 | OAuth, Classroom API (free for education) |
| **Clever** | Partner | $0 | Free for EdTech vendors |

**Year 1 Third-Party Total: ~$500-1,000**

---

## 5. Contractors & Services

### 5.1 Game Art (Critical Hire)

| Role | Rate | Hours/Month | Monthly | Annual |
|---|---|---|---|---|
| **2D Game Artist** | $50/hr avg | 60 | $3,000 | $36,000 |

**Scope**: Character sprites, backgrounds, UI elements, animations for 3 Phase 1 game environments (Math Arena, Chemistry Lab, Physics Simulation).

**Where to find**:
- ArtStation (high quality)
- Upwork (vetted freelancers)
- Fiverr Pro (fast turnaround)
- Game dev Discords (indie-friendly)

### 5.2 Optional Contractors

| Role | Rate | When to Hire | Annual Budget |
|---|---|---|---|
| **Sound Designer** | $40/hr | When environments need audio | $2,000 |
| **Curriculum Consultant** | $75/hr | Standards alignment review | $3,000 |
| **Legal Review** | $300/hr | Privacy policy, ToS | $1,500 |

**Year 1 Contractor Total: ~$36,000 (game artist) + $6,500 (optional) = $42,500 max**

---

## 6. Marketing & Sales (Year 1)

### 6.1 Conferences

| Event | Location | Date | Cost | Purpose |
|---|---|---|---|---|
| **GESS Dubai** | UAE | March | $3,000 | Demo booth, GCC school leads |
| **BETT UK** | London | January | $4,000 | UK school leads (attend, no booth) |
| **EdTechX** | Virtual | June | $500 | Networking |
| **Subtotal** | | | **$7,500** | |

### 6.2 Travel (GCC School Visits)

| Item | Unit Cost | Quantity | Total |
|---|---|---|---|
| **Flights (Saudi/UAE)** | $300 | 6 trips | $1,800 |
| **Hotels** | $150/night | 12 nights | $1,800 |
| **Ground transport** | $50/day | 12 days | $600 |
| **Subtotal** | | | **$4,200** | |

### 6.3 Content & Community

| Item | Cost | Purpose |
|---|---|---|
| **Teacher community gifts** | $500 | Pilot teacher appreciation |
| **Content creation tools** | $200 | Canva Pro, Loom |
| **Subtotal** | **$700** | |

**Year 1 Marketing Total: ~$12,400**

---

## 7. One-Time Setup Costs

| Item | Cost | Notes |
|---|---|---|
| **Domain registration** | $30 | edgame.io or similar (.io premium) |
| **LLC/C-Corp formation** | $500 | Stripe Atlas or state filing |
| **Privacy policy generator** | $0 | Termly free tier |
| **Apple Developer Account** | $99 | Required for iOS app (Phase 2) |
| **Google Play Developer** | $25 | Required for Android (Phase 2) |
| **Trademark search** | $300 | Basic search before brand commit |
| **Total** | **~$950** | |

---

## 8. Year 1 Budget Summary

### Quarterly Breakdown

| Category | Q1 | Q2 | Q3 | Q4 | Year 1 Total |
|---|---|---|---|---|---|
| **Infrastructure** | $270 | $270 | $270 | $270 | $1,080 |
| **Software/Tools** | $425 | $425 | $425 | $425 | $1,700 |
| **Third-Party** | $150 | $150 | $200 | $250 | $750 |
| **Game Artist** | $9,000 | $9,000 | $9,000 | $9,000 | $36,000 |
| **Marketing/Travel** | $5,000 | $2,000 | $2,000 | $3,400 | $12,400 |
| **One-Time Setup** | $950 | - | - | - | $950 |
| **Quarterly Total** | **$15,795** | **$11,845** | **$11,895** | **$13,345** | |
| **Cumulative** | $15,795 | $27,640 | $39,535 | $52,880 | |

### Final Year 1 Total

| Category | Amount | % of Budget |
|---|---|---|
| Cloud Infrastructure | $1,080 | 2% |
| Software & Tools | $1,700 | 3% |
| Third-Party Services | $750 | 1% |
| Game Art Contractor | $36,000 | 68% |
| Marketing & Travel | $12,400 | 23% |
| One-Time Setup | $950 | 2% |
| **Buffer (10%)** | $5,300 | - |
| **Year 1 Grand Total** | **~$58,000** | 100% |

---

## 9. Comparison: Original vs. Revised BoM

| Category | Original v1.0 | Revised v2.0 | Reduction |
|---|---|---|---|
| **Cloud Infrastructure** | $312,000 | $1,080 | **99.7%** |
| **Software Licenses** | $89,400 | $1,700 | **98%** |
| **Third-Party Services** | $156,000 | $750 | **99.5%** |
| **Hardware (Dev)** | $48,000 | $0 | **100%** |
| **Team (35 people)** | ~$3,500,000 | $0 (founders) | **100%** |
| **Contractors** | - | $36,000 | New |
| **Marketing** | - | $12,400 | New |
| **Total Year 1** | **$605,400** + salaries | **~$58,000** | **90%+** |

**Why the difference?**

The original assumed:
- AWS EKS from Day 1 (we use Vercel + Supabase)
- Kafka/Flink for streaming (we use PostgreSQL)
- 35-person team (we have 2 founders + 1 contractor)
- $48K in dev hardware (we use laptops we already own)
- Enterprise compliance tools (we defer until enterprise customers)

The revised approach matches how every successful EdTech started: lean infrastructure, prove value, scale with revenue.

---

## 10. Year 2-5 Scaling Budget

### Year 2 (Post-Seed, ~$1M ARR target)

| Category | Monthly | Annual | Notes |
|---|---|---|---|
| **Infrastructure** | $700 | $8,400 | Supabase Team + SpacetimeDB |
| **Team (10 people)** | $80,000 | $960,000 | 4 eng, 2 game, 2 sales, 2 ops |
| **Software** | $800 | $9,600 | Scaled tooling |
| **Marketing** | $5,000 | $60,000 | Conference presence, content |
| **Contractors** | $5,000 | $60,000 | Additional artists, consultants |
| **Year 2 Total** | | **~$1.1M** | |

### Year 3-5 (Scaling Phase)

| Year | Team Size | Infrastructure | Total Budget |
|---|---|---|---|
| **Year 3** | 26 | $50,000 | ~$2.5M |
| **Year 4** | 39 | $200,000 | ~$4.5M |
| **Year 5** | 49 | $1,000,000 | ~$8.4M |

**Infrastructure scales from $1K to $1M over 5 years** — we only pay for capacity when we have users requiring it.

---

## 11. Order Checklist (Year 1)

### Immediate (Week 1)
- [ ] **Domain**: Register via Cloudflare Registrar (~$30)
- [ ] **Supabase**: Create Pro project ($25/mo)
- [ ] **Vercel**: Connect to GitHub, upgrade to Pro ($20/mo)
- [ ] **Cloudflare**: Set up DNS (free)
- [ ] **GitHub**: Create org, enable Team ($4/user/mo)
- [ ] **1Password**: Create team vault ($8/mo)

### Week 2
- [ ] **Cursor Pro**: Subscribe for all developers ($20/user/mo)
- [ ] **Claude Pro**: Subscribe for all developers ($20/user/mo)
- [ ] **PostHog**: Create project (free)
- [ ] **Sentry**: Create project (free)
- [ ] **Resend**: Create account (free tier)

### Month 1
- [ ] **Game Artist**: Find and contract via Upwork/ArtStation ($3,000/mo)
- [ ] **Asset Packs**: Purchase from itch.io (~$200 one-time)
- [ ] **Legal**: Generate privacy policy via Termly (free)

### Month 3
- [ ] **LLC/Corp**: File via Stripe Atlas or state ($500)
- [ ] **Stripe**: Create account (free, pay-as-you-go)
- [ ] **Google Cloud Console**: Set up for OAuth (free)

### Month 6 (Pre-Launch)
- [ ] **Google Workspace**: Set up professional email (optional, $7/user/mo)
- [ ] **Conference registration**: GESS Dubai booking (~$3,000)

---

## 12. Vendor Contacts & Links

| Service | URL | Pricing Page |
|---|---|---|
| Supabase | supabase.com | supabase.com/pricing |
| Vercel | vercel.com | vercel.com/pricing |
| Cloudflare | cloudflare.com | Free plan sufficient |
| Cursor | cursor.sh | cursor.sh/pricing |
| Claude | claude.ai | anthropic.com/pricing |
| GitHub | github.com | github.com/pricing |
| PostHog | posthog.com | posthog.com/pricing |
| Sentry | sentry.io | sentry.io/pricing |
| Resend | resend.com | resend.com/pricing |
| Stripe | stripe.com | stripe.com/pricing |
| 1Password | 1password.com | 1password.com/teams |

---

*This BoM reflects the reality of building an EdTech startup: start with tools that let a small team move fast, prove the product works, then scale infrastructure alongside revenue. The $58K Year 1 budget is achievable with modest angel investment or founder savings, and positions EdGame to reach profitability without requiring massive infrastructure spend.*
