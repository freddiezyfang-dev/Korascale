// 持久化数据存储工具
export interface PersistedData {
  journeys: any[];
  experiences: any[];
  hotels: any[];
  timestamp: string;
  version: string;
}

export class DataPersistenceManager {
  private static instance: DataPersistenceManager;
  private apiEndpoint: string;

  constructor() {
    // 在生产环境中使用API端点，开发环境使用localStorage
    this.apiEndpoint = process.env.NODE_ENV === 'production' 
      ? '/api/data' 
      : 'localStorage';
  }

  static getInstance(): DataPersistenceManager {
    if (!DataPersistenceManager.instance) {
      DataPersistenceManager.instance = new DataPersistenceManager();
    }
    return DataPersistenceManager.instance;
  }

  // 保存数据到持久化存储
  async saveData(data: Partial<PersistedData>): Promise<boolean> {
    try {
      if (this.apiEndpoint === 'localStorage') {
        // 开发环境：使用localStorage
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, JSON.stringify(data[key as keyof PersistedData]));
        });
        return true;
      } else {
        // 生产环境：使用API
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        return response.ok;
      }
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // 从持久化存储加载数据
  async loadData(): Promise<Partial<PersistedData>> {
    try {
      if (this.apiEndpoint === 'localStorage') {
        // 开发环境：从localStorage加载
        const journeys = localStorage.getItem('journeys');
        const experiences = localStorage.getItem('experiences');
        const hotels = localStorage.getItem('hotels');
        
        return {
          journeys: journeys ? JSON.parse(journeys) : [],
          experiences: experiences ? JSON.parse(experiences) : [],
          hotels: hotels ? JSON.parse(hotels) : [],
        };
      } else {
        // 生产环境：从API加载
        const response = await fetch(this.apiEndpoint);
        if (response.ok) {
          return await response.json();
        }
        return {};
      }
    } catch (error) {
      console.error('Error loading data:', error);
      return {};
    }
  }

  // 创建数据备份
  async createBackup(): Promise<boolean> {
    try {
      const data = await this.loadData();
      const backup = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '1.0',
        backup: true
      };
      
      if (this.apiEndpoint === 'localStorage') {
        localStorage.setItem('data_backup', JSON.stringify(backup));
        return true;
      } else {
        const response = await fetch(`${this.apiEndpoint}/backup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backup),
        });
        return response.ok;
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  }

  // 从备份恢复数据
  async restoreFromBackup(): Promise<boolean> {
    try {
      if (this.apiEndpoint === 'localStorage') {
        const backup = localStorage.getItem('data_backup');
        if (backup) {
          const parsedBackup = JSON.parse(backup);
          return await this.saveData(parsedBackup);
        }
        return false;
      } else {
        const response = await fetch(`${this.apiEndpoint}/restore`);
        if (response.ok) {
          const data = await response.json();
          return await this.saveData(data);
        }
        return false;
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }
}

// 导出单例实例
export const dataPersistence = DataPersistenceManager.getInstance();




