// 数据恢复和检查工具
export interface DataCheckResult {
  hasLocalStorageData: boolean;
  hasBackupData: boolean;
  localStorageCount: number;
  backupCount: number;
  localStorageData: any[];
  backupData: any[];
  isDataIntact: boolean;
}

export const checkDataStatus = (): DataCheckResult => {
  try {
    // 检查localStorage中的数据
    const storedJourneys = localStorage.getItem('journeys');
    const localStorageData = storedJourneys ? JSON.parse(storedJourneys) : [];
    
    // 检查备份数据
    const backupJourneys = localStorage.getItem('journeys_backup');
    const backupData = backupJourneys ? JSON.parse(backupJourneys).journeys : [];
    
    // 验证数据完整性
    const isLocalStorageIntact = localStorageData.length > 0 && 
      localStorageData.every((journey: any) => journey.id && journey.title);
    
    const isBackupIntact = backupData.length > 0 && 
      backupData.every((journey: any) => journey.id && journey.title);
    
    return {
      hasLocalStorageData: localStorageData.length > 0,
      hasBackupData: backupData.length > 0,
      localStorageCount: localStorageData.length,
      backupCount: backupData.length,
      localStorageData,
      backupData,
      isDataIntact: isLocalStorageIntact || isBackupIntact
    };
  } catch (error) {
    console.error('Error checking data status:', error);
    return {
      hasLocalStorageData: false,
      hasBackupData: false,
      localStorageCount: 0,
      backupCount: 0,
      localStorageData: [],
      backupData: [],
      isDataIntact: false
    };
  }
};

export const createEmergencyBackup = () => {
  try {
    const storedJourneys = localStorage.getItem('journeys');
    if (storedJourneys) {
      const backup = {
        journeys: JSON.parse(storedJourneys),
        timestamp: new Date().toISOString(),
        version: '1.0',
        emergency: true
      };
      localStorage.setItem('journeys_emergency_backup', JSON.stringify(backup));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error creating emergency backup:', error);
    return false;
  }
};

export const restoreFromEmergencyBackup = () => {
  try {
    const emergencyBackup = localStorage.getItem('journeys_emergency_backup');
    if (emergencyBackup) {
      const parsedBackup = JSON.parse(emergencyBackup);
      if (parsedBackup.journeys && Array.isArray(parsedBackup.journeys)) {
        localStorage.setItem('journeys', JSON.stringify(parsedBackup.journeys));
        return parsedBackup.journeys;
      }
    }
    return null;
  } catch (error) {
    console.error('Error restoring from emergency backup:', error);
    return null;
  }
};



