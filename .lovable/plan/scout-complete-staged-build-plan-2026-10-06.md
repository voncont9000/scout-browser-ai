# Scout — complete staged build plan

## Product direction
Build Scout as a signed-in workspace for antique and vintage furniture dealers. Preserve the supplied “antique scout” design system: warm neutrals, photography-led screens, restrained chrome, catalogue-like onboarding tiles, and a mobile-first swipe experience that also works efficiently with desktop controls.

Automated screening remains the primary product rule: excluded periods, styles, categories, reproductions, and price limits must be enforced before a listing reaches the main feed.

## AI and scraping specification update
- Use `openai/gpt-6-astra` through the Lovable AI Gateway for Scout’s text and vision classification, structured listing extraction, dealer notes, and valuation assistance.
- Use the gateway’s default embedding model for listing and taste vectors, stored with pgvector; keep embedding model and dimensions versioned so vectors are never mixed.
- Keep Apify as the normal marketplace ingestion path.
- Add a browser-use fallback adapter for configured difficult websites when an Apify actor fails, is blocked, or produces an unusable result. It will use the supported OpenAI browser-use/computer-use model through its API, in a controlled hosted browser session, and return the same normalized listing shape as every other adapter.
- Browser-use will be allowlisted per source, bounded by page/action/time limits, logged, rate controlled, and never allowed to bypass authentication, CAPTCHAs, robots restrictions, or marketplace terms. It will not silently retry terminal provider denials.
- The one-off “paste a listing link” flow will try normal extraction first, then the same browser-use fallback, then screenshot-based Astra vision extraction.
- Before implementing the browser-use call, verify the exact currently supported model ID and API contract in the live gateway catalogue. If the requested capability is unavailable, leave the adapter disabled with a visible admin status rather than substituting another model.

## Foundation and data
1. Enable Lovable Cloud for accounts, database, image storage, pgvector, and secure server-side credentials.
2. Add email-based sign-in and protected app screens, plus an admin role for ingestion and source configuration.
3. Create migrations for dealer profiles, screening preferences, multilingual period terms, sources, listings, stored AI tags, ingestion runs/items, overrides, swipes, attribute weights, embeddings, shortlist entries, ranker snapshots, evaluation metrics, exchange rates, and background-job state.
4. Apply row-level access rules so dealers see only their own profile, activity, shortlist, rankings, and overrides; restrict source configuration and ingestion controls to admins.
5. Seed the supplied periods, categories, multilingual synonyms, initial source definitions, and fixed currency rates. Store source images in a private listing-images bucket with signed access.

## Stage 1 — onboarding and editable screening profile
- Build a sub-one-minute visual onboarding flow with three-state include/exclude/neutral tiles for every supplied period/style and category.
- Add country and source toggles, price range, minimum margin, and reproduction/“in the style of” controls.
- Save the profile and reuse the same controls in Settings.
- Require at least one included or neutral discovery path before finishing, while making excluded choices visually unmistakable.
- Verify profile persistence, editing, mobile layout, and keyboard accessibility end to end.

## Stage 2 — ingestion and normalization
- Define one adapter contract for query generation, fetch, normalization, validation, and provenance.
- Implement the supplied Apify actors in the requested order: Leboncoin, Wallapop, Kleinanzeigen, Catawiki, then eBay, Gumtree, Marktplaats, and Subito. Keep the eBay Browse adapter disabled behind its feature flag.
- Generate at most six localized searches per source/run from included periods and categories using the multilingual terms table.
- Start and poll provider jobs, import datasets in bounded batches, normalize source-specific fields, convert prices to GBP, deduplicate by canonical listing URL, and persist raw provider data and run diagnostics.
- Download durable copies of primary listing images, with explicit failure states when an image cannot be stored.
- Add source configuration, manual run controls, run history, status/error views, and the browser-use fallback settings for allowlisted sources.
- Protect scheduled and background processing with database leases, idempotent item keys, batch limits, concurrency limits, pause/circuit-breaker states, and explicit owner resume.

## Stage 3 — automated screening
- Run deterministic text screening first: excluded multilingual terms, junk/wanted/service/spare-part/new/flat-pack rules, missing images, non-furniture categories, price limits, and reproduction phrasing. Store a specific rejection reason.
- Send only text-screen survivors to Astra with the main image, title, and description. Enforce a strict structured result for the supplied category, period, origin, attribution, materials, condition, reproduction, risk, valuation, confidence, note, and furniture fields.
- Apply the supplied 0.6 confidence rules to classify passed, maybe, or vision-rejected listings.
- Re-evaluate stored tags without another AI call whenever a dealer edits their profile.
- Build the screening funnel by source and total, rejected-list inspection, and manual override controls. Feed overrides into taste learning while preserving the original automated decision.
- Show safe, actionable provider errors and pause AI queues on credit, policy, or access failures.

## Stage 4 — feed, swipe, shortlist, and Ranker A
- Build the mobile-first card feed with a dominant image, price type, country/source, period/style, resale range, margin, confidence, and clear Passed/Maybe tabs.
- Support right/left/up gestures, visible desktop actions, arrow keys, and tap/click details with all images, tags, notes, red flags, and the original listing link.
- Add profile-derived filters for category, period, style, country, source, maximum price, and minimum margin.
- Implement bargain scoring exactly as specified, including current-bid and offer exclusions.
- Store every action together with ranker assignment and both pre-swipe scores; add the shortlist screen.
- Implement Ranker A’s weighted attributes, recency decay, normalization, cold-start diversity, and readable liked/disliked taste summary.

## Stage 5 — embedding ranker
- Generate one versioned text embedding from each listing’s title and structured tags.
- Maintain each dealer’s weighted positive-minus-negative taste vector and rank candidates by cosine similarity.
- Blend taste and bargain scores with the dealer-controlled slider.
- Queue embedding work in bounded, idempotent batches and reprocess only when content or embedding version changes.
- Keep image embeddings as an explicitly disabled stretch goal.

## Stage 6 — Ranker Lab and exports
- Alternate Ranker A and Ranker B across batches of ten while recording both predictions before every swipe.
- Compute running AUC, median-threshold accuracy, and precision at ten from immutable swipe snapshots.
- Build the side-by-side Ranker Lab with an AUC-over-swipe-count chart, each ranker’s current top ten, and CSV export.

## Navigation and screens
- Public: sign in.
- Protected dealer area: onboarding, Feed, Maybe, Listing detail, Shortlist, Screening Funnel, Taste Profile, Ranker Lab, and Settings.
- Protected admin area: Sources, Ingestion Runs, rejected listings/overrides, browser-use fallback status, and paste-link/screenshot import.
- Use a compact mobile bottom navigation and a restrained desktop sidebar; do not create a marketing landing page.

## Technical implementation
- Use TanStack Start routes and authenticated server functions for app-owned reads, writes, and AI/provider calls; use verified public server routes only for scheduled callbacks.
- Keep every credential and model prompt server-side. Never expose Lovable, Apify, or browser-session credentials to the browser.
- Use strict schemas and plain serializable responses at server boundaries. Preserve provider status/messages for safe UI errors.
- Use background job records rather than page-load work. Cap each invocation and outbound concurrency, persist progress, and make retries status-aware.
- Add unique route metadata for every content screen and retain the supplied responsive, accessible design direction.

## Verification gates
Do not begin a later stage until the prior stage passes its gate:
1. Account creation/sign-in, onboarding persistence, editing, access isolation, and responsive layout.
2. A real source run produces normalized, deduplicated listings and durable images; forced provider failure exercises the browser-use fallback or reports its disabled status correctly.
3. Representative included, excluded, ambiguous, reproduction, junk, and out-of-range fixtures produce the expected screening states and reasons.
4. Swipe gestures/buttons/keys, filters, shortlist, detail view, bargain calculations, and Ranker A logging work on mobile and desktop.
5. Embeddings, vector updates, similarity ordering, and blend controls are repeatable and version-safe.
6. Ranker alternation, metrics, charts, and CSV values match test fixtures.
7. Final checks cover build health, runtime errors, authorization boundaries, job idempotency, accessibility, and mobile/desktop visual regression.

## External setup needed during the build
- Connect Lovable Cloud before database, accounts, storage, or background processing is implemented.
- Provision the managed Lovable AI key and test a real Astra request before claiming AI screening works.
- Link or securely add Apify credentials before live marketplace ingestion can be verified.
- Browser-use fallback remains disabled until the live gateway confirms an eligible browser-use model and a compatible hosted-browser API is configured.
