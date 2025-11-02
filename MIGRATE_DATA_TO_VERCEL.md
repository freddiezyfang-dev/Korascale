# 🚀 将 Localhost 数据迁移到 Vercel - 完整指南

## 📋 问题诊断

**症状**：Vercel 页面内容与 localhost 不同

**原因**：
- Localhost 使用 localStorage 数据或本地数据库数据
- Vercel 数据库是空的，显示默认数据（`defaultJourneys`）

**解决方案**：将 localhost 的数据导入到 Vercel 数据库

---

## 🎯 快速开始（最简单的方法）

### 步骤 1：在 Localhost 导出数据

1. **打开 localhost**（`http://localhost:3000`）
2. **打开浏览器 Console**（按 F12 → Console 标签）
3. **复制并执行以下代码**：

```javascript
// 导出所有数据
const exportData = () => {
  const data = {
    journeys: [],
    experiences: [],
    hotels: [],
    timestamp: new Date().toISOString()
  };

  const journeys = localStorage.getItem('journeys');
  const experiences = localStorage.getItem('experiences');
  const hotels = localStorage.getItem('hotels');

  if (journeys) data.journeys = JSON.parse(journeys);
  if (experiences) data.experiences = JSON.parse(experiences);
  if (hotels) data.hotels = JSON.parse(hotels);

  const json = JSON.stringify(data, null, 2);
  console.log(json);
  
  // 自动下载
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${Date.now()}.json`;
  a.click();
  
  return data;
};

exportData();
```

4. **复制 Console 中显示的 JSON 数据**（或保存下载的文件）

### 步骤 2：在 Vercel 网站导入数据

1. **打开 Vercel 网站**（`https://your-project.vercel.app`）
2. **打开浏览器 Console**（F12 → Console）
3. **粘贴导出的 JSON 数据**，然后执行：

```javascript
// 导入数据函数
const importData = async (jsonData) => {
  let success = 0;
  let failed = 0;
  const errors = [];

  // 导入 Journeys
  if (jsonData.journeys && jsonData.journeys.length > 0) {
    console.log(`📤 开始导入 ${jsonData.journeys.length} 个 journeys...`);
    
    for (const journey of jsonData.journeys) {
      try {
        // 移除 id, createdAt, updatedAt
        const { id, createdAt, updatedAt, ...clean } = journey;
        
        const res = await fetch('/api/journeys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clean)
        });

        if (res.ok) {
          success++;
          console.log(`✅ ${journey.title}`);
        } else {
          failed++;
          const err = await res.json();
          errors.push(`${journey.title}: ${err.error}`);
          console.error(`❌ ${journey.title}:`, err);
        }
      } catch (error) {
        failed++;
        errors.push(`${journey.title}: ${error.message}`);
        console.error(`❌ ${journey.title}:`, error);
      }
      
      // 延迟避免请求过快
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`\n📊 导入完成！成功: ${success}, 失败: ${failed}`);
  if (errors.length > 0) {
    console.log('错误列表:', errors);
  }
  
  alert(`导入完成！成功: ${success}, 失败: ${failed}`);
};

// 使用方法：将导出的 JSON 数据赋值给 data，然后执行
const data = <PASTE_YOUR_JSON_DATA_HERE>;
importData(data);
```

4. **等待导入完成**，然后刷新页面

---

## 🔧 方法 2：使用导入工具页面

### 步骤 1：创建导入页面

1. 将 `scripts/import-journeys-to-vercel.html` 复制到 `public/import.html`
2. 或在 Vercel 网站 Console 中直接执行导入代码（方法 1）

### 步骤 2：访问导入页面

1. 访问 `https://your-project.vercel.app/import.html`
2. 粘贴导出的 JSON 数据
3. 点击"开始导入"
4. 等待完成

---

## ✅ 验证导入成功

### 检查 1：API 返回数据

访问：
```
https://your-project.vercel.app/api/journeys
```

应该返回导入的 journeys 数组（不是空数组）

### 检查 2：页面显示数据

1. 访问首页或 `/journeys` 页面
2. 应该显示导入的数据（不是默认数据）

### 检查 3：Console 日志

在浏览器 Console 中应该看到：
```
JourneyManagementContext: Loaded from database: X journeys
```

而不是：
```
JourneyManagementContext: No stored journeys, using default data
```

---

## 🐛 常见问题解决

### 问题 1：导入时出现 "Journey already exists" 或 "Duplicate entry"

**原因**：数据库已有相同 slug 的 journey

**解决**：
- 修改 journey 的 `slug` 字段，使其唯一
- 或先删除旧的 journey（在后台编辑页面）

### 问题 2：导入后页面仍然显示默认数据

**检查清单**：
1. ✅ 确认 API 返回了数据：访问 `/api/journeys`
2. ✅ 检查浏览器 Console 的日志
3. ✅ 清除浏览器缓存，硬刷新（`Ctrl+Shift+R` 或 `Cmd+Shift+R`）
4. ✅ 检查是否有 JavaScript 错误

### 问题 3：图片 URL 不工作

**原因**：本地图片路径（如 `/images/xxx.jpg`）在 Vercel 上可能不可用

**解决**：
1. 使用后台编辑页面的上传功能
2. 上传图片到 Vercel Blob
3. 更新 journey 的 `image` 字段为 Blob URL

### 问题 4：导入速度慢

**原因**：逐个导入，数据量大时较慢

**解决**：
- 这是正常的，为了稳定性逐个导入
- 如果数据很多，可以分批导入

---

## 📝 导入 Experiences 和 Hotels（可选）

如果需要导入 Experiences 和 Hotels，可以扩展导入代码：

```javascript
// 导入 Experiences
if (jsonData.experiences && jsonData.experiences.length > 0) {
  for (const exp of jsonData.experiences) {
    const { id, createdAt, updatedAt, ...clean } = exp;
    await fetch('/api/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean)
    });
  }
}

// 导入 Hotels（类似）
```

---

## 🎯 完整示例代码

### 在 Localhost 执行（导出）：

```javascript
const exportData = () => {
  const data = {
    journeys: JSON.parse(localStorage.getItem('journeys') || '[]'),
    experiences: JSON.parse(localStorage.getItem('experiences') || '[]'),
    hotels: JSON.parse(localStorage.getItem('hotels') || '[]'),
    timestamp: new Date().toISOString()
  };
  
  const json = JSON.stringify(data, null, 2);
  console.log(json);
  
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${Date.now()}.json`;
  a.click();
  
  return data;
};

exportData();
```

### 在 Vercel 执行（导入）：

```javascript
const importJourneys = async (journeys) => {
  let success = 0;
  let failed = 0;
  
  for (const journey of journeys) {
    try {
      const { id, createdAt, updatedAt, ...clean } = journey;
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean)
      });
      
      if (res.ok) {
        success++;
        console.log(`✅ ${journey.title}`);
      } else {
        failed++;
        console.error(`❌ ${journey.title}`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ ${journey.title}:`, error);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`完成！成功: ${success}, 失败: ${failed}`);
};

// 使用
const data = <PASTE_YOUR_JSON>;
importJourneys(data.journeys);
```

---

## ✅ 完成！

导入完成后，Vercel 页面应该显示与 localhost 相同的内容。

如果还有问题，请检查：
1. 浏览器 Console 的错误信息
2. Vercel Function Logs（Dashboard → Functions → Logs）
3. 数据库表是否有数据（Dashboard → Storage → Postgres → Tables）

---

**需要帮助？** 查看 `DEBUG_VERCEL_LOCALHOST_DIFFERENCES.md` 获取更多诊断信息。

