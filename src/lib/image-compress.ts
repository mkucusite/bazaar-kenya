/**
 * Client-side image compression using Canvas API.
 * Resizes images to a max dimension and compresses to WebP (with JPEG fallback).
 */

const MAX_DIMENSION = 1200;
const QUALITY = 0.78;
const SKIP_THRESHOLD = 200 * 1024; // 200KB – skip compression for tiny files

/** Check if the browser supports WebP encoding */
const supportsWebP = (() => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
})();

const OUTPUT_TYPE = supportsWebP ? "image/webp" : "image/jpeg";
const OUTPUT_EXT = supportsWebP ? ".webp" : ".jpg";

export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip non-image files
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Skip if already small enough
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size <= SKIP_THRESHOLD) {
        resolve(file);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, OUTPUT_EXT);
          const compressed = new File([blob], name, { type: OUTPUT_TYPE, lastModified: Date.now() });

          // Only use compressed if it's actually smaller
          if (compressed.size < file.size) {
            resolve(compressed);
          } else {
            resolve(file);
          }
        },
        OUTPUT_TYPE,
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
};

export const compressImages = async (files: File[]): Promise<File[]> => {
  return Promise.all(files.map(compressImage));
};
