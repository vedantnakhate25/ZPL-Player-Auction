/**
 * Client-side image compression utility to prevent exceeding
 * Firestore 1MB document size limits and avoid upload delays.
 * Supports JPG, JPEG, PNG, and WebP from device photo galleries.
 */
export function compressImage(
  file: File,
  maxDimension: number = 320,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image file, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image (JPG and PNG supported)'));
      return;
    }

    const isPng = file.type === 'image/png';

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file from gallery'));

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image from gallery'));

      img.onload = () => {
        let { width, height } = img;

        // Scale down maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original base64 if canvas context is unavailable
          resolve(readerEvent.target?.result as string);
          return;
        }

        if (isPng) {
          // Keep transparent background for PNGs (e.g. logos, crests)
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          try {
            const pngDataUrl = canvas.toDataURL('image/png');
            // If PNG size is reasonable (< 200KB base64), preserve transparent PNG
            if (pngDataUrl.length < 220000) {
              resolve(pngDataUrl);
              return;
            }
          } catch {
            // Fall through to JPEG
          }
        }

        // Draw image resized on clean white canvas for JPG/large PNG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Export as JPEG with controlled quality (produces ~15KB - 45KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
