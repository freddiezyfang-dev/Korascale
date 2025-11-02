// 数据库客户端封装
// 自动处理与PostgreSQL的交互

import { Journey, JourneyStatus } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Journey API调用
export const journeyAPI = {
  // 获取所有journeys
  async getAll(): Promise<Journey[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/journeys`);
      if (!response.ok) throw new Error('Failed to fetch journeys');
      const data = await response.json();
      return data.journeys || [];
    } catch (error) {
      console.error('Error fetching journeys:', error);
      return [];
    }
  },

  // 获取单个journey
  async getById(id: string): Promise<Journey | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/journeys/${id}`);
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
      const response = await fetch(`${API_BASE_URL}/api/journeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journey),
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
      const response = await fetch(`${API_BASE_URL}/api/journeys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
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
      const response = await fetch(`${API_BASE_URL}/api/journeys/${id}`, {
        method: 'DELETE',
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

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
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
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
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





