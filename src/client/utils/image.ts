/**
 * Reads a File or Blob and compresses it to a clean base64 data URL.
 * Automatically downscales large images to max 1280px maintaining aspect ratio
 * and encodes to WebP/JPEG to prevent massive socket payloads.
 */
export async function processImageToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic file type check
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error("Failed to read image data"));
        return;
      }

      // If image is already tiny (< 80KB), return directly
      if (file.size < 80 * 1024) {
        resolve(result);
        return;
      }

      // Otherwise resize with canvas
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp with 0.85 quality, or jpeg if webp not supported
        try {
          const compressed = canvas.toDataURL("image/webp", 0.85);
          if (compressed.startsWith("data:image/webp")) {
            resolve(compressed);
            return;
          }
        } catch {
          // Fallback to jpeg
        }

        const jpeg = canvas.toDataURL("image/jpeg", 0.85);
        resolve(jpeg);
      };

      img.onerror = () => {
        reject(new Error("Could not decode image"));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}
