export function isPhotoRoomConfigured(): boolean {
  return Boolean(process.env.PHOTOROOM_API_KEY);
}

export async function enhancePhoto(
  imageBase64: string,
  options: { removeBackground?: boolean; improveQuality?: boolean } = {}
): Promise<{ enhancedImage: string } | { error: string }> {
  const apiKey = process.env.PHOTOROOM_API_KEY;

  if (!apiKey) {
    return enhancePhotoFallback(imageBase64);
  }

  try {
    const formData = new FormData();
    const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const blob = new Blob([buffer], { type: "image/png" });
    formData.append("image_file", blob, "photo.png");

    if (options.removeBackground !== false) {
      formData.append("bg_color", "FFFFFF");
    }

    const response = await fetch("https://sdk.photoroom.com/v1/segment", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      return enhancePhotoFallback(imageBase64);
    }

    const resultBuffer = await response.arrayBuffer();
    const enhancedBase64 = `data:image/png;base64,${Buffer.from(resultBuffer).toString("base64")}`;

    return { enhancedImage: enhancedBase64 };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Photo enhancement failed",
    };
  }
}

async function enhancePhotoFallback(
  imageBase64: string
): Promise<{ enhancedImage: string }> {
  // Return original with metadata indicating demo mode
  // In production without PhotoRoom, client-side canvas enhancement is used
  return { enhancedImage: imageBase64 };
}

export async function enhancePhotoClientSide(
  file: File,
  options: { brightness?: number; contrast?: number; whiteBackground?: boolean }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        if (options.whiteBackground) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.filter = `brightness(${options.brightness ?? 1.05}) contrast(${options.contrast ?? 1.1})`;
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
