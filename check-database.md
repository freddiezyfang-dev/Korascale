# 检查数据库中的数据

请执行以下步骤来诊断问题：

1. **检查浏览器控制台**：
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签
   - 查找 "JourneyManagementContext: Loading journeys from database..."
   - 查看加载了多少journeys

2. **检查网络请求**：
   - 在 Network 标签中查找 `/api/journeys` 请求
   - 查看响应内容，确认是否包含同事上传的数据

3. **检查后台管理页面**：
   - 登录后台：/admin/journeys
   - 查看所有journeys列表（包括draft状态的）
   - 检查筛选器是否设置为"all"

4. **手动刷新数据**：
   - 在浏览器控制台执行：`window.location.reload()`
   - 或者清除localStorage：`localStorage.removeItem('journeys')` 然后刷新
