import sharp from "sharp";

const MAX_EDGE = 1536;
const JPEG_QUALITY = 85;
const MAX_BYTES = 900_000;

/** Server-side resize — sharper than client canvas, smaller payloads for Gemini */
export async function preparePhotosForVision(dataUrls: string[]): Promise<string[]> {
  const prepared: string[] = [];

  for (const dataUrl of dataUrls.filter(Boolean).slice(0, 5)) {
    try {
      prepared.push(await optimizeOne(dataUrl));
    } catch (err) {
      console.warn("[ImagePrep] Skip photo:", err);
      prepared.push(dataUrl);
    }
  }

  return prepared.length ? prepared : dataUrls.slice(0, 5);
}

async function optimizeOne(dataUrl: string): Promise<string> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const input = Buffer.from(base64, "base64");

  const pipeline = sharp(input).rotate().resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });

  let output = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

  if (output.length > MAX_BYTES) {
    output = await sharp(output)
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
  }

  return `data:image/jpeg;base64,${output.toString("base64")}`;
}
