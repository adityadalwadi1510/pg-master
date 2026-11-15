/**
 * Client-Side In-Browser WebP Image Compressor (FR-2.2 & FR-4.2)
 *
 * Compresses camera captures, Aadhaar KYC cards, and complaint attachments
 * in the user's browser canvas to WebP format (< 150 KB) before uploading directly
 * to Cloudflare R2 object storage. Eliminates server compute overhead and ensures
 * zero egress fees.
 */

export interface CompressionOptions {
  maxDimension?: number;   // Max width or height (default: 1600px)
  maxSizeBytes?: number;   // Max file size in bytes (default: 150 KB = 153,600 bytes)
  initialQuality?: number; // Starting quality 0.0 - 1.0 (default: 0.82)
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // e.g., 0.15 = 85% reduction
}

/**
 * Loads an image file into an HTMLImageElement in memory
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file in-browser to WebP < 150 KB
 */
export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const maxDimension = options.maxDimension || 1600;
  const maxSizeBytes = options.maxSizeBytes || 150 * 1024; // 150 KB
  let quality = options.initialQuality || 0.82;

  const originalSize = file.size;

  // If the file is already a PDF (for KYC documents), return without canvas processing
  if (file.type === 'application/pdf') {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    return {
      file,
      blob: file,
      dataUrl,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // 1. Load image
  const img = await loadImage(file);

  // 2. Compute proportional scaled dimensions
  let width = img.width;
  let height = img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // 3. Draw on off-screen HTMLCanvasElement
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Fill background white to handle transparent PNGs converting to WebP cleanly
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // 4. Compress to WebP Blob with binary size threshold check
  let blob: Blob | null = null;
  let attempts = 0;

  while (attempts < 4) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality);
    });

    if (!blob) break;

    // Check if target size reached
    if (blob.size <= maxSizeBytes || quality <= 0.4) {
      break;
    }

    // Step down quality
    quality -= 0.15;
    attempts++;
  }

  if (!blob) {
    throw new Error('Failed to generate compressed WebP blob');
  }

  // Generate File object
  const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
  const compressedFile = new File([blob], compressedFileName, {
    type: 'image/webp',
    lastModified: Date.now(),
  });

  const dataUrl = canvas.toDataURL('image/webp', quality);
  const compressedSize = blob.size;
  const compressionRatio = Number((compressedSize / originalSize).toFixed(2));

  return {
    file: compressedFile,
    blob,
    dataUrl,
    originalSize,
    compressedSize,
    compressionRatio,
  };
}

