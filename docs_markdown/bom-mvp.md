# EdGame – MVP Bill of Materials v2.0

**Document Version:** 2.0  
**Status:** Ready to Order  
**Last Updated:** February 2026

Lean BoM for a 2-3 person team building EdGame MVP. Aligned with the phased architecture strategy: start simple with Supabase + Vercel, scale only when usage demands it.

---

## Executive Summary

| Category | Monthly Cost | 6-Month Total | Notes |
|---|---|---|---|
| **AI Coding Tools** | $240 | $1,440 | Cursor, Claude, Copilot |
| **Cloud Infrastructure** | $200 | $1,200 | Supabase Pro + Vercel Pro |
| **Development Tools** | $50 | $300 | Essential SaaS only |
| **Third-Party Services** | $60 | $360 | Email, analytics, error tracking |
| **Monthly Total** | **~$550/month** | **$3,300** | |
| **One-Time Setup** | | **$150** | Domain, legal basics |
| **Game Art Contractor** | $3,000/month | $18,000 | Part-time asset creation |
| **6-Month MVP Budget** | | **~$21,500** | Excluding founder salaries |

---

## 1. AI-Assisted Development Tools

The core of modern development — these tools dramatically accelerate a 2-person team.

| Tool | Plan | Monthly Cost | Annual Cost | What We Get |
|---|---|---|---|---|
| **Cursor Pro** | Pro | $20/user | $240/user | AI-native IDE, Claude/GPT integration, codebase-aware completions, multi-file edits |
| **Claude Pro** | Pro | $20/user | $240/user | Long-context reasoning for architecture decisions, documentation, debugging |
| **GitHub Copilot** | Individual | $10/user | $100/user | Inline completions in any editor/IDE |
| **v0 by Vercel** | Free tier | $0 | $0 | UI component generation, React code from descriptions |
| **Bolt.new** | Free tier | $0 | $0 | Full-stack app scaffolding, rapid prototyping |

**Per-developer cost**: ~$50/month for the AI toolkit

**For 2 founders**: ~$100/month total (both need Cursor + Claude; Copilot optional backup)

### Why These Tools

- **Cursor Pro** is our main coding environment — better than VS Code + Copilot alone because of multi-file edit capabilities
- **Claude Pro** handles complex reasoning: system design, debugging gnarly issues, writing detailed specs
- **v0 / Bolt.new** free tiers are sufficient for scaffolding — don't pay until we hit limits

---

## 2. Cloud Infrastructure (Phase 1)

### Recommended Stack: Supabase + Vercel

| Service | Plan | Monthly Cost | What We Get | Migration Trigger |
|---|---|---|---|---|
| **Supabase** | Pro | $25 | PostgreSQL, Auth, Realtime, Storage, 8GB DB, 50GB bandwidth, 500K auth users | >50K MAU or >8GB data |
| **Vercel** | Pro | $20 | Unlimited deployments, 100GB bandwidth, Edge Functions, Analytics | >100K requests/day sustained |
| **Cloudflare** | Free | $0 | DNS, DDoS protection, CDN for assets | Never (keep on free tier) |
| **Upstash Redis** | Free | $0 | 10K commands/day — rate limiting, sessions | >10K commands/day |
| **Total** | | **$45/month** | | |

### Why This Stack

1. **Supabase Pro ($25)** — PostgreSQL + Auth + Realtime in one managed service. No DevOps needed. RLS handles authorization at the database level.

2. **Vercel Pro ($20)** — Automatic deployments from GitHub, edge functions for API routes, built-in analytics. Better DX than AWS.

3. **Cloudflare Free** — No-brainer for DNS and CDN. Free tier handles everything we need for years.

4. **Upstash Free** — Redis for rate limiting and session caching. Free tier is generous for MVP scale.

### Migration Triggers (When to Scale Up)

| Trigger | Current Limit | Action |
|---|---|---|
| >50K MAU | Supabase Pro | Upgrade to Supabase Team ($599/mo) |
| >5K concurrent | Supabase Realtime | Add dedicated Realtime server |
| >100K requests/day | Vercel Pro | Upgrade to Vercel Enterprise or migrate API to AWS |
| Multiplayer launch | N/A | Add SpacetimeDB or Colyseus for game state sync |
| >100 schools | Supabase Pro | Consider self-hosted Supabase on AWS for compliance |

---

## 3. Development Tools

| Tool | Plan | Monthly Cost | Annual | Purpose |
|---|---|---|---|---|
| **GitHub** | Team | $4/user | $48/user | Repos, Actions (CI/CD), Issues |
| **Linear** | Free | $0 | $0 | Project management (better than Jira for small teams) |
| **Figma** | Free (Starter) | $0 | $0 | Design, prototyping (upgrade when we hire designer) |
| **Notion** | Free | $0 | $0 | Docs, wiki, knowledge base |
| **1Password Teams** | Team | $8 (total) | $96 | Secrets management, shared credentials |
| **Total** | | **~$16/month** | | For 2 users |

### Why These Choices

- **GitHub Team** over free: Private repos, required reviews, Actions minutes for CI/CD
- **Linear free**: Generous free tier, better UX than alternatives
- **Figma free**: Starter plan has 3 files — enough for MVP wireframes
- **1Password**: Non-negotiable for secure credential sharing

---

## 4. Third-Party Services

| Service | Plan | Monthly Cost | Purpose | Usage Limit |
|---|---|---|---|---|
| **Resend** | Free → Pro | $0 → $20 | Transactional email (assignments, reports) | 3K emails/mo free, then $20 |
| **PostHog** | Free | $0 | Product analytics, event tracking | 1M events/mo free |
| **Sentry** | Free | $0 | Error tracking, performance | 5K errors/mo free |
| **Stripe** | Pay-as-you-go | ~$30 | Payment processing (2.9% + $0.30) | Only pay on transactions |
| **Total** | | **~$30-50/month** | | Scale with usage |

### Email Strategy

- Start with Resend free tier (3K emails/month)
- Covers ~100 teachers × 30 emails/month = MVP scale
- Upgrade to Pro ($20/month, 50K emails) when we hit the limit

### Analytics Strategy

- **PostHog** for product analytics (funnels, retention, feature usage)
- **Supabase Dashboard** for database metrics
- **Vercel Analytics** for web vitals
- **Sentry** for error tracking

All free tiers are sufficient for 10,000+ MAU.

---

## 5. Game Development Assets

### Game Engine: Phaser 3 (Free, MIT Licensed)

| Asset Type | Source | Cost | Notes |
|---|---|---|---|
| **2D Game Assets** | itch.io packs | $50-200 one-time | Placeholder art for MVP |
| **UI Kits** | itch.io / Figma community | $0-50 | Interface elements |
| **Sound Effects** | Freesound.org, Kenney.nl | $0 | CC0 licensed |
| **Music** | Uppbeat (free tier) | $0 | Attribution required |

### Contract Game Artist (Recommended)

| Role | Rate | Monthly Hours | Monthly Cost |
|---|---|---|---|
| **2D Game Artist** (part-time) | $40-60/hr | 50-75 hrs | $2,000-4,500 |

**Recommendation**: Budget $3,000/month for a part-time contract artist to create:
- Character sprites for 3 environments
- Background art for Math Arena, Chemistry Lab, Physics Sim
- UI elements and icons
- Animation frames

**Finding artists**: 
- Fiverr / Upwork for quick assets
- ArtStation for higher quality
- Game dev Discord communities

---

## 6. Domains & Basics

| Item | Cost | Notes |
|---|---|---|
| **Domain (edgame.io or similar)** | $15-50/year | Get it early; .io or .com |
| **Google Workspace** | $7/user/month | Professional email (optional — can use free Gmail) |
| **Legal (privacy policy, ToS)** | $0-500 | Termly.io free tier or lawyer review |
| **LLC Formation** | $100-500 | State-dependent; use Stripe Atlas or Clerky |

**MVP minimum**: Domain ($30) + Legal templates ($0 via Termly) = **~$30 one-time**

---

## 7. 6-Month MVP Budget

### Phase 1: Months 1-3 (Build Core MVP)

| Category | Monthly | 3-Month Total |
|---|---|---|
| AI Tools (2 founders) | $100 | $300 |
| Supabase Pro | $25 | $75 |
| Vercel Pro | $20 | $60 |
| GitHub Team | $8 | $24 |
| 1Password | $8 | $24 |
| Third-party services | $30 | $90 |
| Game artist (contract) | $3,000 | $9,000 |
| **Monthly total** | **$3,191** | **$9,573** |

**Milestone**: 1 game environment (Math Arena), basic teacher dashboard, 10 school pilots launched

### Phase 2: Months 4-6 (Expand & Validate)

| Category | Monthly | 3-Month Total |
|---|---|---|
| AI Tools | $100 | $300 |
| Supabase Pro | $25 | $75 |
| Vercel Pro | $20 | $60 |
| GitHub Team | $8 | $24 |
| 1Password | $8 | $24 |
| Third-party services | $50 | $150 |
| Game artist (contract) | $3,000 | $9,000 |
| Conference (GESS Dubai) | - | $3,000 |
| Travel (GCC school visits) | $500 | $1,500 |
| **Monthly total** | **$3,711** | **$14,133** |

**Milestone**: 3 game environments, Google Classroom integration, 50+ school pilots, $20K MRR target

### 6-Month Total Budget

| Category | Total |
|---|---|
| **Infrastructure + Tools** | $1,506 |
| **Game Art** | $18,000 |
| **Marketing/Travel** | $4,500 |
| **One-time setup** | $150 |
| **Buffer (10%)** | $2,400 |
| **6-Month Grand Total** | **~$26,500** |

**Note**: This excludes founder salaries. Assumes founders are funded by savings, angel investment, or working part-time. First engineering hire (if seed-funded) would add ~$8K-12K/month.

---

## 8. What We DON'T Need Yet

Save money by avoiding these until they're actually necessary:

| Item | Why Not Now | When to Add |
|---|---|---|
| AWS/GCP | Supabase + Vercel handles everything at MVP scale | >50K MAU or enterprise compliance requirements |
| Kubernetes | Massive overkill for a 2-person team | >10 microservices, >100K concurrent users |
| Data warehouse (Snowflake/BigQuery) | PostgreSQL handles analytics at our scale | >1M events/day, complex cross-school analytics |
| Kafka/Flink | Real-time streaming unnecessary until massive scale | >100K concurrent game sessions |
| Full-time designer | Use Figma, v0, and contractor for MVP | After seed funding |
| Marketing automation (HubSpot) | Spreadsheet + Notion works fine | >1,000 leads to manage |
| Customer support platform | Email/Slack works at pilot scale | >100 paying customers |
| SpacetimeDB | Only needed for multiplayer | Phase 2 multiplayer launch |

---

## 9. Scaling Path

### When MVP is validated and we need to scale:

**Trigger: $20K MRR achieved, 50+ paying schools**

| Addition | Monthly Cost | Why |
|---|---|---|
| Supabase Team | $599 | More connections, dedicated support |
| First engineer hire | $10,000 | Speed up game environment development |
| Implementation manager | $6,000 | Handle school onboarding |
| **Post-seed monthly** | **~$17,000** | |

**Trigger: Multiplayer launch (Phase 2)**

| Addition | One-time / Monthly | Why |
|---|---|---|
| SpacetimeDB | ~$200/month | Real-time game state sync |
| Mobile app deployment | $100/year (App Store) | iOS/Android distribution |
| Push notification service | $50/month | Firebase Cloud Messaging |

**Trigger: 100+ schools, enterprise sales**

| Addition | Monthly | Why |
|---|---|---|
| AWS migration | $2,000+ | Compliance, custom infrastructure |
| Sales team (2 AEs) | $20,000 | Outbound sales motion |
| SOC 2 compliance | $20,000 one-time | Enterprise requirement |

---

## 10. Alternative: Ultra-Lean Setup

If we're pre-revenue and maximizing runway:

| Category | Tool | Monthly Cost |
|---|---|---|
| **Coding** | Cursor Pro only | $20 |
| **Backend** | Supabase Free | $0 |
| **Hosting** | Vercel Free | $0 |
| **Email** | Resend Free | $0 |
| **Analytics** | PostHog Free | $0 |
| **Domain** | Cloudflare Registrar | ~$1 |
| **Total** | | **~$21/month** |

This works for prototyping but hits limits quickly:
- Supabase Free: 500MB database, 2GB bandwidth, limited API requests
- Vercel Free: 100GB bandwidth, 10-second function timeout

**Recommendation**: Don't go ultra-lean. The $45/month for Supabase Pro + Vercel Pro is worth it for:
- Larger database (8GB vs 500MB)
- More bandwidth
- Longer function timeouts
- Better support

---

## 11. Order Checklist

### Week 1: Foundation
- [ ] Register domain (Cloudflare Registrar)
- [ ] Create GitHub org, enable Team plan
- [ ] Set up Supabase project (Pro plan)
- [ ] Connect Vercel to GitHub repo
- [ ] Configure Cloudflare DNS
- [ ] Set up 1Password team vault

### Week 2: Development Setup
- [ ] Install Cursor Pro (all developers)
- [ ] Subscribe to Claude Pro (all developers)
- [ ] Set up Sentry project
- [ ] Configure PostHog analytics
- [ ] Set up Resend for transactional email

### Month 1: Game Development
- [ ] Find and hire contract game artist (Upwork/ArtStation)
- [ ] Purchase placeholder asset packs from itch.io
- [ ] Set up Phaser development environment

### Month 3: Pre-Launch
- [ ] Create Stripe account (for future payments)
- [ ] Generate privacy policy (Termly)
- [ ] Set up Google Classroom developer account (LTI integration)

---

*Start lean. Ship fast. Scale when we have users paying us. Every dollar spent before product-market fit is a dollar that could have extended our runway.*
