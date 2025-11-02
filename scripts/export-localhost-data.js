/**
 * 从 localhost 导出数据到 JSON 文件
 * 
 * 使用方法：
 * 1. 在浏览器中访问 localhost（如 http://localhost:3000）
 * 2. 打开浏览器 Console（F12）
 * 3. 复制并执行下面的代码
 * 4. 保存输出的 JSON 数据
 */

// 导出函数
async function exportLocalhostData() {
  const data = {
    journeys: [],
    experiences: [],
    hotels: [],
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  try {
    // 从 localStorage 导出
    const journeys = localStorage.getItem('journeys');
    const experiences = localStorage.getItem('experiences');
    const hotels = localStorage.getItem('hotels');

    if (journeys) {
      data.journeys = JSON.parse(journeys);
      console.log('✅ Exported', data.journeys.length, 'journeys');
    }

    if (experiences) {
      data.experiences = JSON.parse(experiences);
      console.log('✅ Exported', data.experiences.length, 'experiences');
    }

    if (hotels) {
      data.hotels = JSON.parse(hotels);
      console.log('✅ Exported', data.hotels.length, 'hotels');
    }

    // 输出 JSON
    const jsonString = JSON.stringify(data, null, 2);
    
    // 创建下载链接
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localhost-data-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Data exported and downloaded!');
    console.log('📋 JSON data:', jsonString);
    
    return data;
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
}

// 执行导出
exportLocalhostData();

