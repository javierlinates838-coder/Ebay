const MAX_DIMENSION = 1024;
const UPLOAD_MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.72;
const UPLOAD_JPEG_QUALITY = 0.88;

export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  const dataUrl = await readFileAsDataUrl(file);

  try {
    return await compressDataUrlWithOptions(dataUrl, MAX_DIMENSION, JPEG_QUALITY);
  } catch {
    return dataUrl;
  }
}

/** Smaller images for API upload — avoids Vercel 413 body limit */
export async function prepareImageForAnalysis(dataUrl: string): Promise<string> {
  try {
    const dims = await getImageDimensions(dataUrl);
    if (Math.max(dims.width, dims.height) <= UPLOAD_MAX_DIMENSION) {
      const bytes = Math.ceil((dataUrl.length * 3) / 4);
      if (bytes <= 1_000_000) return dataUrl;
    }
    return await compressDataUrlWithOptions(dataUrl, UPLOAD_MAX_DIMENSION, UPLOAD_JPEG_QUALITY);
  } catch {
    return dataUrl;
  }
}

/** Tiny thumbnail for localStorage inventory cards */
export async function createThumbnail(dataUrl: string): Promise<string> {
  try {
    return await compressDataUrlWithOptions(dataUrl, 200, 0.6);
  } catch {
    return "";
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

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
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
