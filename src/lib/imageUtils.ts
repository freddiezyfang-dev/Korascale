// 图片URL处理工具
// 支持本地路径（public目录）和云存储URL

/**
 * 获取图片URL
 * 自动判断是本地路径还是云存储URL
 * 
 * @param imagePath - 图片路径（本地路径或云存储URL）
 * @returns 完整的图片URL
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    return '/images/placeholder.jpg'; // 默认占位图
  }

  // 如果已经是完整URL（http://或https://），直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 如果是云存储URL（vercel blob），直接返回
  if (imagePath.startsWith('https://') && imagePath.includes('vercel-storage.com')) {
    return imagePath;
  }

  // 本地路径：确保以/开头
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // 如果路径不以/开头，添加/images/前缀（如果是images目录下的图片）
  if (imagePath.startsWith('images/') || imagePath.startsWith('icons/')) {
    return `/${imagePath}`;
  }

  // 默认添加到/images/
  return `/images/${imagePath}`;
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
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回
  if (isCloudStorageUrl(path)) {
    return path;
  }
  
  // 本地路径标准化
  if (path.startsWith('/')) {
    return path;
  }
  
  // 添加前缀
  return `/${path}`;
}







