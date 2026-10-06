export const periods: string[] = [
  "Baroque", "Rococo", "Georgian", "Regency", "Empire", "Biedermeier",
  "Louis Philippe", "Victorian", "Napoleon III", "Arts and Crafts", "Art Nouveau",
  "Edwardian", "Art Deco", "Bauhaus and Modernist", "Mid Century Modern",
  "Scandinavian Modern", "Space Age", "Postmodern and Memphis", "Brutalist", "Country and Folk",
];

export const categories: string[] = [
  "Chairs", "Armchairs", "Sofas", "Tables", "Desks", "Sideboards",
  "Cabinets", "Chests of drawers", "Beds", "Mirrors", "Lighting",
];


export const subcategories: Record<string, string[]> = {
  Chairs: ["Dining chairs", "Side chairs", "Desk chairs", "Stools", "Benches"],
  Armchairs: ["Club chairs", "Wingbacks", "Lounge chairs", "Bergères", "Rocking chairs"],
  Sofas: ["Two-seaters", "Three-seaters", "Daybeds", "Chaises longues", "Settees"],
  Tables: ["Dining tables", "Coffee tables", "Side tables", "Console tables", "Gateleg tables"],
  Desks: ["Writing desks", "Bureaus", "Partners desks", "Secretaires"],
  Sideboards: ["Credenzas", "Enfilades", "Buffets", "Servers"],
  Cabinets: ["Display cabinets", "Bookcases", "Wardrobes", "Bar cabinets", "Cupboards"],
  "Chests of drawers": ["Commodes", "Tallboys", "Bedside chests", "Dressers"],
  Beds: ["Double beds", "Single beds", "Headboards"],
  Mirrors: ["Wall mirrors", "Overmantels", "Floor mirrors", "Dressing mirrors"],
  Lighting: ["Table lamps", "Floor lamps", "Pendants", "Chandeliers", "Wall lights"],
};

// Subcategory preferences live in the same categories map under "Category › Sub".
export const subKey = (category: string, sub: string) => `${category} › ${sub}`;
export const allCategoryKeys = categories.flatMap((c) => [c, ...(subcategories[c] ?? []).map((s) => subKey(c, s))]);
