# 📤 将另一台设备的数据导入到数据库

## 📋 情况说明

如果你昨晚在另一台设备上传了数据，而当时数据库连接失败（因为 `NEON_POSTGRES_URL` 格式错误），数据可能只保存在了那台设备的 **localStorage** 中。

现在数据库连接已修复，你需要将 localStorage 中的数据导入到数据库。

---

## 🎯 方法 1：自动迁移（如果数据还在 localStorage）

如果你的数据还在那台设备的浏览器 localStorage 中：

### 步骤 1：在那台设备上打开网站

1. 在那台设备上打开你的网站：`https://korascale.vercel.app` 或 `https://www.korascale.com`
2. 访问后台页面：`https://korascale.vercel.app/admin/journeys`

### 步骤 2：触发自动迁移

系统会自动检测 localStorage 中的数据并迁移到数据库：

1. 打开浏览器 Console（F12 → Console）
2. 查看是否有以下日志：
   ```
   JourneyManagementContext: Migrating from localStorage: X journeys
   ```
3. 等待几秒钟，让迁移完成

### 步骤 3：验证迁移

1. 刷新页面
2. 数据应该从数据库加载（不再从 localStorage）
3. 在其他设备上访问网站，应该能看到这些数据

---

## 🎯 方法 2：手动导出并导入（推荐）

如果自动迁移没有工作，或者你想确保数据完整迁移：

### 步骤 1：在那台设备上导出数据

1. **在那台设备上打开网站**：`https://korascale.vercel.app`
2. **打开浏览器 Console**（F12 → Console）
3. **复制并执行以下代码**：

```javascript
// 导出 localStorage 中的数据
const exportData = () => {
  const data = {
    journeys: [],
    timestamp: new Date().toISOString()
  };

  // 从 localStorage 读取数据
  const journeys = localStorage.getItem('journeys');
  if (journeys) {
    data.journeys = JSON.parse(journeys);
    console.log('✅ 找到', data.journeys.length, '个 journeys');
  } else {
    console.log('⚠️ localStorage 中没有 journeys 数据');
  }

  // 输出 JSON
  const jsonString = JSON.stringify(data, null, 2);
  console.log('📋 JSON 数据：');
  console.log(jsonString);
  
  // 自动下载文件
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `journeys-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✅ 数据已导出！');
  return data;
};

exportData();
```

4. **复制 Console 中显示的 JSON 数据**（或保存下载的文件）

### 步骤 2：在当前设备上导入数据

1. **在当前设备上打开网站**：`https://korascale.vercel.app`
2. **打开浏览器 Console**（F12 → Console）
3. **复制并执行以下代码**（将 `<YOUR_JSON_DATA>` 替换为导出的 JSON 数据）：

```javascript
// 导入数据到数据库
const importJourneys = async (jsonData) => {
  if (!jsonData || !jsonData.journeys || jsonData.journeys.length === 0) {
    console.error('❌ 没有找到 journeys 数据');
    return;
  }

  console.log(`📤 开始导入 ${jsonData.journeys.length} 个 journeys...`);
  
  let success = 0;
  let failed = 0;
  const errors = [];

  for (const journey of jsonData.journeys) {
    try {
      // 移除 id, createdAt, updatedAt（让数据库自动生成新的）
      const { id, createdAt, updatedAt, ...journeyData } = journey;
      
      const response = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journeyData)
      });

      if (response.ok) {
        const result = await response.json();
        success++;
        console.log(`✅ 已导入: ${journey.title || journey.id}`);
      } else {
        const error = await response.json();
        failed++;
        errors.push({ journey: journey.title || journey.id, error });
        console.error(`❌ 导入失败: ${journey.title || journey.id}`, error);
      }
    } catch (error) {
      failed++;
      errors.push({ journey: journey.title || journey.id, error: String(error) });
      console.error(`❌ 错误: ${journey.title || journey.id}`, error);
    }
    
    // 稍微延迟，避免请求过快
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n📊 导入完成！`);
  console.log(`✅ 成功: ${success}`);
  console.log(`❌ 失败: ${failed}`);
  
  if (errors.length > 0) {
    console.log('❌ 失败的 journeys:', errors);
  }
  
  // 刷新页面以查看新数据
  console.log('🔄 刷新页面以查看新数据...');
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

// 使用示例：
// 1. 先执行 exportData() 导出数据
// 2. 复制导出的 JSON 数据
// 3. 在这里粘贴并执行：

const data = <PASTE_YOUR_JSON_DATA_HERE>;
importJourneys(data);
```

4. **等待导入完成**（Console 会显示进度）
5. **页面会自动刷新**，你应该能看到导入的数据

---

## 🎯 方法 3：直接在后台重新添加（如果数据不多）

如果数据不多，你也可以：

1. 在那台设备上查看 localStorage 中的数据
2. 手动在后台重新添加这些数据

---

## ✅ 验证数据已导入

导入完成后：

1. **刷新页面**，数据应该从数据库加载
2. **在其他设备上访问网站**，应该能看到这些数据
3. **检查 API**：访问 `https://korascale.vercel.app/api/journeys`，应该能看到导入的数据

---

## 💡 提示

- **数据去重**：如果数据已经在数据库中，导入时会创建新的记录（因为 id 会被移除）
- **图片 URL**：如果数据中包含图片 URL，这些 URL 应该仍然有效
- **备份**：导入前建议先导出当前数据库中的数据作为备份

---

## 🚨 如果遇到问题

1. **检查 Console 错误**：查看是否有错误信息
2. **检查网络请求**：在 Network 标签中查看 `/api/journeys` 请求是否成功
3. **检查数据库**：在 Vercel Dashboard → Storage → Postgres → Tables → journeys 中查看数据

如果还有问题，请告诉我具体的错误信息！














