/** System role — all product categories */
export const ANALYSIS_SYSTEM = `You are an expert eBay reseller with Google Lens-level product recognition.

You identify ANY resale item from photos: clothing, footwear, electronics, video games, collectibles, home goods, tools, sporting equipment, toys, books, accessories, vintage, and more.

Rules:
- NEVER use generic names alone: "shoes", "shirt", "phone", "item", "electronics"
- NEVER say brand "Unknown" when a logo or tag text is visible
- ALWAYS read tags, labels, screens, serial plates, barcodes, and packaging
- Combine ALL photos — different angles show different details
- Use web search results to confirm exact model names when available
- Only report sizes/model numbers you can read — never invent them`;

/** Vision + Google Search — Lens-style identification */
export const LENS_ANALYSIS_USER = `Identify this item for an eBay resale listing.

STEP 1 — Study every photo: logos, brand marks, tags, model numbers, colors, materials, condition, barcodes.

STEP 2 — USE GOOGLE SEARCH to find this exact product online. Search like:
- brand + visible model text + product type
- eBay sold listings for similar items
- manufacturer product pages

Match what you SEE in the photos to REAL products found on the web. This is how Google Lens works — visual match + web lookup.

STEP 3 — Output your final answer as a single JSON code block (no other text after the JSON):

\`\`\`json
{
  "product": "Full specific product name from web + photos",
  "brand": "Brand from logo/tag/web — never Unknown if identified",
  "model": "Model/style/SKU from tag or web",
  "color": "Full colorway",
  "size": "if visible",
  "gender": "Men's/Women's/Youth if known",
  "material": "if known",
  "productType": "exact sub-type",
  "condition": "New|Like New|Good|Fair|Poor",
  "category": "eBay category path",
  "confidence": 92,
  "itemSpecifics": {"Brand":"","Type":"","Color":""},
  "identificationNotes": "What you saw + what web search confirmed",
  "conditionNotes": "specific wear or none noted",
  "searchQuery": "best eBay sold comps search string",
  "visibleText": ["tag","text","from","photos"],
  "defects": [],
  "ebayTitleSuggestion": "keyword-rich title under 80 chars",
  "compsKeywords": ["brand","type","model"]
}
\`\`\`

Examples:
- Photos show Nike swoosh + metal spikes → search finds "Nike Alpha Huarache Elite cleats" → use that exact name
- Photos show iPhone back label → search finds exact storage/model
- Photos show game case art → search finds exact game title + platform`;

export const ANALYSIS_USER = `Identify this item for an eBay listing. Examine every photo.

Name the EXACT product type, brand (from logos/tags), model, colors, condition, and all readable tag text.

End with a JSON code block containing: product, brand, model, color, productType, condition, category, confidence, itemSpecifics, identificationNotes, conditionNotes, searchQuery, visibleText, ebayTitleSuggestion, compsKeywords.`;

export const RETRY_USER = `Previous identification was too vague. Look at photos again and search the web for the exact product.

Find the real model name from eBay/retailer pages. Output ONLY the JSON code block with specific fields — no generic terms.`;

export const STRUCTURE_FROM_RESEARCH = (research: string, sources: string) =>
  `Convert this product research into eBay listing JSON. Use web findings to set exact brand/model/product names.

RESEARCH:
${research}

WEB SOURCES:
${sources || "none"}

Respond with ONLY valid JSON (no markdown):
{"product":"","brand":"","model":"","color":"","productType":"","condition":"Good","category":"","confidence":90,"itemSpecifics":{},"identificationNotes":"","conditionNotes":"","searchQuery":"","visibleText":[],"ebayTitleSuggestion":"","compsKeywords":[]}`;
