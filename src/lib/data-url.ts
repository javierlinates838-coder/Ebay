export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const mime = blob.type || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
