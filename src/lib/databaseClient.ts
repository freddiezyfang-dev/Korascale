// 数据库客户端封装
// 自动处理与PostgreSQL的交互

import { Journey, JourneyStatus } from '@/types';
import { Article } from '@/types/article';

// 使用相对路径，在客户端和服务端都使用相对路径，避免连接问题
const getApiUrl = (path: string) => {
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // 在客户端始终使用相对路径，避免 CORS 问题和连接被拒绝
  if (typeof window !== 'undefined') {
    return normalizedPath;
  }
  
  // 服务端：优先使用相对路径（Next.js 内部路由）
  // 只有在明确需要外部 URL 时才使用绝对路径
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}${normalizedPath}`;
  }
  
  // 在 Vercel 等部署环境中使用完整 URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${normalizedPath}`;
  }
  
  // 开发环境：使用相对路径，让 Next.js 内部处理
  // 这样可以避免 "连接被拒绝" 的问题
  return normalizedPath;
};

// 创建带超时的 AbortSignal（兼容性处理）
const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  // 如果支持 AbortSignal.timeout，直接使用
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return (AbortSignal as any).timeout(timeoutMs);
  }
  // 否则使用 AbortController + setTimeout
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

// Journey API调用
export const journeyAPI = {
  // 获取所有journeys（带重试机制）
  async getAll(retries: number = 2): Promise<Journey[]> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 增加超时时间：第一次45秒，重试60秒（给数据库更多时间）
        const timeoutMs = attempt === 0 ? 45000 : 60000;
        const apiUrl = getApiUrl('/api/journeys');
        
        // 调试：打印完整的请求 URL
        console.log(`[JourneyAPI] Fetching from: ${apiUrl} (attempt ${attempt + 1}/${retries + 1})`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          // 添加超时控制
          signal: createTimeoutSignal(timeoutMs),
          // 添加缓存控制
          cache: 'no-store',
          // 添加 headers
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          // 尝试获取详细的错误信息
          let errorMessage = `Failed to fetch journeys (HTTP ${response.status})`;
          try {
            // 检查响应是否是 JSON 格式
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } else {
              // 如果不是 JSON，尝试获取文本
              const text = await response.text();
              errorMessage = text || errorMessage;
            }
          } catch (e) {
            // 如果解析失败，使用状态码和状态文本
            errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
          }
          
          // 如果是服务器错误且还有重试次数，继续重试
          if (response.status >= 500 && attempt < retries) {
            console.warn(`[JourneyAPI] Attempt ${attempt + 1} failed, retrying...`, errorMessage);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 递增延迟
            continue;
          }
          
          console.error('API Error:', errorMessage);
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data.journeys || [];
      } catch (error) {
        // 如果是 AbortError（超时）
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutMsg = `Request timeout: Failed to fetch journeys within ${attempt === 0 ? 45 : 60} seconds`;
          console.warn(`[JourneyAPI] ${timeoutMsg} (attempt ${attempt + 1}/${retries + 1})`);
          
          // 如果还有重试次数，继续重试
          if (attempt < retries) {
            const delay = 2000 * (attempt + 1); // 递增延迟：2秒、4秒
            console.log(`[JourneyAPI] Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          console.error(timeoutMsg);
          // 超时后尝试从 localStorage 加载（降级方案）
          try {
            const stored = localStorage.getItem('journeys');
            if (stored) {
              console.warn('[JourneyAPI] Falling back to localStorage data due to timeout');
              const parsed = JSON.parse(stored).map((j: any) => ({
                ...j,
                createdAt: new Date(j.createdAt),
                updatedAt: new Date(j.updatedAt),
              }));
              return parsed;
            }
          } catch (e) {
            console.error('[JourneyAPI] Failed to load from localStorage:', e);
          }
        } else {
          console.error('Error fetching journeys:', error);
          
          // 如果是网络错误且还有重试次数，继续重试
          if (attempt < retries && error instanceof Error && (
            error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('Failed to fetch')
          )) {
            console.warn(`[JourneyAPI] Network error on attempt ${attempt + 1}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
        }
        
        // 最后一次尝试失败，返回空数组
        if (attempt === retries) {
          console.warn('[JourneyAPI] All retry attempts failed, returning empty array');
          return [];
        }
      }
    }
    
    // 理论上不会到达这里，但为了类型安全
    return [];
  },

  // 获取单个journey
  async getById(id: string): Promise<Journey | null> {
    try {
      const apiUrl = getApiUrl(`/api/journeys/${id}`);
      console.log(`[JourneyAPI] Fetching journey by ID from: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: createTimeoutSignal(10000),
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        let errorMessage = `Failed to fetch journey (HTTP ${response.status})`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // 忽略解析错误
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data.journey || null;
    } catch (error) {
      console.error('Error fetching journey:', error);
      return null;
    }
  },

  // 创建journey（自动保存到数据库）
  async create(journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Journey> {
    try {
      const apiUrl = getApiUrl('/api/journeys');
      console.log(`[JourneyAPI] Creating journey at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(journey),
        signal: createTimeoutSignal(15000),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create journey';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data.journey;
    } catch (error) {
      console.error('Error creating journey:', error);
      throw error;
    }
  },

  // 更新journey（自动保存到数据库）
  async update(id: string, updates: Partial<Journey>): Promise<Journey> {
    try {
      const apiUrl = getApiUrl(`/api/journeys/${id}`);
      console.log(`[JourneyAPI] Updating journey at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updates),
        signal: createTimeoutSignal(15000),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to update journey';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
          // 如果有详细信息，也包含在错误消息中
          if (error.details) {
            console.error('Update journey error details:', error.details);
          }
        } catch (e) {
          // 如果无法解析错误响应，尝试获取文本
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      // 重新获取完整数据
      return await this.getById(id) || updates as Journey;
    } catch (error) {
      console.error('Error updating journey:', error);
      throw error;
    }
  },

  // 更新journey状态（自动保存到数据库）
  async updateStatus(id: string, status: JourneyStatus): Promise<void> {
    await this.update(id, { status });
  },

  // 删除journey（自动从数据库删除）
  async delete(id: string): Promise<void> {
    try {
      const apiUrl = getApiUrl(`/api/journeys/${id}`);
      console.log(`[JourneyAPI] Deleting journey at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        signal: createTimeoutSignal(10000),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete journey';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting journey:', error);
      throw error;
    }
  },
};

// 文件上传API
export const uploadAPI = {
  // 上传文件到云存储（支持图片和视频）
  async uploadFile(file: File, folder: 'journeys' | 'experiences' | 'hotels' | 'videos' = 'journeys', signal?: AbortSignal): Promise<string> {
    try {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        throw new Error('不支持的文件类型，仅支持图片和视频文件');
      }

      // 检查文件大小
      // 图片：4.5MB 限制，视频：100MB 限制
      const maxSize = isImage 
        ? 4.5 * 1024 * 1024  // 4.5MB for images
        : 100 * 1024 * 1024; // 100MB for videos
      
      if (file.size > maxSize) {
        throw new Error(`文件太大（${(file.size / 1024 / 1024).toFixed(2)}MB），最大支持 ${(maxSize / 1024 / 1024).toFixed(2)}MB。请压缩文件后重试。`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const apiUrl = getApiUrl('/api/upload');
      console.log('Uploading to:', apiUrl, 'File size:', file.size, 'bytes', 'Type:', file.type);

      // 使用用户提供的 signal 或创建超时 signal
      const timeoutSignal = createTimeoutSignal(isVideo ? 300000 : 30000); // 视频需要更长时间（5分钟）
      
      // 如果用户提供了 signal，优先使用；否则使用超时 signal
      // 注意：如果同时需要超时和用户取消，需要合并两个 signal
      const fetchSignal = signal || timeoutSignal;

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: fetchSignal,
      });

      if (!response.ok) {
        let errorMessage = '上传失败';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('服务器返回的数据中没有文件URL');
      }
      
      console.log('Upload successful, URL:', data.url);
      return data.url; // 返回文件URL
    } catch (error) {
      console.error('Error uploading file:', error);
      // 如果是 AbortError（超时），提供更友好的错误信息
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('上传超时，请检查网络连接后重试');
      }
      throw error;
    }
  },

  // 上传图片到云存储（自动保存）- 保持向后兼容
  async uploadImage(file: File, folder: 'journeys' | 'experiences' | 'hotels' = 'journeys'): Promise<string> {
    return this.uploadFile(file, folder);
  },

  // 批量上传图片
  async uploadImages(files: File[], folder: 'journeys' | 'experiences' | 'hotels' = 'journeys'): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },
};

// Article API调用
export const articleAPI = {
  // 获取所有articles（带重试机制和fallback）
  async getAll(retries: number = 2): Promise<Article[]> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const timeoutMs = attempt === 0 ? 30000 : 45000;
        const apiUrl = getApiUrl('/api/articles');
        
        // 调试：打印完整的请求 URL（简化日志）
        if (attempt === 0) {
          console.log(`[ArticleAPI] Fetching from: ${apiUrl}`);
        }
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          signal: createTimeoutSignal(timeoutMs),
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          let errorMessage = `Failed to fetch articles (HTTP ${response.status})`;
          try {
            // 检查响应是否是 JSON 格式
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } else {
              // 如果不是 JSON，尝试获取文本
              const text = await response.text();
              errorMessage = text || errorMessage;
            }
          } catch (e) {
            // 如果解析失败，使用状态码和状态文本
            errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
          }
          
          if (response.status >= 500 && attempt < retries) {
            console.warn(`[ArticleAPI] Attempt ${attempt + 1} failed, retrying...`, errorMessage);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        const articles = (data.articles || []).map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        }));
        return articles;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutMsg = `Request timeout: Failed to fetch articles within ${attempt === 0 ? 30 : 45} seconds`;
          console.warn(`[ArticleAPI] ${timeoutMsg} (attempt ${attempt + 1}/${retries + 1})`);
          
          if (attempt < retries) {
            const delay = 2000 * (attempt + 1);
            console.log(`[ArticleAPI] Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Fallback to localStorage
          try {
            const stored = localStorage.getItem('articles');
            if (stored) {
              console.warn('[ArticleAPI] Falling back to localStorage data due to timeout');
              return JSON.parse(stored).map((a: any) => ({
                ...a,
                createdAt: new Date(a.createdAt),
                updatedAt: new Date(a.updatedAt),
              }));
            }
          } catch (e) {
            console.error('[ArticleAPI] Failed to load from localStorage:', e);
          }
        } else {
          console.error('[ArticleAPI] Error fetching articles:', error);
          
          if (attempt < retries && error instanceof Error && (
            error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('Failed to fetch')
          )) {
            console.warn(`[ArticleAPI] Network error on attempt ${attempt + 1}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
        }
        
        if (attempt === retries) {
          // Fallback to localStorage on final failure
          try {
            const stored = localStorage.getItem('articles');
            if (stored) {
              console.warn('[ArticleAPI] Falling back to localStorage data after all retries failed');
              return JSON.parse(stored).map((a: any) => ({
                ...a,
                createdAt: new Date(a.createdAt),
                updatedAt: new Date(a.updatedAt),
              }));
            }
          } catch (e) {
            console.error('[ArticleAPI] Failed to load from localStorage:', e);
          }
          console.warn('[ArticleAPI] All retry attempts failed, returning empty array');
          return [];
        }
      }
    }
    return [];
  },

  // 创建新article
  async create(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
    try {
      const apiUrl = getApiUrl('/api/articles');
      console.log(`[ArticleAPI] Creating article at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(article),
        signal: createTimeoutSignal(30000),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create article';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        ...data.article,
        createdAt: new Date(data.article.createdAt),
        updatedAt: new Date(data.article.updatedAt),
      };
    } catch (error) {
      console.error('[ArticleAPI] Error creating article:', error);
      throw error;
    }
  },

  // 更新article
  async update(id: string, updates: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Article> {
    try {
      const apiUrl = getApiUrl(`/api/articles/${id}`);
      console.log(`[ArticleAPI] Updating article at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updates),
        signal: createTimeoutSignal(30000),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update article';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        ...data.article,
        createdAt: new Date(data.article.createdAt),
        updatedAt: new Date(data.article.updatedAt),
      };
    } catch (error) {
      console.error('[ArticleAPI] Error updating article:', error);
      throw error;
    }
  },

  // 删除article
  async delete(id: string): Promise<void> {
    try {
      const apiUrl = getApiUrl(`/api/articles/${id}`);
      console.log(`[ArticleAPI] Deleting article at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        signal: createTimeoutSignal(30000),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete article';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('[ArticleAPI] Error deleting article:', error);
      throw error;
    }
  },
};

// 用户信息API
export const userAPI = {
  // 保存用户信息（自动保存到数据库）
  async saveUserInfo(userData: any): Promise<void> {
    try {
      const apiUrl = getApiUrl('/api/users');
      console.log(`[UserAPI] Saving user info at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: createTimeoutSignal(10000),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save user info';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving user info:', error);
      throw error;
    }
  },
};







