// 图片URL处理工具
// 支持本地路径（public目录）和云存储URL

const IMAGE_FILE_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;
const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';

export function isValidImagePath(imagePath: unknown): imagePath is string {
  if (typeof imagePath !== 'string') return false;
  const trimmed = imagePath.trim();
  if (!trimmed || trimmed.length > 500) return false;
  if (/[\r\n<>]/.test(trimmed)) return false;

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('icons/')
  ) {
    return true;
  }

  return IMAGE_FILE_PATTERN.test(trimmed);
}

export function sanitizeImagePath(imagePath: unknown): string {
  return isValidImagePath(imagePath) ? imagePath.trim() : '';
}

export function isRenderableImagePath(imagePath: unknown): imagePath is string {
  if (typeof imagePath !== 'string') return false;
  const trimmed = imagePath.trim();
  if (!trimmed) return false;
  return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function getRenderableImageUrl(imagePath: unknown): string {
  return isRenderableImagePath(imagePath) ? imagePath.trim() : PLACEHOLDER_IMAGE;
}

export function sanitizeImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((image) => sanitizeImagePath(image))
    .filter(Boolean);
}

export function pickFirstValidImagePath(...candidates: Array<unknown>): string {
  for (const candidate of candidates) {
    const sanitized = sanitizeImagePath(candidate);
    if (sanitized) return sanitized;
  }
  return '';
}

/**
 * 获取图片URL
 * 自动判断是本地路径还是云存储URL
 *
 * @param imagePath - 图片路径（本地路径或云存储URL）
 * @returns 完整的图片URL
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  const safePath = sanitizeImagePath(imagePath);

  if (!safePath) {
    return PLACEHOLDER_IMAGE; // 默认占位图
  }

  // 如果已经是完整URL（http://或https://），直接返回
  if (safePath.startsWith('http://') || safePath.startsWith('https://')) {
    return safePath;
  }

  // 如果是云存储URL（vercel blob），直接返回
  if (safePath.startsWith('https://') && safePath.includes('vercel-storage.com')) {
    return safePath;
  }

  // 本地路径：确保以/开头
  if (safePath.startsWith('/')) {
    return safePath;
  }

  // 渲染前强制要求以 / 或 http(s) 开头，否则回退占位图
  return PLACEHOLDER_IMAGE;
}

/**
 * 检查图片是否是云存储URL
 */
export function isCloudStorageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('https://') && 
         (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage'));
}

/**
 * 检查图片是否是本地路径
 */
export function isLocalPath(path: string | undefined | null): boolean {
  if (!path) return false;
  return path.startsWith('/') && !path.startsWith('http');
}

/**
 * 图片路径标准化
 * 统一处理本地路径和云存储URL
 */
export function normalizeImagePath(path: string | undefined | null): string {
  const safePath = sanitizeImagePath(path);
  if (!safePath) return '';
  
  // 如果已经是完整URL，直接返回
  if (isCloudStorageUrl(safePath)) {
    return safePath;
  }
  
  // 本地路径标准化
  if (safePath.startsWith('/')) {
    return safePath;
  }
  
  // 添加前缀
  return `/${safePath}`;
}







