# Scout: learnings for a rebuild

This covers the working parts as of 2026-10-13: ingestion from 4 marketplaces, the text filter, AI vision tagging and the per-dealer screening rules. Data snapshot: 8 ingestion runs (all on 2026-10-06), 160 listings and 157 AI tag rows. See `listings_export.json`, `ingestion_runs_export.json` and `APIFY_CONTRACTS.md`.

## 1. Pipeline

```text
dealer presses "Fetch new finds"
  -> requestFreshListings: up to 2 queries per marketplace, 1 Apify run per query (20 items)
  -> collectFinishedRuns (polled every 15 s, up to 16 times): normalize -> upsert listings (pending)
  -> runScreeningBatch (looped from the open page): text filter -> AI tagging -> listing_tags
  -> getLiveListings: apply this dealer's profile to the stored tags on every read
```

Key rule: the AI tags each listing **once**. Each dealer's profile (periods, categories, sub-types, sources, price range, reproductions) is applied at read time, so editing a profile re-screens instantly without new model calls.

## 2. Query building
- Query = included period term × included category word, in the marketplace's language. English puts the period first ("art deco lamp"). Other languages put the noun first ("lampe art déco").
- The period term is the first entry in `period_terms` for that (period, language). Seeded terms:

| Period | en | fr | de | es | it | nl |
|---|---|---|---|---|---|---|
| Art Deco | art deco | art déco; fauteuil art deco | art déco; art deco sessel | art déco | art déco; stile déco | art deco |
| Mid Century Modern | mid century modern; midcentury | moderniste années 50; vintage scandinave | mid century; 60er jahre design | moderno de mediados de siglo | modernariato | mid century; deens design |
| Art Nouveau | art nouveau | art nouveau | jugendstil | modernismo | stile liberty | jugendstil |

  Periods without terms fall back to the lower-cased English period name. No period selected gives "vintage".
- Category words (en/fr/de/es/it/nl): Chairs chair/chaise/stuhl/silla/sedia/stoel · Armchairs armchair/fauteuil/sessel/sillón/poltrona/fauteuil · Sofas sofa/canapé/sofa/sofá/divano/bank · Tables table/table/tisch/mesa/tavolo/tafel · Desks desk/bureau/schreibtisch/escritorio/scrivania/bureau · Sideboards sideboard/enfilade/sideboard/aparador/credenza/dressoir · Cabinets cabinet/buffet/schrank/vitrina/mobile/kast · Chests of drawers chest of drawers/commode/kommode/cómoda/cassettiera/ladekast · Beds bed/lit/bett/cama/letto/bed · Mirrors mirror/miroir/spiegel/espejo/specchio/spiegel · Lighting lamp/lampe/lampe/lámpara/lampada/lamp.
- "moderniste années 50" and "moderno de mediados de siglo" are literal translations, not words sellers use. Spanish sellers write "vintage", "años 50/60" or "mid century". Review the term lists with native dealers.

## 3. Caps, reuse window and job controls
| Setting | Value |
|---|---|
| Queries per marketplace per fetch | 2 |
| Items per Apify run | 20 (Leboncoin's `adLimit` minimum is 10) |
| Apify run timeout | 240 s |
| Reuse window | 6 h. The same source and query, with a non-failed run in the last 6 h, is reused, not re-run. |
| Collect | up to 8 running runs per call. The client polls every 15 s, up to 16 times. |
| Screening batch | 3 AI calls per batch. Up to 9 pending rows are pulled so text-filter rejects don't use up AI slots. |
| Screening lease | `job_state` row `screening`, 120 s lease, so two tabs can't screen the same rows. |
| Client screening loop | up to 40 rounds, with an 8 s backoff when busy. It stops on pause. |
| AI pause | HTTP 402 pauses the job ("AI credits have run out"). 401/403 pause it with "AI access blocked". The pause is cleared on the next "Fetch new finds". |
| Per-item AI failure | listing → `maybe`, reason "AI could not read this listing". It is never retried in a loop. |
| Feed freshness | Ended auctions and listings fetched more than 21 days ago are hidden. |
| Feed size | the 150 newest pending, passed or maybe listings. |

## 4. Text filter (runs before any AI spend)
Checks run in this order. The first match rejects the listing (`rejected_text`, with the reason stored):
1. No images → "No photo"
2. Title and description (lower-cased) contain a junk term → `Text screen: "<term>"`
3. Price null or ≤ 0 → "No asking price"

Junk terms: `wanted`, `recherche`, `cherche`, `suche`, `busco`, `cerco`, `gezocht`, `spare parts`, `pièces détachées`, `ersatzteile`, `flat pack`, `flat-pack`, `ikea`, `neuf sous emballage`, `neu ovp`, `nuevo a estrenar`, `nuovo imballato`.

Known weakness: plain substring matching. "recherche" (French for "sought after") rejected a real German listing that used the word in a description ("Text screen: recherche"). "suche" also matches "Besuche…". Use word boundaries and match only wanted-ad phrasing ("je recherche", "suche ein…").

At read time, the dealer's **excluded period terms** (all synonyms of excluded periods, in every language) are also matched against title and description.

## 5. Vision tagging
Model used for all 157 stored tags: `openai/gpt-6-astra`, via the Lovable AI gateway (`/v1/responses`), with low reasoning effort, `store:false`, strict structured output, a streaming call and no max_tokens or temperature. The first image (`image_urls[0]`) is sent as a file part with the URL. Descriptions are cut to 2,500 characters. A real call took about 10.6 s.
(The product owner has since asked to replace Astra with cheaper models, `google/gemini-3.1-flash-lite` with an `openai/gpt-6-luna` second opinion. That switch is planned but not built.)

### System prompt (the `${…}` placeholders are filled from the taxonomy below)
```text
You are Scout, a conservative antique and vintage furniture specialist screening marketplace listings for a UK dealer.
Classify only from the photo and supplied text. Listings may be in French, Spanish, German, Italian or Dutch.
category must be exactly one of: ${categories}, Other.
subcategory must be one of the subtypes listed for the chosen category, or null: ${Category: sub, sub; …}.
period and secondaryPeriod must be exactly one of: ${periods}, Unknown (secondaryPeriod may be null).
reproduction is "true" for reproductions, modern copies or "in the style of" pieces; "unsure" when you cannot tell.
resaleLowGbp/resaleHighGbp: realistic UK trade resale range in GBP after light cleaning. Use 0 for both if not furniture.
periodConfidence and valuationConfidence are 0 to 1. dealerNote is under 25 words. Keep redFlags short (max 4).
```
User message: `Title: …\nAsking price: <price> <currency>\nDescription: <≤2500 chars>`, plus the image.

### Taxonomy
- Categories: Chairs, Armchairs, Sofas, Tables, Desks, Sideboards, Cabinets, Chests of drawers, Beds, Mirrors, Lighting (plus Other).
- Sub-types: Chairs (Dining chairs, Side chairs, Desk chairs, Stools, Benches) · Armchairs (Club chairs, Wingbacks, Lounge chairs, Bergères, Rocking chairs) · Sofas (Two-seaters, Three-seaters, Daybeds, Chaises longues, Settees) · Tables (Dining tables, Coffee tables, Side tables, Console tables, Gateleg tables) · Desks (Writing desks, Bureaus, Partners desks, Secretaires) · Sideboards (Credenzas, Enfilades, Buffets, Servers) · Cabinets (Display cabinets, Bookcases, Wardrobes, Bar cabinets, Cupboards) · Chests of drawers (Commodes, Tallboys, Bedside chests, Dressers) · Beds (Double beds, Single beds, Headboards) · Mirrors (Wall mirrors, Overmantels, Floor mirrors, Dressing mirrors) · Lighting (Table lamps, Floor lamps, Pendants, Chandeliers, Wall lights).
- Periods: Baroque, Rococo, Georgian, Regency, Empire, Biedermeier, Louis Philippe, Victorian, Napoleon III, Arts and Crafts, Art Nouveau, Edwardian, Art Deco, Bauhaus and Modernist, Mid Century Modern, Scandinavian Modern, Space Age, Postmodern and Memphis, Brutalist, Country and Folk (plus Unknown).
- Profile keys for sub-types use the form `"Category › Sub-type"` in the same map as categories.

### Output JSON schema (strict, all fields required)
```json
{
  "type": "object", "additionalProperties": false,
  "required": ["isFurniture","category","subcategory","period","secondaryPeriod","decadeRange","style","originCountry","attribution","materials","conditionNotes","reproduction","redFlags","resaleLowGbp","resaleHighGbp","periodConfidence","valuationConfidence","dealerNote"],
  "properties": {
    "isFurniture": {"type": "boolean"},
    "category": {"type": "string"},
    "subcategory": {"type": ["string","null"]},
    "period": {"type": "string"},
    "secondaryPeriod": {"type": ["string","null"]},
    "decadeRange": {"type": "string"},
    "style": {"type": "string"},
    "originCountry": {"type": "string"},
    "attribution": {"type": ["string","null"]},
    "materials": {"type": "array", "items": {"type": "string"}},
    "conditionNotes": {"type": "string"},
    "reproduction": {"type": "string", "enum": ["true","false","unsure"]},
    "redFlags": {"type": "array", "items": {"type": "string"}},
    "resaleLowGbp": {"type": "number"},
    "resaleHighGbp": {"type": "number"},
    "periodConfidence": {"type": "number"},
    "valuationConfidence": {"type": "number"},
    "dealerNote": {"type": "string"}
  }
}
```
Post-processing: category not in the list → `Other`. A sub-type not under the chosen category → null. Period or secondaryPeriod not in the list → `Unknown`/null. Both confidences are clamped to 0–1. redFlags are cut to 4. `isFurniture:false` → `rejected_vision` "Not furniture". Otherwise the listing becomes `passed` at tag time, and the dealer rules below decide what each dealer sees.
Note: lamps count as furniture (category Lighting). 2 of 157 were judged not furniture.

## 6. Thresholds and dealer rules (applied at read time)
In order:
1. Not furniture → reject.
2. Source excluded → reject.
3. `price_gbp` below min or above max → reject.
4. Text contains an excluded-period synonym → reject.
5. Hide reproductions on and `reproduction == "true"` → reject. ("unsure" is not rejected.)
6. **Confident = periodConfidence > 0.6.** Confident and period excluded → reject.
7. Category excluded → reject. Sub-type excluded → reject.
8. If any sub-type of the category is included, the listing's sub-type must be one of them.
9. periodOk = period included, or (no period included anywhere and this one neutral). categoryOk works the same way, combined with the sub-type rule.
10. Confident, periodOk and categoryOk → **passed**. Confident and not periodOk → reject "Outside your periods". Otherwise → **maybe** ("Period uncertain" or "Category outside your picks").

Bargain score: `(resaleLow + resaleHigh)/2 − price_gbp`, multiplied by valuationConfidence and rounded. Percent = score / price. It is null for `offer` listings, and for `current_bid` lots unless they end within 24 h.

Observed in the data: reproduction was "unsure" on 110 of 157 listings, "true" on 46 and "false" on 1. The model rarely commits, so treating "unsure" as a rejection would empty the feed. Period was "Unknown" on 28 of 157.

## 7. Problems hit getting the four marketplaces working
1. **Actor IDs in URLs** need `owner~name`, not `owner/name`. Otherwise you get a 404.
2. **Array inputs:** Wallapop `query`, Kleinanzeigen `searchKeywords` and Catawiki `searchQueries` must be arrays. Leboncoin `searchQuery` is a string.
3. **Leboncoin `adLimit` has a minimum of 10.** We send max(10, limit).
4. **Leboncoin price shape:** `price` is an array. Use `price_euros`.
5. **Leboncoin dates have no timezone** (Paris local time). They are stored about 1–2 h late. Not fixed.
6. **Kleinanzeigen price is a string** and can be null for "VB" (negotiable). 2 listings were rejected as "No asking price".
7. **Kleinanzeigen offsets without a colon** (`+0200`). Fine in V8, but fragile elsewhere.
8. **Catawiki `buyNow` is an object** (`{price_eur}`), not a number. 1 Buy Now lot was mis-stored as a €6 current bid. Not fixed.
9. **Catawiki opening bids of €1–€5** on half the lots make margins absurd. Solved by scoring current bids only within 24 h of the end.
10. **Catawiki `sellerCountry` is used as the listing country.** This produces countries outside the 6 configured ones (Netherlands, Denmark, Poland and others).
11. **Seller personal data comes back even when you turn it off** (Leboncoin `owner.name`/`siren`/`user_id`, Wallapop `sellerId`, Kleinanzeigen `user.name`, Catawiki `sellerUserName`/`sellerShopName`). Descriptions can also contain seller Impressum blocks. Scrub before storing. (The live database still holds the unscrubbed `raw_json`. Only the export is scrubbed.)
12. **Link checks are blocked** by Leboncoin (bot challenge) and Catawiki (Akamai "Access Denied"), both server-side and in headless Chromium. You can't automatically tell whether those items have sold. We fell back to a 21-day cut-off plus the auction end time. Wallapop and Kleinanzeigen links checked fine.
13. **Images are hotlinked** from the marketplace CDNs and disappear when an ad is removed. A private storage bucket exists, but images are not copied into it yet.
14. **AI image input:** sending the image as an `image` part with a URL produced an AI SDK deprecation warning. We send it as a `file` part with `mediaType: image/jpeg`. Some CDN images could not be read. Those listings go to Maybe rather than being retried.
15. **Coverage is tiny:** the only fetch searched lamps (the profile in use had only Lighting included). That gave 8 searches × 20 items. eBay, Gumtree, Marktplaats and Subito actors are configured in `sources` (`automation-lab/ebay-scraper`, `memo23/gumtree-cheerio`, `haketa/marktplaats-scraper`, `nogards95/subito-scraper`), but they have no adapter and have never run.
16. **No schedule:** fetching and screening only run while a signed-in user has the page open. Move both to server-side scheduled jobs.
17. **Browser-use fallback** for hard sites was specified but never enabled: no browser-use model was available in the workspace's AI gateway.
18. **Fixed exchange rates** (EUR 0.86 and so on) are hard-coded and not updated.
