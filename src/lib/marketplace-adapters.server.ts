// Shared adapter contract: every marketplace turns a search into a provider input
// and maps provider items into one normalized listing shape. Nothing outside this
// file should know about provider-specific fields.

export type PriceKind = "fixed" | "offer" | "current_bid";

export type NormalizedListing = {
  listingUrl: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  priceKind: PriceKind;
  auctionEndTime: string | null;
  imageUrls: string[];
  location: string | null;
  sellerType: string | null;
  postedDate: string | null;
  country: string;
};

export type MarketplaceAdapter = {
  language: "fr" | "es" | "de" | "en" | "it" | "nl";
  buildInput: (query: string, limit: number) => Record<string, unknown>;
  normalize: (item: Record<string, unknown>) => NormalizedListing | null;
};

type Item = Record<string, unknown>;
const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const num = (value: unknown) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;
  return Number.isFinite(n) ? n : null;
};
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.startsWith("http")) : []);
const obj = (value: unknown): Item => (value && typeof value === "object" && !Array.isArray(value) ? (value as Item) : {});
const isoDate = (value: unknown) => {
  const s = str(value);
  if (!s) return null;
  const d = new Date(s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export const adapters: Record<string, MarketplaceAdapter> = {
  Leboncoin: {
    language: "fr",
    buildInput: (query, limit) => ({ searchQuery: query, adLimit: Math.max(10, limit), includeSeller: false }),
    normalize: (item) => {
      const url = str(item["url"]);
      const title = str(item["subject"]);
      if (!url || !title) return null;
      const images = obj(item["images"]);
      const location = obj(item["location"]);
      const owner = obj(item["owner"]);
      const priceList = Array.isArray(item["price"]) ? item["price"] : [];
      return {
        listingUrl: url, title, description: str(item["body"]),
        price: num(item["price_euros"]) ?? num(priceList[0]), currency: "EUR", priceKind: "fixed", auctionEndTime: null,
        imageUrls: strings(images["urls_large"]).length ? strings(images["urls_large"]) : strings(images["urls"]),
        location: str(location["city_label"]) ?? str(item["location_summary"]), sellerType: str(owner["type"]),
        postedDate: isoDate(item["first_publication_date"]), country: "France",
      };
    },
  },
  Wallapop: {
    language: "es",
    buildInput: (query, limit) => ({ query: [query], country: "ES", maxResults: limit }),
    normalize: (item) => {
      const url = str(item["url"]);
      const title = str(item["title"]);
      if (!url || !title) return null;
      const images = strings(item["imageUrls"]);
      const single = str(item["imageUrl"]);
      return {
        listingUrl: url, title, description: str(item["description"]),
        price: num(item["price"]), currency: str(item["currency"]) ?? "EUR", priceKind: "fixed", auctionEndTime: null,
        imageUrls: images.length ? images : single ? [single] : [],
        location: [str(item["city"]), str(item["region"])].filter(Boolean).join(", ") || null,
        sellerType: item["sellerIsShop"] === true ? "pro" : "private", postedDate: isoDate(item["createdAt"]), country: "Spain",
      };
    },
  },
  Kleinanzeigen: {
    language: "de",
    buildInput: (query, limit) => ({ searchKeywords: [query], maxResultsPerSearch: limit, pictureRequired: true }),
    normalize: (item) => {
      const url = str(item["url"]);
      const title = str(item["title"]);
      if (!url || !title) return null;
      const user = obj(item["user"]);
      const priceType = str(item["priceType"]);
      return {
        listingUrl: url, title, description: str(item["description"]),
        price: num(item["price"]), currency: "EUR", priceKind: priceType === "negotiable" || priceType === "give_away" ? "offer" : "fixed",
        auctionEndTime: null, imageUrls: strings(item["images"]), location: str(item["location"]),
        sellerType: str(user["sellerType"]), postedDate: isoDate(item["publishTimestamp"]), country: "Germany",
      };
    },
  },
  Catawiki: {
    language: "en",
    buildInput: (query, limit) => ({ searchQueries: [query], maxResults: limit, language: "en" }),
    normalize: (item) => {
      const url = str(item["url"]);
      const title = str(item["title"]);
      if (!url || !title) return null;
      const images = strings(item["images"]);
      const original = str(item["originalImageUrl"]);
      const buyNow = num(item["buyNow"]);
      return {
        listingUrl: url, title, description: str(item["translatedDescription"]) ?? str(item["description"]),
        price: buyNow ?? num(item["currentBidValue"]), currency: str(item["currentBidCurrency"]) ?? "EUR",
        priceKind: buyNow ? "fixed" : "current_bid", auctionEndTime: isoDate(item["biddingEndTime"]),
        imageUrls: images.length ? images : original ? [original] : [],
        location: str(item["sellerCountry"]), sellerType: "pro", postedDate: isoDate(item["biddingStartTime"]),
        country: str(item["sellerCountry"]) ?? "Europe",
      };
    },
  },
};

// Fixed conversion table (GBP per unit), per the spec.
const gbpRates: Record<string, number> = { GBP: 1, EUR: 0.86, USD: 0.75, SEK: 0.072, DKK: 0.115, CHF: 0.9 };
export const toGbp = (price: number | null, currency: string) => {
  const rate = gbpRates[currency.toUpperCase()];
  return price === null || rate === undefined ? null : Math.round(price * rate * 100) / 100;
};

const categoryWords: Record<string, Record<MarketplaceAdapter["language"], string>> = {
  Chairs: { en: "chair", fr: "chaise", de: "stuhl", es: "silla", it: "sedia", nl: "stoel" },
  Armchairs: { en: "armchair", fr: "fauteuil", de: "sessel", es: "sillón", it: "poltrona", nl: "fauteuil" },
  Sofas: { en: "sofa", fr: "canapé", de: "sofa", es: "sofá", it: "divano", nl: "bank" },
  Tables: { en: "table", fr: "table", de: "tisch", es: "mesa", it: "tavolo", nl: "tafel" },
  Desks: { en: "desk", fr: "bureau", de: "schreibtisch", es: "escritorio", it: "scrivania", nl: "bureau" },
  Sideboards: { en: "sideboard", fr: "enfilade", de: "sideboard", es: "aparador", it: "credenza", nl: "dressoir" },
  Cabinets: { en: "cabinet", fr: "buffet", de: "schrank", es: "vitrina", it: "mobile", nl: "kast" },
  "Chests of drawers": { en: "chest of drawers", fr: "commode", de: "kommode", es: "cómoda", it: "cassettiera", nl: "ladekast" },
  Beds: { en: "bed", fr: "lit", de: "bett", es: "cama", it: "letto", nl: "bed" },
  Mirrors: { en: "mirror", fr: "miroir", de: "spiegel", es: "espejo", it: "specchio", nl: "spiegel" },
  Lighting: { en: "lamp", fr: "lampe", de: "lampe", es: "lámpara", it: "lampada", nl: "lamp" },
};

// Combine included periods with included categories, translated into the marketplace language.
export function buildQueries(adapter: MarketplaceAdapter, periods: string[], categories: string[], periodTerms: Map<string, string>, cap: number) {
  const periodList = periods.length ? periods : ["vintage"];
  const categoryList = categories.length ? categories : [""];
  const queries: string[] = [];
  for (const category of categoryList) {
    for (const period of periodList) {
      const term = periodTerms.get(`${period}|${adapter.language}`) ?? period.toLowerCase();
      const word = category ? categoryWords[category]?.[adapter.language] ?? category.toLowerCase() : "";
      const q = adapter.language === "en" ? `${term} ${word}` : `${word} ${term}`;
      queries.push(q.trim());
      if (queries.length >= cap) return [...new Set(queries)];
    }
  }
  return [...new Set(queries)];
}
