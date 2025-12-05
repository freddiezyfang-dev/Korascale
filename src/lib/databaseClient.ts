// 数据库客户端封装
// 自动处理与PostgreSQL的交互

import { Journey, JourneyStatus } from '@/types';

// 使用相对路径，在客户端自动使用当前域名
const getApiUrl = (path: string) => {
  // 在客户端使用相对路径，在服务端使用完整URL
  if (typeof window === 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    return `${baseUrl}${path}`;
  }
  return path;
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
  // 获取所有journeys
  async getAll(): Promise<Journey[]> {
    try {
      const response = await fetch(getApiUrl('/api/journeys'), {
        // 添加超时控制
        signal: createTimeoutSignal(10000), // 10秒超时
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
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data.journeys || [];
    } catch (error) {
      // 如果是 AbortError（超时），提供更友好的错误信息
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout: Failed to fetch journeys within 10 seconds');
      } else {
        console.error('Error fetching journeys:', error);
      }
      // 如果请求失败，返回空数组而不是挂起，让页面可以正常加载
      return [];
    }
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to update journey');
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







