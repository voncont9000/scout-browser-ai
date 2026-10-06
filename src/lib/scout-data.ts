import artDecoChair from "@/assets/art-deco-chair.jpg";
import bauhausChair from "@/assets/bauhaus-chair.jpg";
import spaceAgeLamp from "@/assets/space-age-lamp.jpg";
import teakSideboard from "@/assets/teak-sideboard.jpg";

export type TriState = "include" | "neutral" | "exclude";

export const periods = [
  "Baroque", "Rococo", "Georgian", "Regency", "Empire", "Biedermeier",
  "Louis Philippe", "Victorian", "Napoleon III", "Arts and Crafts", "Art Nouveau",
  "Edwardian", "Art Deco", "Bauhaus and Modernist", "Mid Century Modern",
  "Scandinavian Modern", "Space Age", "Postmodern and Memphis", "Brutalist", "Country and Folk",
];

export const categories = [
  "Chairs", "Armchairs", "Sofas", "Tables", "Desks", "Sideboards",
  "Cabinets", "Chests of drawers", "Beds", "Mirrors", "Lighting",
];

export const countries = ["United Kingdom", "France", "Germany", "Spain", "Italy", "Netherlands"];
export const sources = ["Leboncoin", "Wallapop", "Kleinanzeigen", "Catawiki", "eBay", "Gumtree", "Marktplaats", "Subito"];

export const demoListings = [
  {
    id: "art-deco-chair",
    category: "Armchairs",
    image: artDecoChair,
    title: "French walnut club chair",
    location: "Lyon, France",
    flag: "🇫🇷",
    source: "Leboncoin",
    price: 420,
    priceLabel: "£420",
    resale: "£1,200–£1,600",
    margin: "+£980",
    marginPercent: "233%",
    period: "Art Deco",
    style: "French modernist",
    confidence: 92,
    note: "Strong proportions and unusually intact walnut shell. Reupholstery appears recent.",
    redFlags: ["Confirm woodworm-free underside", "Request maker label photo"],
  },
  {
    id: "teak-sideboard",
    category: "Sideboards",
    image: teakSideboard,
    title: "Long teak sideboard, 1960s",
    location: "Utrecht, Netherlands",
    flag: "🇳🇱",
    source: "Marktplaats",
    price: 690,
    priceLabel: "£690",
    resale: "£1,500–£2,100",
    margin: "+£1,110",
    marginPercent: "161%",
    period: "Mid Century Modern",
    style: "Scandinavian Modern",
    confidence: 88,
    note: "Commercial scale, clean tambour action and attractive book-matched teak grain.",
    redFlags: ["Check rear panel for water staining"],
  },
  {
    id: "space-age-lamp",
    category: "Lighting",
    image: spaceAgeLamp,
    title: "Chrome mushroom table lamp",
    location: "Milan, Italy",
    flag: "🇮🇹",
    source: "Subito",
    price: 180,
    priceLabel: "£180",
    resale: "£480–£650",
    margin: "+£385",
    marginPercent: "214%",
    period: "Space Age",
    style: "Italian modern",
    confidence: 81,
    note: "Convincing 1970s form with original acrylic shade; attribution remains uncertain.",
    redFlags: ["European wiring requires testing"],
  },
  {
    id: "bauhaus-chair",
    category: "Chairs",
    image: bauhausChair,
    title: "Tubular steel cantilever chair",
    location: "Berlin, Germany",
    flag: "🇩🇪",
    source: "Kleinanzeigen",
    price: 310,
    priceLabel: "Current bid £310",
    resale: "£850–£1,100",
    margin: "+£665",
    marginPercent: "215%",
    period: "Bauhaus and Modernist",
    style: "International Style",
    confidence: 76,
    note: "Well-aged leather and correct proportions, but attribution needs construction details.",
    redFlags: ["Auction ends in 18 hours", "Verify tube joins"],
  },
];
