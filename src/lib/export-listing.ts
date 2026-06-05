import type { GeneratedListing, ProductAnalysis } from "@/types";

export function buildListingExportText(params: {
  listing: GeneratedListing;
  analysis?: ProductAnalysis | null;
  price?: number;
}): string {
  const { listing, analysis, price } = params;
  const specifics = Object.entries(listing.itemSpecifics)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return [
    "=== EBAY LISTING KIT ===",
    "",
    "TITLE (paste into eBay title field):",
    listing.title,
    "",
    "PRICE:",
    price ? `$${price.toFixed(2)}` : "Set your price",
    "",
    "DESCRIPTION (paste into eBay description):",
    stripHtml(listing.description),
    "",
    "ITEM SPECIFICS:",
    specifics || "None generated",
    "",
    "KEYWORDS / TAGS:",
    listing.keywords.join(", "),
    "",
    analysis
      ? `PRODUCT: ${analysis.product}\nBRAND: ${analysis.brand}\nMODEL: ${analysis.model}\nCONDITION: ${analysis.condition}`
      : "",
    "",
    "SHIPPING SUGGESTION:",
    `${listing.shippingSuggestions.weight} · ${listing.shippingSuggestions.dimensions} · ${listing.shippingSuggestions.recommendedService} · ~$${listing.shippingSuggestions.estimatedCost.toFixed(2)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function downloadPhotosAsZip(
  photos: string[],
  filename = "resellai-photos.zip"
): Promise<void> {
  if (!photos.length) return;

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  await Promise.all(
    photos.map(async (photo, index) => {
      const response = await fetch(photo);
      const blob = await response.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      zip.file(`photo-${index + 1}.${ext}`, blob);
    })
  );

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
