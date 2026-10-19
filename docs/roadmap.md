# Product Roadmap — ProductShift / User Mirror

Owner: Jean Kaluza (CTO: opencode agent)
Branch: pswerback (current working branch)

---

## Phase 0 — Stabilize (DONE)
- [x] Repair git repo (corrupted pack index).
- [x] Resolve merge conflicts (community-controller.ts, CommunityVault.tsx).
- [x] Restore build configs (tsconfig, vite, postcss, index.css).
- [x] Restore Tailwind CSS generation.
- [x] Remove wiped lovable_site.
- [x] Bump Playwright CI to Node 24.
- [x] Switch AI provider: Gemini (402/billing) → OpenRouter (free, Gemma 4 + fallback chain).
- [x] Add /api/user/transactions route.
- [x] Fix Stripe apiVersion mismatch.
- [x] Cookie banner dismissal (reject-only).
- [x] Remove/re-add graceful timeout (now 58s, completes).

## Phase 1 — Core product working (IN PROGRESS)
- [ ] Move repo out of Dropbox (or make folder "available offline") to stop 0-byte placeholders.
- [ ] Populate .env locally (GROQ/OPENROUTER, Supabase, Stripe, Resend, Browserless).
- [ ] Verify full test flow on multiple sites (pge.com, freethebrains.com, etc.).
- [ ] Confirm report quality (scoring, persona feedback, no cookie-banner dominance).
- [ ] Test Community Analyzer ingestion + experiment publishing (Project Beta).
- [ ] E2E: run Playwright suite against staging.

## Phase 2 — Content & AEO/SEO foundation
- [ ] Publish Tier 1 blog pillars (blog-backlog.md #1–5).
- [ ] Set up RSS + Zapier syndication (content-strategy.md Option A).
- [ ] Add Article/FAQPage/Person/Organization schema to blog posts.
- [ ] Create author bio + about page (E-E-A-T).
- [ ] Enhance Chrome extension with "Publish to Medium/LinkedIn" buttons.
- [ ] Publish open-source AX checklist on GitHub.
- [ ] Pitch 3 guest posts + 2 podcasts.

## Phase 3 — Community Analyzer (Project Beta) completion
- [ ] Supabase tables: community_assets, community_personas, experiments, experiment_sessions, persona_evolution.
- [ ] Ingestion (communityIngestHandler) — done, needs testing.
- [ ] Persona Workshop UI (PersonaAdmin).
- [ ] Public Experiment page (Kickstarter-style).
- [ ] Persona versioning + recalibration.
- [ ] GHL growth loop (JSON webhook export).

## Phase 4 — Blogging unification & distribution
- [ ] RSS → Zapier → Medium draft + LinkedIn post automation.
- [ ] Newsletter via Resend (reuse existing email infra).
- [ ] Weekly "AX Teardown" cadence.
- [ ] Monthly "State of AI UX" roundup.
- [ ] Quarterly "State of AI Experience" essay.

## Phase 5 — Authority & growth
- [ ] Conference talk submissions.
- [ ] Podcast tour.
- [ ] Backlink campaign (UX publications).
- [ ] Measure: organic traffic, AI citations, newsletter signups, inbound leads.

## Parked / future
- Referral/credit system tweaks (working, low priority).
- SEO Shield / Portfolio Defense plans (working).
- Funnel Roast (disabled, 501).
- lovable_site (removed).

## Notes
- $0 budget. No paid services. Free tiers only (OpenRouter, Supabase, Vercel, Resend, Stripe test mode).
- All git commands run by Jean manually; agent provides exact commands.
- Dropbox Smart Sync causes 0-byte placeholders — keep folder "available offline."
EOF
echo "written"