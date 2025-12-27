# 📤 手动导入 localStorage 数据到数据库 - 详细步骤

## 🎯 步骤 1：在那台设备上导出数据

### 1.1 打开那台设备上的网站

1. 在那台设备上打开浏览器
2. 访问：`https://korascale.vercel.app` 或 `https://www.korascale.com`
3. 打开浏览器开发者工具：
   - **Chrome/Edge**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Safari**: 需要先启用开发者工具（设置 → 高级 → 显示开发菜单）

### 1.2 打开 Console 标签

在开发者工具中，点击 **"Console"** 标签

### 1.3 执行导出代码

**复制以下代码，粘贴到 Console 中，然后按 Enter 执行**：

```javascript
// 导出 localStorage 中的数据
const exportData = () => {
  try {
    const data = {
      journeys: [],
      timestamp: new Date().toISOString(),
      source: 'localStorage'
    };

    // 从 localStorage 读取数据
    const journeys = localStorage.getItem('journeys');
    if (journeys) {
      data.journeys = JSON.parse(journeys);
      console.log('✅ 找到', data.journeys.length, '个 journeys');
      
      // 显示每个 journey 的标题
      data.journeys.forEach((j, i) => {
        console.log(`  ${i + 1}. ${j.title || j.id || '未命名'}`);
      });
    } else {
      console.log('⚠️ localStorage 中没有 journeys 数据');
      return null;
    }

    // 输出 JSON（格式化）
    const jsonString = JSON.stringify(data, null, 2);
    console.log('\n📋 JSON 数据：');
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

    console.log('\n✅ 数据已导出并下载！');
    console.log('📝 请复制上面的 JSON 数据，或使用下载的文件');
    
    return data;
  } catch (error) {
    console.error('❌ 导出失败:', error);
    return null;
  }
};

exportData();
```

### 1.4 保存导出的数据

**重要**：复制 Console 中显示的 JSON 数据（从 `{` 开始到 `}` 结束），或者使用下载的 JSON 文件。

---

## 🎯 步骤 2：在当前设备上导入数据

### 2.1 打开当前设备的网站

1. 在当前设备上打开浏览器
2. 访问：`https://korascale.vercel.app/admin/journeys`
3. 打开浏览器开发者工具（F12）
4. 点击 **"Console"** 标签

### 2.2 执行导入代码

**先复制以下导入函数代码，粘贴到 Console 中执行**：

```javascript
// 导入数据到数据库的函数
const importJourneys = async (jsonData) => {
  if (!jsonData || !jsonData.journeys || jsonData.journeys.length === 0) {
    console.error('❌ 没有找到 journeys 数据');
    return;
  }

  console.log(`\n📤 开始导入 ${jsonData.journeys.length} 个 journeys...`);
  console.log('⏳ 请耐心等待，这可能需要一些时间...\n');
  
  let success = 0;
  let failed = 0;
  const errors = [];
  const successes = [];

  for (let i = 0; i < jsonData.journeys.length; i++) {
    const journey = jsonData.journeys[i];
    const journeyTitle = journey.title || journey.id || `Journey ${i + 1}`;
    
    try {
      // 移除 id, createdAt, updatedAt（让数据库自动生成新的）
      const { id, createdAt, updatedAt, ...journeyData } = journey;
      
      console.log(`[${i + 1}/${jsonData.journeys.length}] 正在导入: ${journeyTitle}...`);
      
      const response = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journeyData)
      });

      if (response.ok) {
        const result = await response.json();
        success++;
        successes.push(journeyTitle);
        console.log(`  ✅ 成功: ${journeyTitle}`);
      } else {
        const errorData = await response.json();
        failed++;
        errors.push({ journey: journeyTitle, error: errorData.error || 'Unknown error' });
        console.error(`  ❌ 失败: ${journeyTitle}`, errorData);
      }
    } catch (error) {
      failed++;
      errors.push({ journey: journeyTitle, error: String(error) });
      console.error(`  ❌ 错误: ${journeyTitle}`, error);
    }
    
    // 稍微延迟，避免请求过快
    if (i < jsonData.journeys.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n📊 ========== 导入完成 ==========`);
  console.log(`✅ 成功: ${success}`);
  console.log(`❌ 失败: ${failed}`);
  
  if (successes.length > 0) {
    console.log('\n✅ 成功导入的 journeys:');
    successes.forEach((title, i) => console.log(`  ${i + 1}. ${title}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ 失败的 journeys:');
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.journey}: ${err.error}`);
    });
  }
  
  console.log('\n🔄 3秒后自动刷新页面...');
  setTimeout(() => {
    window.location.reload();
  }, 3000);
  
  return { success, failed, errors, successes };
};
```

### 2.3 执行导入

**现在，将你之前导出的 JSON 数据粘贴到 Console 中，然后执行**：

```javascript
// 将导出的 JSON 数据粘贴到这里
const data = {
  "journeys": [
    // ... 粘贴你的 JSON 数据 ...
  ],
  "timestamp": "...",
  "source": "localStorage"
};

// 执行导入
importJourneys(data);
```

**或者，如果你下载了 JSON 文件**：

```javascript
// 如果你下载了文件，可以这样读取（需要先上传文件）
// 或者直接复制文件内容粘贴到上面的 data 变量中
```

### 2.4 等待导入完成

- Console 会显示每个 journey 的导入进度
- 导入完成后会自动刷新页面
- 你应该能看到导入的数据

---

## ✅ 验证导入结果

### 方法 1：在后台查看

1. 刷新后台页面：`https://korascale.vercel.app/admin/journeys`
2. 你应该能看到导入的 journeys

### 方法 2：检查 API

访问：`https://korascale.vercel.app/api/journeys`

应该能看到导入的数据。

### 方法 3：在前端查看

访问：`https://korascale.vercel.app/journeys`

应该能看到导入的 journeys。

---

## 🚨 常见问题

### Q1: 导入时出现错误

**可能原因**：
- 数据格式不正确
- 网络问题
- 数据库连接问题

**解决方法**：
1. 检查 Console 中的错误信息
2. 确认数据格式正确（JSON 格式）
3. 重试导入失败的 journeys

### Q2: 导入后看不到数据

**可能原因**：
- 导入失败但没有显示错误
- 页面缓存问题

**解决方法**：
1. 强制刷新页面（Ctrl+F5 或 Cmd+Shift+R）
2. 检查 API 是否返回数据
3. 检查 Console 中的导入日志

### Q3: 数据重复

**说明**：
- 导入会创建新的记录（因为移除了 id）
- 如果数据已经在数据库中，会创建重复记录
- 这是正常的，你可以手动删除重复的数据

---

## 💡 提示

- **备份**：导入前建议先导出当前数据库中的数据作为备份
- **分批导入**：如果数据很多，可以分批导入（修改代码中的循环）
- **检查数据**：导入后检查数据是否完整，特别是图片 URL 等

如果遇到问题，请告诉我具体的错误信息！













