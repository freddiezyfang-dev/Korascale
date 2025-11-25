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
      if (!response.ok) throw new Error('Failed to fetch journeys');
      const data = await response.json();
      return data.journeys || [];
    } catch (error) {
      console.error('Error fetching journeys:', error);
      // 如果请求失败，返回空数组而不是挂起
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

// 图片上传API
export const uploadAPI = {
  // 上传图片到云存储（自动保存）
  async uploadImage(file: File, folder: 'journeys' | 'experiences' | 'hotels' = 'journeys'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch(getApiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
        signal: createTimeoutSignal(30000), // 上传需要更长时间
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url; // 返回图片URL
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
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







