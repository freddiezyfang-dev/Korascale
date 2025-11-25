import { NextRequest, NextResponse } from 'next/server';

// 简单的内存存储（生产环境应该使用数据库）
let dataStore: any = {
  journeys: [],
  experiences: [],
  hotels: [],
  backups: []
};

export async function GET() {
  try {
    return NextResponse.json(dataStore);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 更新数据存储
    if (data.journeys) dataStore.journeys = data.journeys;
    if (data.experiences) dataStore.experiences = data.experiences;
    if (data.hotels) dataStore.hotels = data.hotels;
    
    // 添加时间戳
    dataStore.lastUpdated = new Date().toISOString();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

// 备份端点
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 创建备份
    const backup = {
      ...data,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    dataStore.backups.push(backup);
    
    // 只保留最近10个备份
    if (dataStore.backups.length > 10) {
      dataStore.backups = dataStore.backups.slice(-10);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

// 恢复端点
export async function DELETE() {
  try {
    if (dataStore.backups.length > 0) {
      const latestBackup = dataStore.backups[dataStore.backups.length - 1];
      
      // 恢复数据
      if (latestBackup.journeys) dataStore.journeys = latestBackup.journeys;
      if (latestBackup.experiences) dataStore.experiences = latestBackup.experiences;
      if (latestBackup.hotels) dataStore.hotels = latestBackup.hotels;
      
      dataStore.lastUpdated = new Date().toISOString();
      
      return NextResponse.json({ success: true, restored: latestBackup });
    }
    
    return NextResponse.json({ error: 'No backup found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to restore data' }, { status: 500 });
  }
}






