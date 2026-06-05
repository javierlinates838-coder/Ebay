export type ProductCategory =
  | "footwear"
  | "clothing"
  | "electronics"
  | "collectibles"
  | "home"
  | "sporting"
  | "accessories"
  | "general";

export const CATEGORY_SCOUT_PROMPT = `You are classifying a product photo for an eBay reseller app.

Look at ALL photos and pick the single best category:
- footwear (shoes, cleats, sneakers, boots, sandals)
- clothing (shirts, jackets, pants, dresses, hats)
- electronics (phones, tablets, laptops, cameras, consoles, headphones)
- sporting (bats, gloves, balls, gym equipment, not footwear)
- collectibles (cards, figures, vintage, memorabilia, coins)
- home (kitchen, decor, tools, appliances, furniture)
- accessories (bags, wallets, watches, jewelry, belts)
- general (if none fit)

Also note: primary brand if logo visible, and whether tag/label text is readable.

Respond ONLY with JSON:
{"category":"footwear","brandHint":"Nike","hasReadableTags":true,"visualSummary":"Navy/red/yellow baseball cleats with metal spikes and Nike branding on tongue"}`;

export const OCR_PROMPT = `Expert OCR for eBay resellers. Transcribe EVERY readable character from product photos.

For each photo number, list:
- Brand names, logos spelled out
- Model numbers, style codes, SKUs
- Sizes (US/EU/UK), widths
- Care label text, country of origin, materials
- Serial numbers, dates, athlete names, edition text

If text is blurry use [?] for uncertain chars. If no text, describe logos/colors instead.

Format as plain text with "Photo N:" headers. Be exhaustive — resellers need tag data.`;

export const CATEGORY_EXPERT_PROMPTS: Record<ProductCategory, string> = {
  footwear: `FOOTWEAR EXPERT MODE — identify these shoes/cleats/boots for eBay.

Extract:
- Exact type: baseball cleats, running shoes, basketball shoes, boots, etc.
- Brand + model/line (e.g. Nike Alpha Huarache Elite, Air Jordan 1, Adidas Ultraboost)
- Metal vs molded cleats, high-top vs low, sport
- Full colorway name (e.g. "Navy/Red/Yellow")
- US shoe size from tag if visible
- Width if visible
- Signature/edition if visible (player sig on heel, etc.)
- Condition: grass dirt on cleats is normal for used — note scuffs, separation, odor cues

eBay category path must end in correct shoe subcategory.`,

  clothing: `APPAREL EXPERT MODE — identify this clothing for eBay.

Extract:
- Garment type (hoodie, jersey, jacket, jeans, etc.)
- Brand + line/collection
- Size from tag (S/M/L/XL or numeric)
- Gender/department (Men's, Women's, Youth)
- Material from tag (cotton, polyester blend, etc.)
- Color/pattern
- Vintage indicators if any`,

  electronics: `ELECTRONICS EXPERT MODE — identify this device for eBay.

Extract:
- Device type + brand + model number (exact model from back label)
- Storage/RAM/carrier if phone
- Color, generation, year if known
- Accessories visible in photos
- Condition: screen cracks, dents, activation lock unknown = note it
- Serial/model from label photo`,

  sporting: `SPORTING GOODS EXPERT MODE — identify this sports equipment for eBay.

Extract:
- Sport + item type (bat, glove, helmet, etc.)
- Brand + model/line
- Size/weight specs if visible
- Left/right hand if applicable
- Condition including game use wear`,

  collectibles: `COLLECTIBLES EXPERT MODE — identify this collectible for eBay.

Extract:
- Item type (card, figure, vintage item, etc.)
- Brand/manufacturer, year, edition, set name
- Graded/slabbed if visible
- Authenticity markers
- Condition issues`,

  home: `HOME & GARDEN EXPERT MODE — identify this item for eBay.

Extract:
- Product type, brand, model if appliance/tool
- Dimensions/capacity if visible on label
- Material, color, condition`,

  accessories: `ACCESSORIES EXPERT MODE — identify this accessory for eBay.

Extract:
- Type (handbag, watch, wallet, belt, etc.)
- Brand + model/collection
- Material, color, hardware color
- Authenticity cues for luxury brands`,

  general: `GENERAL PRODUCT EXPERT — identify this item for eBay resale.

Be as specific as possible. Extract brand, model, color, condition, and all visible tag text.`,
};

export const DEEP_ANALYSIS_JSON_INSTRUCTION = `
Respond with ONLY valid JSON (no markdown fences):
{
  "product": "Full specific product name for eBay title",
  "brand": "Brand or Unbranded",
  "model": "Model/style number or descriptive style name",
  "color": "Full colorway",
  "size": "Size if visible or Unknown",
  "gender": "Men's/Women's/Youth/Unisex/Unknown",
  "material": "Primary material if known",
  "condition": "New|Like New|Good|Fair|Poor",
  "category": "Full eBay category path",
  "confidence": 85,
  "itemSpecifics": {"Brand":"","Type":"","Size":"","Color":"","Sport":"","Department":""},
  "identificationNotes": "2-3 sentences citing visual evidence from photos",
  "conditionNotes": "Specific flaws or 'No major defects noted'",
  "searchQuery": "Best eBay sold comps search string",
  "visibleText": ["each","tag","string"],
  "defects": ["list","of","flaws"],
  "ebayTitleSuggestion": "Optimized 80-char eBay title",
  "compsKeywords": ["keyword1","keyword2"]
}

Rules:
- TRUST visible logos and tags — Nike swoosh + cleats = Nike cleats, not "unknown shoes"
- confidence 90+ when brand AND product type confirmed visually
- Never invent serial numbers or sizes not in photos
- itemSpecifics: fill every field you can support with evidence`;

export const REFINE_PROMPT = `You previously analyzed this product but confidence was low.
Using the scout report, OCR text, and your prior analysis, produce an IMPROVED JSON identification.
Focus on tag text and logos you may have missed. Only increase confidence with evidence.`;
