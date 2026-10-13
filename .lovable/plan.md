# Scout — technical spec, build status, and model switch

## 1. Are the marketplace connectors live?
Partly. Checked against the live database today:
- The scraping service (Apify) is connected and its key is present.
- 4 of 8 marketplaces work: Leboncoin, Wallapop, Kleinanzeigen, Catawiki. Each has run 2 searches, all completed.
- Only one fetch has ever happened (6 Oct, 18:59 UTC). Nothing has run since: there is no schedule, and fetching only happens when a signed-in user presses "Fetch new finds".
- 160 listings stored: 155 passed, 3 removed by the text filter, 2 removed by the AI check. All came from lamp searches.
- eBay, Gumtree, Marktplaats and Subito are set up in the database, but nothing has been built to fetch from them.
- Browser-use fallback: switched off. The workspace has no browser-use model available.

So the connection works, but it isn't running continuously and it doesn't cover everything.

## 2. Technical spec with status
Legend: [Done] built and verified · [Partial] built but not verified, or incomplete · [Todo] not started

### Platform
- [Done] TanStack Start app; Lovable Cloud for database, accounts and storage.
- [Done] Email and Google sign-in.
- [Partial] Admin role. `is_admin()` exists, but there are no admin screens, and it still needs moving to a separate `user_roles` table.
- [Partial] Row-level security on every table. 3 linter warnings are still open.
- [Done] Private image bucket. [Todo] Copying photos into it (photos are still loaded from the marketplaces).

### Stage 1: screening profile
- [Done] Include, exclude or neutral for 20 periods, 11 categories with sub-types, and each marketplace.
- [Done] Price range, minimum margin and the hide-reproductions option.
- [Done] "What do you buy?" first-run screen and Settings. [Partial] Saving while signed in hasn't been tested end to end.

### Stage 2: ingestion
- [Done] Shared adapter contract; adapters for the 4 marketplaces above; conversion to GBP; duplicates removed by listing URL.
- [Done] Run records, a 6-hour reuse window for repeat searches, and caps (2 searches per marketplace, 20 results each).
- [Partial] Old finds hidden after 21 days or once an auction ends. Not checked in the feed.
- [Todo] Adapters for eBay, Gumtree, Marktplaats and Subito.
- [Todo] Scheduled background fetching, more searches per run, and paging through results.
- [Todo] Paste-a-link import.
- [Todo] Browser-use fallback (blocked: no model available).

### Stage 3: screening
- [Done] Text filter: junk, wanted ads, flat-pack, no photo, no price.
- [Done] AI vision tagging returning structured output, stored once per listing.
- [Done] Each dealer's profile applied when the feed loads, using the 0.6 confidence rule.
- [Partial] Pausing when AI credits run out. Built but not tested.
- [Todo] Moving screening into a server-side job (it currently runs only while the page is open).
- [Todo] Funnel view with real numbers, a rejected-listings list, and manual overrides.

### Stage 4: feed
- [Done] Swipe cards, Passed and Maybe tabs, category pills, detail view, bargain score, keyboard controls.
- [Todo] Saving swipes and shortlist to the database (the code exists but isn't wired to the screen), and Ranker A.

### Stages 5–6
- [Todo] Embedding ranker, blend slider, Ranker Lab metrics and CSV export (the current chart uses made-up data).

## 3. Model switch: Astra replaced with lower-cost models
Picked from this workspace's live model list:
- **Listing screening (photo + text):** `google/gemini-3.1-flash-lite`. This is the lowest-cost model in the list that reads images. It is used for nearly every AI call.
- **Second opinion for Maybe and borderline listings, dealer notes, and paste-link extraction:** `openai/gpt-6-luna`. It is low cost, reads images, and has a zero-retention option.
- **Embeddings (Stage 5):** `google/gemini-embedding-2`, the gateway default. It is cheap and can also read images.

The second opinion runs only when the first model's period confidence is between 0.4 and 0.7, or it marks reproduction as "unsure". That keeps most listings to a single low-cost call.

## Technical details
- Rewrite `src/lib/ai/screening.server.ts` to call a provider-agnostic `screenListing(model)`:
  - Gemini Flash Lite uses the Chat Completions provider (`@ai-sdk/openai-compatible`, name "lovable") with strict structured output.
  - Luna uses `/v1/responses` with `store:false` and low reasoning.
  - Both stream; the status codes 401/402/403 keep their current pause handling.
- Write the actual model id into `listing_tags.model_id`, and change the column default from Astra.
- Existing tags stay as they are. No re-screening is needed.
- Update project memory (the Core rule naming Astra) and the AI rule in AGENTS.md. Update the plan spec's AI section.
- Verify with one real listing through each model before claiming success. Compare the tags with the stored Astra result.

## Suggested order after the switch
1. Model switch (above).
2. A server-side scheduled fetch-and-screen job, with daily limits.
3. Swipe and shortlist saving, and the real funnel.
4. The remaining 4 marketplace adapters.
5. Admin screens and the security warnings.
