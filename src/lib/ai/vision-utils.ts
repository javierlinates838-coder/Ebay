import type { ImagePart, TextPart } from "ai";

export function dataUrlToImagePart(dataUrl: string): ImagePart {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,([\s\S]+)$/);
  if (!match) {
    throw new Error("Invalid image data URL");
  }

  const mimeType = match[1];
  const base64 = match[2].replace(/\s/g, "");
  const bytes = Buffer.from(base64, "base64");

  return {
    type: "image",
    image: bytes,
    mediaType: mimeType,
  };
}

export function buildVisionMessage(
  text: string,
  dataUrls: string[]
): Array<TextPart | ImagePart> {
  return [
    { type: "text", text: `${dataUrls.length} photo(s) — examine ALL:` },
    ...dataUrls.map(dataUrlToImagePart),
    { type: "text", text },
  ];
}

export function totalPhotoBytes(dataUrls: string[]): number {
  return dataUrls.reduce((sum, url) => {
    const match = url.match(/^data:image\/[^;]+;base64,([\s\S]+)$/);
    if (!match) return sum;
    return sum + Buffer.from(match[1], "base64").length;
  }, 0);
}
