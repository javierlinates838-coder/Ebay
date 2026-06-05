const MAX_DIMENSION = 1024;
const ANALYSIS_MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.72;
const ANALYSIS_JPEG_QUALITY = 0.88;
const ALWAYS_COMPRESS_ABOVE_BYTES = 150_000;

export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  const dataUrl = await readFileAsDataUrl(file);

  if (file.size <= ALWAYS_COMPRESS_ABOVE_BYTES && file.type === "image/jpeg") {
    return dataUrl;
  }

  try {
    return await compressDataUrl(dataUrl);
  } catch {
    return dataUrl;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl: string): Promise<string> {
  return compressDataUrlWithOptions(dataUrl, MAX_DIMENSION, JPEG_QUALITY);
}

/** Higher resolution for AI vision — preserves label/tag readability */
export async function prepareImageForAnalysis(dataUrl: string): Promise<string> {
  try {
    return await compressDataUrlWithOptions(dataUrl, ANALYSIS_MAX_DIMENSION, ANALYSIS_JPEG_QUALITY);
  } catch {
    return dataUrl;
  }
}

function compressDataUrlWithOptions(
  dataUrl: string,
  maxDimension: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
