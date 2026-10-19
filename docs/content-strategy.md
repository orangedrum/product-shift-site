# Content Strategy & Syndication Automation Design

## Goal
Position ProductShift as the go-to agency for AI Experience (AX). Publish regularly across own blog, Medium, LinkedIn, and the Chrome extension — without manual copy/paste. Human voice first; AI assists.

## Core principle: Canonical-first
- Own blog = canonical URL (single source of truth).
- Medium and LinkedIn are syndication, never duplicates.
- Canonical URL always points to own site → consolidates SEO/AEO authority.

## Syndication automation design

### Flow
1. Jean writes draft in own voice (or uses Chrome extension to generate a draft on the site).
2. Publish on own blog → generates canonical URL.
3. Automation triggers (RSS/webhook) → creates Medium draft (canonical set) + LinkedIn native post (link in comments).
4. Newsletter excerpt queued.

### Implementation options (pick one)
- **Option A — RSS + Zapier/Make (no code)**: Own blog RSS → Zapier → Medium API (create draft) + LinkedIn API (create post). Simplest. ~$0–$20/mo.
- **Option B — Chrome extension enhancement**: Add "Publish to Medium/LinkedIn" buttons to the extension. One click after generating the blog post on-site. Requires code (small).
- **Option C — Webhook from backend**: When a blog post is saved (Supabase), trigger a webhook → Zapier/Make → syndicate. Cleanest integration with existing stack.

Recommendation: Start with Option A (RSS+Zapier) for zero-code speed, then Option B for one-click UX.

### Automation details
- Medium: use "Import a story" or API with `canonicalUrl` set to own site URL. Set as draft first (Jean reviews), then publish.
- LinkedIn: native long-form post (algorithmic reach) with "full analysis at [url]" as P.S. or in first comment (LinkedIn suppresses external links in feed).
- Newsletter: excerpt + link via Resend (already integrated) — reuse `sendEmail` / `getEmailTemplate`.
- Chrome extension: keep generating on-site; add syndication step.

### Cadence
- Weekly: "AX Teardown" (short, 10-min read).
- Monthly: "State of AI UX" roundup.
- Quarterly: "State of AI Experience" essay.

## AEO/SEO playbook

### AEO (Answer Engine Optimization)
- Publish clear, quotable definitions: "What is AX?", "AX vs UX", "How to audit an AI product."
- FAQPage + Article + Person + Organization schema (extend existing `application/ld+json`).
- Named, attributed frameworks (e.g., "The 5 AX Principles") — AI engines cite named frameworks.
- Original data from audit tool → case studies with numbers.

### SEO
- Keyword clusters: long-tail ("how to reduce AI hallucination in UX", "conversational AI onboarding", "AI agent trust design") convert better than "AI UX".
- E-E-A-T: author bios with credentials, about page, consistent identity.
- Backlinks: guest posts (Nielsen Norman, Smashing, UX Collective), podcasts, conference talks.
- Community flywheel: newsletter, LinkedIn audience, open-source AX checklist (GitHub).

### Measurement
- Track: organic traffic, AI citations (Perplexity/ChatGPT referrals), newsletter signups, inbound leads, backlinks.
- Goal: top-3 ranking for "AI experience design" / "AX audit" within 12 months.

## Voice guidelines
- Jean writes in own voice. AI assists (drafting, structuring, SEO). Jean edits for voice, adds comical takes and personal stories.
- Tone: opinionated, human, slightly irreverent. Not corporate.
- Every piece must have at least one original observation or data point.

## Next actions
1. Publish Tier 1 pillar pieces (blog-backlog.md items 1–5).
2. Set up RSS + Zapier syndication (Option A).
3. Enhance Chrome extension with syndication (Option B).
4. Pitch guest posts + podcasts.
5. Publish open-source AX checklist on GitHub.
EOF
echo "written"