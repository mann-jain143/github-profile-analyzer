## GitHub Profile Analyzer — Game-Style Frontend

Pivoting from the earlier cyberpunk direction to the **playful neo-brutalist "game UI"** look in your reference: cream grid-paper background, thick black borders, hard offset shadows, chunky sticker cards, hot-pink primary button, blue accents, yellow highlights, and a friendly robot mascot.

### Visual direction
- **Background**: cream `#FDFBF0` with a faint blueprint grid pattern.
- **Borders & shadows**: 2–3px solid black, hard offset shadow `4px 4px 0 #000` on every card, chip, and button.
- **Accents**: hot pink `#EC4899` (primary CTA), sky blue `#3B82F6`, sun yellow `#FACC15`, mint green `#22C55E` status dot.
- **Typography**: chunky display serif (Fraunces / Alfa Slab One) for headings, clean sans (Inter) for body, mono (JetBrains Mono) for labels, scores, and chips.
- **Personality**: HUD chips, "BETA VERSION" sticker tag, lightning bolt icons, slight tilt on a few stickers for a collage feel, friendly robot mascot.
- **Motion**: buttons press the hard shadow flat on click, cards stagger-fade in, robot mascot bobs while scanning, animated progress meters.

### Page structure (single page, mobile-first)
1. **Top HUD bar** — home chip, repo/stars chip, sign-in chip (visual only).
2. **Hero** — sticker title card "GITHUB PROFILE ANALYZER ⚡" + "BETA VERSION" tag + tagline.
3. **Scan panel** — `USER_IDENTIFIER` input with `$|` prompt and `TARGET_NODE` chip, big pink **SCAN ⚡** button.
4. **AI Deep Scan card** — robot mascot + short blurb (idle state; animates during scan).
5. **Loading state** — bobbing robot, animated scan-bar, rotating status text ("Fetching repos…", "Reading READMEs…", "Calling AI…").
6. **Results report** (revealed after scan)
   - Profile card: avatar, name, bio, follower/repo/star stats.
   - **Overall Score** /100 — chunky circular meter, hot-pink fill.
   - **Star Rating** /5 — big yellow stars.
   - Language breakdown — chunky colored bars.
   - Top 3 repos — sticker cards with stars/forks.
   - Strengths (green +) and Weaknesses (pink –) panels.
   - Recruiter impression — quote card with robot avatar.
   - Resume impact — big "+X%" badge.
   - Actionable recommendations — numbered checklist.
   - Scan-another button.

### Technical plan
- **Stack**: TanStack Start (existing), Tailwind v4, shadcn primitives where useful.
- **Fonts**: load Fraunces + Inter + JetBrains Mono via `<link>` in `src/routes/__root.tsx`. Register families in `@theme` inside `src/styles.css`. No CSS URL imports.
- **Design tokens** in `src/styles.css`: `--paper`, `--ink`, `--pink`, `--blue`, `--yellow`, `--mint`, plus a reusable `--shadow-brutal` and grid-paper background utility.
- **Reusable brutalist primitives** in `src/components/brutal/`: `BrutalCard`, `BrutalButton`, `BrutalChip`, `BrutalInput`, `StickerTag` — all thick-border + hard-offset-shadow.
- **Route**: replace placeholder `src/routes/index.tsx` with the single-page analyzer. Set proper `head()` (title, description, OG).
- **GitHub data**: call public GitHub REST API (`/users/:u`, `/users/:u/repos`) from the client via TanStack Query — no auth needed for basic public data.
- **AI analysis**: enable **Lovable Cloud** so we can use Lovable AI server-side. Create `createServerFn` (`src/lib/analyze.functions.ts`) that takes fetched GitHub data and returns structured JSON via `google/gemini-3-flash-preview` + `Output.object` + Zod: `{ overallScore, starRating, strengths[], weaknesses[], recruiterImpression, resumeImpact, recommendations[] }`.
- **Mascot**: generate a chunky friendly robot illustration (transparent PNG) and import as a local asset.
- **Error states**: friendly messages for invalid usernames, GitHub rate limits, and AI 429/402.

### Out of scope (won't build unless asked)
- Login / saved history.
- Comparing two users.
- Contribution heatmap.

Approve and I'll build it.