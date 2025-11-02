# 📤 如何将 Localhost 数据迁移到 Vercel

## 问题说明

如果 Vercel 页面内容与 localhost 不同，通常是因为：
- **Localhost**：使用 localStorage 数据或本地数据库数据
- **Vercel**：数据库是空的，显示默认数据

## 解决方案：将 Localhost 数据导入到 Vercel

---

## 🔧 方法 1：在浏览器中导出并导入（最简单）

### 步骤 1：从 Localhost 导出数据

1. **打开 localhost**（如 `http://localhost:3000`）
2. **打开浏览器 Console**（F12 → Console）
3. **复制并执行以下代码**：

```javascript
// 导出所有数据
async function exportLocalhostData() {
  const data = {
    journeys: [],
    experiences: [],
    hotels: [],
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  try {
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

    const jsonString = JSON.stringify(data, null, 2);
    console.log('📋 JSON Data:', jsonString);
    
    // 下载文件
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localhost-data-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Data exported!');
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

exportLocalhostData();
```

4. **保存下载的 JSON 文件**

### 步骤 2：在 Vercel 网站导入数据

1. **打开 Vercel 网站**（如 `https://your-project.vercel.app`）
2. **登录后台**（`/admin/journeys`）
3. **打开浏览器 Console**（F12 → Console）
4. **复制并执行以下代码**（将 `<YOUR_JSON_DATA>` 替换为导出的 JSON 数据）：

```javascript
// 导入数据到 Vercel 数据库
async function importToVercel(jsonData) {
  try {
    let imported = 0;
    let errors = 0;

    // 导入 Journeys
    if (jsonData.journeys && jsonData.journeys.length > 0) {
      console.log('📤 Importing', jsonData.journeys.length, 'journeys...');
      
      for (const journey of jsonData.journeys) {
        try {
          // 移除 id, createdAt, updatedAt（让数据库自动生成）
          const { id, createdAt, updatedAt, ...journeyData } = journey;
          
          const response = await fetch('/api/journeys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(journeyData)
          });

          if (response.ok) {
            imported++;
            console.log(`✅ Imported journey: ${journey.title}`);
          } else {
            const error = await response.json();
            console.error(`❌ Failed to import: ${journey.title}`, error);
            errors++;
          }
        } catch (error) {
          console.error(`❌ Error importing journey: ${journey.title}`, error);
          errors++;
        }
      }
    }

    // 导入 Experiences（如果有）
    if (jsonData.experiences && jsonData.experiences.length > 0) {
      console.log('📤 Importing', jsonData.experiences.length, 'experiences...');
      // 类似的处理逻辑
    }

    // 导入 Hotels（如果有）
    if (jsonData.hotels && jsonData.hotels.length > 0) {
      console.log('📤 Importing', jsonData.hotels.length, 'hotels...');
      // 类似的处理逻辑
    }

    console.log(`✅ Import complete! Imported: ${imported}, Errors: ${errors}`);
    alert(`导入完成！成功: ${imported}, 失败: ${errors}`);
  } catch (error) {
    console.error('❌ Import failed:', error);
    alert('导入失败：' + error.message);
  }
}

// 使用示例：
// 1. 先复制导出的 JSON 数据
// 2. 然后执行：
const jsonData = <YOUR_JSON_DATA>; // 粘贴导出的 JSON 数据
importToVercel(jsonData);
```

5. **刷新页面**，查看数据是否导入成功

---

## 🔧 方法 2：使用 API 批量导入（推荐）

### 步骤 1：导出数据（同方法 1 的步骤 1）

### 步骤 2：创建导入脚本

创建一个临时页面或使用 API：

```javascript
// 在浏览器 Console 中执行
async function batchImportToVercel(jsonData) {
  const results = {
    journeys: { success: 0, failed: 0, errors: [] },
    experiences: { success: 0, failed: 0, errors: [] },
    hotels: { success: 0, failed: 0, errors: [] }
  };

  // 导入 Journeys
  if (jsonData.journeys) {
    for (const journey of jsonData.journeys) {
      try {
        const { id, createdAt, updatedAt, ...cleanJourney } = journey;
        const response = await fetch('/api/journeys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanJourney)
        });

        if (response.ok) {
          results.journeys.success++;
        } else {
          results.journeys.failed++;
          const error = await response.json();
          results.journeys.errors.push({ journey: journey.title, error });
        }
      } catch (error) {
        results.journeys.failed++;
        results.journeys.errors.push({ journey: journey.title, error: error.message });
      }
    }
  }

  console.log('📊 Import Results:', results);
  return results;
}

// 使用
const jsonData = <YOUR_JSON_DATA>;
batchImportToVercel(jsonData);
```

---

## 🔧 方法 3：直接在后台手动添加（如果数据不多）

如果只有几个 journeys，可以在 Vercel 后台手动添加：

1. 访问 Vercel 网站的后台（`/admin/journeys`）
2. 点击 "Add New Journey"
3. 复制 localhost 中的数据，手动填写表单
4. 保存

---

## ✅ 验证导入成功

导入后，验证数据：

1. **访问 API**：
   ```
   https://your-project.vercel.app/api/journeys
   ```
   应该返回导入的 journeys

2. **查看页面**：
   - 访问首页或 `/journeys` 页面
   - 应该显示导入的数据

3. **检查 Console**：
   - 应该看到：`Loaded from database: X journeys`

---

## 🐛 常见问题

### 问题：导入时出现 "Journey already exists"

**原因**：数据库已有相同 slug 的 journey

**解决**：
- 修改 journey 的 `slug` 字段
- 或先删除旧的 journey

### 问题：导入后页面仍然显示默认数据

**检查**：
1. 确认 API 返回了数据：`/api/journeys`
2. 检查浏览器 Console 的日志
3. 清除浏览器缓存，硬刷新

### 问题：图片 URL 不工作

**原因**：本地图片路径（如 `/images/...`）在 Vercel 上可能不可用

**解决**：
1. 上传图片到 Vercel Blob
2. 更新 journey 的 `image` 字段为 Blob URL

---

## 📝 快速命令总结

### 导出数据（在 localhost Console）：
```javascript
// 复制 scripts/export-localhost-data.js 中的代码
```

### 导入数据（在 Vercel Console）：
```javascript
// 使用导出的 JSON 数据
const jsonData = <PASTE_YOUR_JSON>;
importToVercel(jsonData);
```

---

完成导入后，Vercel 页面应该显示与 localhost 相同的内容！🎉

