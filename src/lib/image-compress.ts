/**
 * Client-side image compression using Canvas API.
 * Resizes images to a max dimension and compresses to JPEG.
 */

const MAX_DIMENSION = 1200;
const QUALITY = 0.8;

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

      // Only resize if larger than max
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size <= 500 * 1024) {
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
          // Keep original name but change extension to .jpg
          const name = file.name.replace(/\.[^.]+$/, ".jpg");
          const compressed = new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
          resolve(compressed);
        },
        "image/jpeg",
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
