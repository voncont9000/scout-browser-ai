# Apify actor contracts

These are the four working marketplaces, taken from the successful runs on 2026-10-06. Every actor was called through the Lovable connector gateway (`https://connector-gateway.lovable.dev/apify`), which mirrors the Apify REST API v2:

- Start: `POST /acts/{owner}~{name}/runs?timeout=240`, with the JSON input as the body. The `/` in the actor ID must become `~`.
- Poll: `GET /actor-runs/{runId}`, and read `data.status` (READY, RUNNING, SUCCEEDED, FAILED, TIMED-OUT or ABORTED) and `data.defaultDatasetId`.
- Items: `GET /datasets/{datasetId}/items?clean=true&limit=20`.
- Run options recorded by Apify: build `latest`, timeout 240 s, memory 256–512 MB. All 8 runs took 7–13 s and cost US$0.01–0.06 each.

**Version note:** we called the `latest` build. The build numbers below are what actually ran. Pin them, for example with `?build=0.0.223`, to reproduce our results exactly.

The input sent = the source's stored `input_template` merged with the adapter's `buildInput(query, 20)`. Apify records the stored input with the actor's defaults filled in. Both versions are shown below.

Seller personal data (names, IDs, profile pictures, shop and contact fields, exact coordinates) has been removed from the sample items. Long strings and arrays are shortened. Full scrubbed items for every listing are in `listings_export.json` → `raw_json`.


---

## Leboncoin (France)

| | |
|---|---|
| Actor | `clearpath/leboncoin-api` (Apify actId `nfWPDHJzRb80PsNo1`) |
| Version that ran | build **0.0.223** (buildId `3geOxcAhqWyEb9gPB`) |
| Successful runs | 2/2 SUCCEEDED, 20 items each. Queries: lampe art déco / lampe moderniste années 50 |
| Sample run | `z587EcQwwSaHfQCHa` |

### Input
Stored input template:
```json
{
  "adLimit": 10,
  "includeSeller": false
}
```
Added by the adapter (`buildInput`):
```json
{
  "searchQuery": "<query>",
  "adLimit": "max(10, ITEMS_PER_RUN=20)",
  "includeSeller": false
}
```
Exact input of the successful run, as Apify recorded it (defaults filled in):
```json
{
  "adLimit": 20,
  "includeSeller": false,
  "searchQuery": "lampe art déco",
  "category": "0",
  "radius": 5,
  "sortBy": "relevance",
  "search_in_title_only": false,
  "seller_type": "all",
  "urgent": false,
  "donation": false,
  "shippable": true,
  "includePhone": false,
  "mode": "standard",
  "telegramNotificationLimit": 10,
  "webhookNotificationLimit": 100
}
```

### One raw output item (seller data removed, shortened)
```json
{
  "url": "https://www.leboncoin.fr/ad/antiquites/3273894168",
  "body": "Je vends cette lampe Art Déco de Paul Milet, une pièce emblématique des années 1930. Cet objet apportera une touche rétro et élégante à votre intérieur.\n- Type d'objet : Lampe\n- Créateur : Paul Milet\n- Époque : Années 1930\n- Style : Art Déco\n- Matière : Céramique émaillée .\nTrès … (truncated)",
  "brand": "leboncoin",
  "owner": {
    "type": "private",
    "no_salesmen": true,
    "activity_sector": ""
  },
  "price": [
    190
  ],
  "images": {
    "urls": [
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/06/3e/02/063e02e34f343dafe3eaaf4b428152d0f949518f.jpg?rule=ad-image",
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/cb/ad/e3/cbade34b97e67c8214ed81d432e4e76ebbfa32eb.jpg?rule=ad-image",
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/ef/a6/4d/efa64d769ce62b884087a1e47148290f71fa79a6.jpg?rule=ad-image"
    ],
    "nb_images": 3,
    "small_url": "https://img.leboncoin.fr/api/v1/lbcpb1/images/06/3e/02/063e02e34f343dafe3eaaf4b428152d0f949518f.jpg?rule=ad-small",
    "thumb_url": "https://img.leboncoin.fr/api/v1/lbcpb1/images/06/3e/02/063e02e34f343dafe3eaaf4b428152d0f949518f.jpg?rule=ad-thumb",
    "urls_large": [
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/06/3e/02/063e02e34f343dafe3eaaf4b428152d0f949518f.jpg?rule=ad-large",
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/cb/ad/e3/cbade34b97e67c8214ed81d432e4e76ebbfa32eb.jpg?rule=ad-large",
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/ef/a6/4d/efa64d769ce62b884087a1e47148290f71fa79a6.jpg?rule=ad-large"
    ],
    "urls_thumb": [
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/06/3e/02/063e02e34f343dafe3eaaf4b428152d0f949518f.jpg?rule=ad-thumb",
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/cb/ad/e3/cbade34b97e67c8214ed81d432e4e76ebbfa32eb.jpg?rule=ad-thumb",
      "https://img.leboncoin.fr/api/v1/lbcpb1/images/ef/a6/4d/efa64d769ce62b884087a1e47148290f71fa79a6.jpg?rule=ad-thumb"
    ]
  },
  "status": "active",
  "ad_type": "offer",
  "list_id": 3273894168,
  "options": {
    "urgent": false,
    "booster": false,
    "gallery": false,
    "photosup": false,
    "highlight": false,
    "has_option": false,
    "sub_toplist": false,
    "continuous_top_ads": false
  },
  "similar": null,
  "subject": "Lampe Art Déco Paul Milet",
  "counters": {},
  "location": {
    "city": "Saint-Maur-des-Fossés",
    "type": "",
    "source": "address",
    "zipcode": "94100",
    "district": "Adamville",
    "is_shape": false,
    "provider": "here",
    "region_id": "12",
    "city_label": "Saint-Maur-des-Fossés 94100 Adamville",
    "country_id": "FR",
    "origin_type": "",
    "region_name": "Ile-de-France",
    "department_id": "94",
    "department_name": "Val-de-Marne"
  },
  "buyer_fee": {
    "amount": 199
  },
  "condition": "Très bon état",
  "has_phone": false,
  "old_price": "240",
  "attributes": [
    {
      "key": "rating_score",
      "value": "1",
      "values": [
        "1"
      ],
      "generic": false,
      "value_label": "1"
    },
    {
      "key": "rating_count",
      "value": "4",
      "values": [
        "4"
      ],
      "generic": false,
      "value_label": "4"
    },
    {
      "key": "estimated_parcel_weight",
      "value": "500",
      "values": [
        "500"
      ],
      "generic": false,
      "value_label": "500"
    },
    "… (truncated)"
  ],
  "index_date": "2026-09-21 12:02:12",
  "scraped_at": "2026-10-06T18:59:30.450474+00:00",
  "antique_era": "Années 1930",
  "category_id": "89",
  "data_source": "search",
  "price_cents": 19000,
  "price_euros": 190,
  "actor_run_id": "z587EcQwwSaHfQCHa",
  "is_shippable": true,
  "search_query": "lampe art déco",
  "antique_style": "Art déco",
  "category_name": "Toutes catégories",
  "antique_product": "Décor et objets d'art",
  "payment_methods": "installments3x",
  "actor_input_hash": "5655576633041061880",
  "location_summary": "Saint-Maur-des-Fossés (94100)",
  "scraped_at_timestamp": 1791313170,
  "first_publication_date": "2026-09-21 12:02:12"
}
```

### Field mapping into `listings`
| Our field | Source path | Notes |
|---|---|---|
| listing_url | `url` | Required; item dropped if missing. Dedup key. |
| title | `subject` | Required. |
| description | `body` | |
| price | `price_euros`, else `price[0]` | `price` is an **array** of integers. |
| currency | constant `EUR` | No currency field in output. |
| price_kind | constant `fixed` | |
| auction_end_time | null | |
| image_urls | `images.urls_large`, else `images.urls` | |
| location | `location.city_label`, else `location_summary` | |
| seller_type | `owner.type` | `private` / `pro`. |
| posted_date | `first_publication_date` | |
| country | constant `France` | |

All adapters: `price_gbp = round(price × rate, 2)` from a fixed table (GBP 1, EUR 0.86, USD 0.75, SEK 0.072, DKK 0.115, CHF 0.9). It is null for unknown currencies. `raw_json` stores the whole item. Dedup is `upsert … on conflict (listing_url) do nothing`.

### Parsing quirks
- **Price:** `price` is an array (`[190]`), `price_euros` is a number (190), `price_cents` is an integer (19000). We use `price_euros`, then fall back to `price[0]`. `old_price` is a string ("240"), the price before a reduction. It is not used.
- **Currency:** never present. Always EUR.
- **Dates:** `first_publication_date` and `index_date` look like `"2026-09-21 12:02:12"`, with a space and no timezone. They are Paris local time. Our parser swaps the space for `T` and JS then reads it in the server's timezone (UTC), so stored `posted_date` values are 1–2 hours late. A rebuild should parse them as Europe/Paris.
- **Images:** `images.urls` (`?rule=ad-image`), `urls_large` (`?rule=ad-large`) and `urls_thumb` point to the same file with a different `rule` query parameter. Some items have only `urls`. Item counts range from 1 to 20 images.
- **Seller data:** `owner` holds `name`, `user_id`, `store_id` and `siren` (company number), even with `includeSeller:false`. `attributes[]` contains `profile_picture_url`. Strip these before storing. Keep `includePhone:false`.
- **Search location:** with no location set, the actor searches all of France. `radius: 5` is ignored without a location. `shippable: true` is an actor default, so results lean towards shippable ads.
- **Link checks:** leboncoin.fr blocks automated link checks with 403 or a bot challenge. A failed server-side check does not mean the ad is gone.


---

## Wallapop (Spain)

| | |
|---|---|
| Actor | `blackfalcondata/wallapop-scraper` (Apify actId `vscFTyDUhcg97BhBV`) |
| Version that ran | build **0.1.24** (buildId `aMSFGfdkj1IhQAmQd`) |
| Successful runs | 2/2 SUCCEEDED, 20 items each. Queries: lámpara art déco / lámpara moderno de mediados de siglo |
| Sample run | `s7zyHHZN5n6HggS5W` |

### Input
Stored input template:
```json
{
  "country": "ES",
  "includeDetails": false
}
```
Added by the adapter (`buildInput`):
```json
{
  "query": [
    "<query>"
  ],
  "country": "ES",
  "maxResults": 20
}
```
Exact input of the successful run, as Apify recorded it (defaults filled in):
```json
{
  "country": "ES",
  "includeDetails": false,
  "query": [
    "lámpara art déco"
  ],
  "maxResults": 20,
  "category": "",
  "location": [],
  "startUrls": [],
  "watchSellerIds": [],
  "sortBy": "most_relevance",
  "postedWithin": "all",
  "sellerType": "",
  "condition": "",
  "carHasWarranty": false,
  "includeSellerProfile": false,
  "descriptionMaxLength": 0,
  "descriptionFormat": "all",
  "excludeEmptyFields": false,
  "compact": false,
  "incrementalMode": false,
  "emitUnchanged": false,
  "emitExpired": false,
  "skipReposts": false,
  "notificationLimit": 5,
  "notifyOnlyChanges": false
}
```

### One raw output item (seller data removed, shortened)
```json
{
  "url": "https://es.wallapop.com/item/lampara-de-techo-art-deco-beige-y-dorada-1280353278",
  "city": "Madrid",
  "carKm": null,
  "price": 22,
  "title": "Lámpara de techo Art Decó Beige y Dorada",
  "views": null,
  "itemId": "nzxen25yge62",
  "region": "Comunidad de Madrid",
  "source": "wallapop.com",
  "carFuel": null,
  "carYear": null,
  "webSlug": "lampara-de-techo-art-deco-beige-y-dorada-1280353278",
  "carBrand": null,
  "carDoors": null,
  "carModel": null,
  "carSeats": null,
  "category": "Hogar y jardín",
  "currency": "EUR",
  "imageUrl": "https://cdn.wallapop.com/images/10420/l6/ae/__/c10420p1280353278/i6609348779.jpg?pictureSize=W800",
  "isBumped": true,
  "isRepost": null,
  "reserved": false,
  "condition": null,
  "createdAt": "2026-07-09T19:53:19.367Z",
  "expiredAt": null,
  "imageUrls": [
    "https://cdn.wallapop.com/images/10420/l6/ae/__/c10420p1280353278/i6609348779.jpg?pictureSize=W800",
    "https://cdn.wallapop.com/images/10420/l6/ae/__/c10420p1280353278/i6609348786.jpg?pictureSize=W800"
  ],
  "listingId": "6bd7c0112f4a7de64ac7948ab03df5660f498e96d1de59e936b9eaa68e3f6d9a",
  "portalUrl": "https://es.wallapop.com/item/lampara-de-techo-art-deco-beige-y-dorada-1280353278",
  "priceText": "22 €",
  "scrapedAt": "2026-10-06T18:59:34.090Z",
  "attributes": [],
  "carGearbox": null,
  "carPowerKw": null,
  "carVersion": null,
  "categoryId": 12467,
  "changeType": null,
  "distanceKm": 8.68,
  "imageCount": 2,
  "lastSeenAt": null,
  "modifiedAt": "2026-09-21T09:42:34.983Z",
  "postalCode": "28043",
  "repostOfId": null,
  "sellerType": null,
  "carBodyType": null,
  "carEcoLabel": null,
  "contentHash": "aea1a7a3e3e25f9c1d54cca39fc069fba7442832b2319fee31776beba4dec079",
  "countryCode": "ES",
  "description": "Elegante lámpara de techo con un diseño inspirado en el estilo Art Decó. Aporta una luz cálida y acogedora a cualquier estancia.\n\n- Acabado en tonos beige y dorado.\n- Combina cristal y metal en su fabricación.",
  "firstSeenAt": null,
  "hasWarranty": false,
  "isShippable": true,
  "searchQuery": "lámpara art déco",
  "sellerScore": null,
  "subcategory": "Apliques, lámparas, pantallas y bases",
  "categoryPath": "Hogar y jardín > Iluminación > Apliques, lámparas, pantallas y bases",
  "publishedAge": "88d",
  "sellerIsShop": false,
  "carHorsePower": null,
  "detailFetched": false,
  "isRefurbished": false,
  "contentQuality": "serp_only",
  "favoritesCount": null,
  "previousSeenAt": null,
  "shippingAllowed": false,
  "carFinancedPrice": null,
  "repostDetectedAt": null,
  "sellerIsVerified": false,
  "carWarrantyMonths": null,
  "sellerKycVerified": null,
  "isTopProfileSeller": true,
  "sellerRegisteredAt": null,
  "sellerResponseRate": null,
  "sellerEmailVerified": null,
  "sellerPhoneVerified": null,
  "sellerRatingAverage": null
}
```

### Field mapping into `listings`
| Our field | Source path | Notes |
|---|---|---|
| listing_url | `url` | `portalUrl` is identical. |
| title | `title` | |
| description | `description` | |
| price | `price` | Number. |
| currency | `currency`, else `EUR` | |
| price_kind | constant `fixed` | |
| auction_end_time | null | |
| image_urls | `imageUrls`, else `[imageUrl]` | |
| location | `city`, `region` joined with ", " | |
| seller_type | `sellerIsShop === true` ? `pro` : `private` | `sellerType` is always null. |
| posted_date | `createdAt` | ISO with Z. |
| country | constant `Spain` | |

All adapters: `price_gbp = round(price × rate, 2)` from a fixed table (GBP 1, EUR 0.86, USD 0.75, SEK 0.072, DKK 0.115, CHF 0.9). It is null for unknown currencies. `raw_json` stores the whole item. Dedup is `upsert … on conflict (listing_url) do nothing`.

### Parsing quirks
- **Price:** a clean number. `priceText` is a display string ("22 €").
- **Query:** `query` must be an **array** of strings, not a string.
- **Details:** with `includeDetails:false`, `contentQuality` is `serp_only`. Descriptions come from the search page and may be shorter than on the ad itself. Many fields are null (`views`, `condition`, `sellerType`, every `car*` field).
- **Dates:** `createdAt` is ISO UTC. `createdAt` is not when the ad first went live: bumped ads (`isBumped:true`) keep their original date. `publishedAge` is a display string ("88d").
- **Images:** `cdn.wallapop.com/...jpg?pictureSize=W800`. The `pictureSize` parameter sets the resolution. Up to 17 per item.
- **Seller data:** returns `sellerId` on every item, and `seller*`/`shop*` fields (name, email, phone, address, registration numbers). These were null in our runs because `includeSellerProfile:false`, but strip them regardless.
- **Location:** `latitude`/`longitude`/`postalCode`/`distanceKm` are relative to a default Madrid point. Treat them as approximate. Exact coordinates are not stored in the export.


---

## Kleinanzeigen (Germany)

| | |
|---|---|
| Actor | `beatanalytics/kleinanzeigen-scraper` (Apify actId `B4kw6bIB0k4Xffgnu`) |
| Version that ran | build **1.0.13** (buildId `B3nMFKcG8xqUB2K40`) |
| Successful runs | 2/2 SUCCEEDED, 20 items each. Queries: lampe art déco / lampe mid century |
| Sample run | `T9dTqLDty8fCGOdXG` |

### Input
Stored input template:
```json
{
  "pictureRequired": true
}
```
Added by the adapter (`buildInput`):
```json
{
  "searchKeywords": [
    "<query>"
  ],
  "maxResultsPerSearch": 20,
  "pictureRequired": true
}
```
Exact input of the successful run, as Apify recorded it (defaults filled in):
```json
{
  "pictureRequired": true,
  "searchKeywords": [
    "lampe art déco"
  ],
  "maxResultsPerSearch": 20,
  "searchRadius": "0",
  "sort": "recommended",
  "buyNowOnly": false,
  "shippable": false
}
```

### One raw output item (seller data removed, shortened)
```json
{
  "id": 3533337838,
  "url": "https://www.kleinanzeigen.de/s-anzeige/3533337838",
  "user": {
    "badges": [],
    "sellerType": "private",
    "memberSince": "2014-07-12T14:22:49.000+0200",
    "isCommercial": false
  },
  "media": [],
  "price": "199.00",
  "title": "Antike Art-Déco Tischlampe um 1930 – Marmor & Vogelmotiv – Unikat",
  "adType": "offered",
  "images": [
    "https://img.kleinanzeigen.de/api/v1/prod-ads/images/ff/ff6362a7-902b-479f-8397-0c227e85d111?rule=$_59.JPG",
    "https://img.kleinanzeigen.de/api/v1/prod-ads/images/55/55941f75-920b-4496-be83-3b4298f958ff?rule=$_59.JPG",
    "https://img.kleinanzeigen.de/api/v1/prod-ads/images/ac/acfd66c0-3a9b-4745-aea8-5b444294feb9?rule=$_59.JPG",
    "… (truncated)"
  ],
  "_search": {
    "rank": 2,
    "keywords": "lampe art déco",
    "location": null
  },
  "regions": [
    "Berlin"
  ],
  "category": "Lampen & Licht",
  "location": "12105 Tempelhof",
  "shipping": "Versand möglich",
  "documents": [],
  "priceType": "fixed",
  "categoryId": 82,
  "promotions": [],
  "properties": [
    {
      "key": "lampen_licht.color",
      "name": "Farbe",
      "value": "Andere Farben",
      "valueKeys": [
        "sonstige"
      ]
    },
    {
      "key": "lampen_licht.condition",
      "name": "Zustand",
      "value": "Gut",
      "valueKeys": [
        "ok"
      ]
    },
    {
      "key": "lampen_licht.material",
      "name": "Material",
      "value": "Sonstige",
      "valueKeys": [
        "other"
      ]
    }
  ],
  "description": "Ja, dann korrigiert:\n\nSehr dekorative antike Tischlampe im Art-Déco-Stil, vermutlich aus den 1920er/30er Jahren, mit außergewöhnlichem Vogelmotiv.\n\nDer aufwendig gearbeitete Schaft zeigt drei stilisierte Vögel und sitzt auf einem massiven Marmorsockel. Der Sockel wurde eigens für… (truncated)",
  "publishDate": "2026-10-06",
  "publishTime": "20:32",
  "offerPossible": true,
  "buyNowPossible": true,
  "shippingOptions": [
    {
      "type": "DHL_003",
      "price": null
    }
  ],
  "parentCategoryId": 80,
  "publishTimestamp": "2026-10-06T20:32:28.000+0200",
  "lastEditTimestamp": "2026-10-06T20:32:27.000+0200",
  "buyerProtectionFee": "9.46",
  "securePaymentPossible": false
}
```

### Field mapping into `listings`
| Our field | Source path | Notes |
|---|---|---|
| listing_url | `url` | `https://www.kleinanzeigen.de/s-anzeige/<id>` |
| title | `title` | |
| description | `description` | |
| price | `price` | **String** ("199.00"), parsed with parseFloat. Can be null. |
| currency | constant `EUR` | |
| price_kind | `priceType` `negotiable` or `give_away` → `offer`, else `fixed` | |
| auction_end_time | null | |
| image_urls | `images` | |
| location | `location` | "12105 Tempelhof" (postcode plus district). |
| seller_type | `user.sellerType` | `private` / `commercial`. |
| posted_date | `publishTimestamp` | |
| country | constant `Germany` | |

All adapters: `price_gbp = round(price × rate, 2)` from a fixed table (GBP 1, EUR 0.86, USD 0.75, SEK 0.072, DKK 0.115, CHF 0.9). It is null for unknown currencies. `raw_json` stores the whole item. Dedup is `upsert … on conflict (listing_url) do nothing`.

### Parsing quirks
- **Price:** a string with two decimals. `priceType` was `fixed` 23 times and `negotiable` ("VB") 17 times. 2 negotiable items had `price: null`, so the text filter rejected them as "No asking price". A negotiable price is an asking price with room to haggle, and we show it as an offer listing, so it gets no margin. Rebuild teams may want to treat VB with a price as fixed for margin purposes.
- **Dates:** `publishTimestamp` is `"2026-10-06T20:32:28.000+0200"`, with an offset that has no colon. V8 parses it correctly (to 18:32Z), but some strict ISO parsers reject it. `publishDate` and `publishTime` are split local strings.
- **Images:** `img.kleinanzeigen.de/api/v1/prod-ads/images/<xx>/<uuid>?rule=$_59.JPG`. The `rule` sets the size, and the literal `$` must stay URL-safe when the URL is rebuilt. `pictureRequired:true` keeps out ads with no photo.
- **Search scope:** `searchRadius: "0"` with no location searches all of Germany.
- **Seller data:** `user.id`, `user.name` and `user.storeId` are returned. Strip them. Commercial sellers often paste an Impressum (name, address, phone) into `description`. We found one, and it is masked in the export. Mask emails, phones and Impressum blocks in descriptions.
- **Links:** opened fine in server-side checks.


---

## Catawiki (Pan-European auctions)

| | |
|---|---|
| Actor | `solidcode/catawiki-scraper` (Apify actId `QTrnOIawbsrrFCGI7`) |
| Version that ran | build **1.0.16** (buildId `v9ViRa7nEPaHqdpnM`) |
| Successful runs | 2/2 SUCCEEDED, 20 items each. Queries: art deco lamp / mid century modern lamp |
| Sample run | `WIUhdNPbcqPBAoYML` |

### Input
Stored input template:
```json
{}
```
Added by the adapter (`buildInput`):
```json
{
  "searchQueries": [
    "<query>"
  ],
  "maxResults": 20,
  "language": "en"
}
```
Exact input of the successful run, as Apify recorded it (defaults filled in):
```json
{
  "searchQueries": [
    "art deco lamp"
  ],
  "maxResults": 20,
  "language": "en",
  "sortBy": "best_match_desc"
}
```

### One raw output item (seller data removed, shortened)
```json
{
  "id": 107170954,
  "url": "https://www.catawiki.com/en/l/107170954-art-deco-lamp-lamp-chrome-and-glass",
  "title": "Art deco lamp - Lamp - chrome and glass",
  "buyNow": null,
  "images": [
    "https://assets.catawiki.nl/assets/2026/9/25/a/3/a/a3a480eb-885f-490d-9cde-4652ca7eba5c.jpg",
    "https://assets.catawiki.nl/assets/2026/9/25/4/3/7/43763d8a-afd7-4269-aeee-7e5fec844dff.jpg",
    "https://assets.catawiki.nl/assets/2026/9/25/2/c/5/2c5687c1-907e-43ae-b0c8-4758857b57f2.jpg",
    "… (truncated)"
  ],
  "subtitle": "France - Art Deco - 1940-1950 ",
  "auctionId": 1275654,
  "localized": true,
  "categoryId": 81,
  "currentBid": {
    "EUR": 1,
    "GBP": 1,
    "USD": 1
  },
  "categoryUrl": "https://www.catawiki.com/en/c/81-art-nouveau-art-deco-furniture",
  "closeStatus": "open",
  "description": "Mooie art deco lamp in chroom en glas .\nIk denk dat deze van Franse afkomst kan zijn maar kan eigenlijk van meerdere landen afkomstig zijn .\nStukje  art deco als deze lamp past in elk interieur!!\nVind u de glazen kap niet naar uw smaak ,kan u makkelijk vervangen door een bv gesat… (truncated)",
  "categoryName": "Art Nouveau & Art Deco Furniture",
  "favoriteCount": 2,
  "sellerCountry": "Belgium",
  "thumbImageUrl": "https://assets.catawiki.nl/assets/2026/9/25/a/3/a/thumb2_a3a480eb-885f-490d-9cde-4652ca7eba5c.jpg",
  "biddingEndTime": "2026-10-11T12:03:10Z",
  "categoryL0Name": "Interiors & Decorations",
  "categoryL1Name": "Antiques & Classic Furniture",
  "scrapedFromUrl": "art deco lamp",
  "currentBidValue": 1,
  "hasFreeShipping": false,
  "reservePriceMet": null,
  "reservePriceSet": false,
  "biddingStartTime": "2026-10-05T16:00:00+00:00",
  "originalImageUrl": "https://assets.catawiki.nl/assets/2026/9/25/a/3/a/a3a480eb-885f-490d-9cde-4652ca7eba5c.jpg",
  "isBuyNowAvailable": false,
  "isContentExplicit": false,
  "currentBidCurrency": "EUR",
  "translatedDescription": "Beautiful Art Deco lamp in chrome and glass.\nI think this one may be of French origin but could actually come from several countries.\nA touch of Art Deco that fits into any interior!!\nIf you don't care for the glass shade, you can easily replace it with, for example, a satin-fini… (truncated)"
}
```

### Field mapping into `listings`
| Our field | Source path | Notes |
|---|---|---|
| listing_url | `url` | `https://www.catawiki.com/en/l/<id>-<slug>` |
| title | `title` | |
| description | `translatedDescription`, else `description` | The original is in the seller's language. |
| price | `buyNow` (as a number), else `currentBidValue` | See the buyNow bug below. |
| currency | `currentBidCurrency`, else `EUR` | |
| price_kind | `buyNow` truthy ? `fixed` : `current_bid` | |
| auction_end_time | `biddingEndTime` | ISO with Z. |
| image_urls | `images`, else `[originalImageUrl]` | |
| location | `sellerCountry` | |
| seller_type | constant `pro` | |
| posted_date | `biddingStartTime` | |
| country | `sellerCountry`, else `Europe` | Real country names, e.g. "The Netherlands", "Belgium". |

All adapters: `price_gbp = round(price × rate, 2)` from a fixed table (GBP 1, EUR 0.86, USD 0.75, SEK 0.072, DKK 0.115, CHF 0.9). It is null for unknown currencies. `raw_json` stores the whole item. Dedup is `upsert … on conflict (listing_url) do nothing`.

### Parsing quirks
- **buyNow bug (known, not fixed):** `buyNow` is either `null` or an **object** `{"price_eur": 133}`. It is not a number. Our `num()` helper returns null for objects, so the one Buy Now lot in our data was stored as `current_bid` at its €6 bid. Read `buyNow.price_eur` when `isBuyNowAvailable` is true.
- **Current bids:** `currentBid` holds the bid in EUR, GBP and USD (`{"EUR":170,"GBP":145,"USD":193}`). `currentBidValue` and `currentBidCurrency` give the same bid in one currency. 20 of the 40 lots were at an opening bid of €1–€5, which is meaningless as a price. Our margin is only calculated for current bids within 24 hours of `biddingEndTime`, and you should do the same.
- **Auction end:** `biddingEndTime` is ISO UTC ("2026-10-11T12:03:10Z"). `biddingStartTime` uses `+00:00`. `closeStatus` is `open` while live. The feed hides lots once `auction_end_time` has passed.
- **Reserve:** `reservePriceSet` and `reservePriceMet` matter for real value but are not used.
- **Images:** `assets.catawiki.nl/assets/YYYY/M/D/a/b/c/<uuid>.jpg`. `thumbImageUrl` adds a `thumb2_` prefix to the filename.
- **Seller data:** `sellerId`, `sellerUserName`, `sellerShopName` and `sellerUrl` are returned. Strip them. Keep only `sellerCountry`.
- **Category:** results come from all categories. Our lamp searches returned lamps from "Art Nouveau & Art Deco Furniture" and also from lighting and decor categories.
- **Links:** catawiki.com answers "Access Denied" (Akamai) to server-side and headless-browser checks. That does not mean the lot is gone. Users with a VPN may see the same.
