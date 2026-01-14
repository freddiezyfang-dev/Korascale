// 数据库客户端封装
// 自动处理与PostgreSQL的交互

import { Journey, JourneyStatus } from '@/types';

// 使用相对路径，在客户端自动使用当前域名
const getApiUrl = (path: string) => {
  // 在客户端始终使用相对路径，避免 CORS 问题
  if (typeof window !== 'undefined') {
    // 客户端：确保使用相对路径
    return path.startsWith('/') ? path : `/${path}`;
  }
  // 服务端：使用环境变量或默认值
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || 
                  'http://localhost:3000';
  return `${baseUrl}${path}`;
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
        const response = await fetch(apiUrl, {
          // 添加超时控制
          signal: createTimeoutSignal(timeoutMs),
          // 添加缓存控制
          cache: 'no-store',
          // 添加 headers
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          // 尝试获取详细的错误信息
          let errorMessage = `Failed to fetch journeys (HTTP ${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // 如果无法解析错误响应，使用默认消息
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
      const response = await fetch(getApiUrl(`/api/journeys/${id}`), {
        signal: createTimeoutSignal(10000),
      });
      if (!response.ok) throw new Error('Failed to fetch journey');
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
      const response = await fetch(getApiUrl('/api/journeys'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journey),
        signal: createTimeoutSignal(15000),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create journey');
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
      const response = await fetch(getApiUrl(`/api/journeys/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch(getApiUrl(`/api/journeys/${id}`), {
        method: 'DELETE',
        signal: createTimeoutSignal(10000),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete journey');
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

// 用户信息API
export const userAPI = {
  // 保存用户信息（自动保存到数据库）
  async saveUserInfo(userData: any): Promise<void> {
    try {
      const response = await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: createTimeoutSignal(10000),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user info');
      }
    } catch (error) {
      console.error('Error saving user info:', error);
      throw error;
    }
  },
};







