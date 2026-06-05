import sharp from "sharp";

const MAX_EDGE = 2048;
const JPEG_QUALITY = 93;
const MAX_BYTES = 1_400_000;

/** Preserve tag/logo detail for vision models */
export async function preparePhotosForVision(dataUrls: string[]): Promise<string[]> {
  const prepared: string[] = [];

  for (const dataUrl of dataUrls.filter(Boolean).slice(0, 4)) {
    try {
      prepared.push(await optimizeOne(dataUrl));
    } catch (err) {
      console.warn("[ImagePrep] Skip photo:", err);
      prepared.push(dataUrl);
    }
  }

  return prepared.length ? prepared : dataUrls.slice(0, 4);
}

async function optimizeOne(dataUrl: string): Promise<string> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const input = Buffer.from(base64, "base64");

  if (input.length <= MAX_BYTES) {
    const meta = await sharp(input).metadata();
    const maxDim = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (maxDim > 0 && maxDim <= MAX_EDGE) {
      return dataUrl.startsWith("data:") ? dataUrl : `data:image/jpeg;base64,${base64}`;
    }
  }

  let output = await sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  if (output.length > MAX_BYTES) {
    output = await sharp(output).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  }

  return `data:image/jpeg;base64,${output.toString("base64")}`;
}
