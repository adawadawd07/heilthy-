const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.85;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = src;
  });
}

/**
 * Downscales a photo to at most MAX_EDGE on its longest side and returns
 * bare base64 (no data-URL prefix), which is what the analyze API expects.
 * Falls back to the original bytes if canvas encoding is unavailable.
 */
export async function compressImage(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const rawBase64 = dataUrl.split(',')[1] ?? '';

  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 1_500_000) return rawBase64;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return rawBase64;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const encoded = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
    return encoded || rawBase64;
  } catch {
    return rawBase64;
  }
}
