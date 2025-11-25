# Namecheap DNS 配置详细步骤

## 📍 在 Namecheap 中找到 DNS 设置

### 步骤 1: 登录 Namecheap

1. 访问 https://www.namecheap.com
2. 点击右上角 **"Sign In"** 登录
3. 使用您的账户登录

### 步骤 2: 进入域名列表

1. 登录后，点击右上角的 **"Account"** 菜单
2. 在下拉菜单中选择 **"Domain List"**
3. 或者直接访问：https://ap.www.namecheap.com/domains/list/

### 步骤 3: 找到您的域名

1. 在域名列表中找到 `korascale.com`
2. 点击域名右侧的 **"Manage"** 按钮
3. 进入域名管理页面

### 步骤 4: 找到 DNS 设置

在域名管理页面，您会看到多个标签页：

1. **"Domain"** 标签（默认）
2. **"Advanced DNS"** 标签 ← **这就是您需要的！**

点击 **"Advanced DNS"** 标签，这就是 DNS 设置的地方。

---

## 🔧 在 Namecheap 中添加 DNS 记录

### 位置说明

在 **"Advanced DNS"** 标签页中，您会看到：

1. **"Host Records"** 部分
   - 这是添加 DNS 记录的地方
   - 显示现有的 DNS 记录列表

2. **"Add New Record"** 按钮
   - 用于添加新的 DNS 记录
   - 点击后会显示记录类型选择

---

## 📝 添加 Google Workspace TXT 记录

### 步骤 1: 获取 Google Workspace 的 TXT 记录

在 Google Workspace 设置中，您会看到类似这样的 TXT 记录：

```
Type: TXT
Name: @
Value: google-site-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 步骤 2: 在 Namecheap 添加 TXT 记录

1. **进入 Advanced DNS 标签**
   - 在域名管理页面
   - 点击 **"Advanced DNS"** 标签

2. **找到 Host Records 部分**
   - 向下滚动到 **"Host Records"** 部分
   - 查看现有的记录列表

3. **点击 "Add New Record" 按钮**
   - 在 Host Records 部分
   - 点击 **"Add New Record"** 按钮

4. **选择记录类型**
   - 在弹出的选项中，选择 **"TXT Record"**

5. **填写记录信息**
   - **Host:** 输入 `@`（表示根域名）
   - **Value:** 粘贴 Google 提供的完整验证值
     - 例如：`google-site-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **TTL:** 选择 **"Automatic"** 或 **"30 min"**

6. **保存记录**
   - 点击右侧的 **"✓"**（绿色对勾）保存
   - 或点击 **"Save All Changes"** 按钮

### 步骤 3: 验证记录已添加

1. 在 Host Records 列表中
2. 查找您刚添加的 TXT 记录
3. 确认显示正确：
   - Type: TXT
   - Host: @
   - Value: google-site-verification=...

---

## 📋 添加 Google Workspace MX 记录

### ⚠️ 重要：Google Workspace 需要多个 MX 记录

**注意：** Google Workspace 通常需要 **5 个 MX 记录**，而不是只有一个。如果 Google 的界面只显示一个，您需要添加所有 5 个。

### 步骤 1: 获取 Google Workspace 的 MX 记录

Google Workspace 需要以下 **5 个 MX 记录**：

```
Priority: 1, Value: aspmx.l.google.com
Priority: 5, Value: alt1.aspmx.l.google.com
Priority: 5, Value: alt2.aspmx.l.google.com
Priority: 10, Value: alt3.aspmx.l.google.com
Priority: 10, Value: alt4.aspmx.l.google.com
```

**注意：** 如果 Google 界面显示的是 `SMTP.GOOGLE.COM`，这可能是简化版本。建议使用上面的标准 MX 记录值。

### ⚠️ 如果 Namecheap 没有 "MX Record" 选项

**可能的原因和解决方法：**

#### 方法 1: 查找 "Mail Settings" 或 "Email" 部分

Namecheap 可能将 MX 记录放在专门的邮件设置区域：

1. 在域名管理页面，查找以下标签或部分：
   - **"Email"** 标签
   - **"Mail Settings"** 部分
   - **"Email Forwarding"** 部分
   - **"MX Records"** 部分

2. 如果找到，点击进入该部分

#### 方法 2: 使用 "Custom DNS" 或 "Custom Records"

1. 在 Advanced DNS 中，查找：
   - **"Custom DNS"** 选项
   - **"Custom Records"** 选项
   - **"All Records"** 选项

2. 选择后，应该能看到所有记录类型，包括 MX

#### 方法 3: 检查记录类型下拉菜单

1. 点击 **"Add New Record"**
2. 查看下拉菜单中的所有选项
3. 可能显示为：
   - **"MX"**（大写）
   - **"Mail Exchange"**
   - **"Email MX"**
   - 或其他类似名称

#### 方法 4: 使用 "Mail Exchange Record" 全称

某些界面可能使用完整名称而不是缩写。

#### 方法 5: 切换到 "Custom DNS" 模式

如果 Namecheap 使用的是 "Basic DNS" 模式，可能需要切换到 "Custom DNS"：

1. 在域名管理页面，查找 **"Nameservers"** 部分
2. 选择 **"Custom DNS"** 或 **"Namecheap BasicDNS"**
3. 切换到 **"Custom DNS"** 模式
4. 然后应该能看到所有 DNS 记录类型，包括 MX

### 步骤 2: 在 Namecheap 添加 MX 记录

**重要：** 需要添加 **5 个 MX 记录**，每个都要单独添加。

**如果找不到 MX Record 选项，请先尝试上面的方法 1-5。**

#### 添加第一个 MX 记录（优先级 1）：

1. 在 Advanced DNS → Host Records
2. 点击 **"Add New Record"**
3. 选择 **"MX Record"**
4. 填写：
   - **Host:** `@`（或留空，取决于 Namecheap 的界面）
   - **Value:** `aspmx.l.google.com`（注意：不要包含末尾的点，除非 Namecheap 要求）
   - **Priority:** `1`
   - **TTL:** Automatic（或选择最低值）
5. 点击 **"✓"** 保存

#### 添加第二个 MX 记录（优先级 5）：

1. 再次点击 **"Add New Record"**
2. 选择 **"MX Record"**
3. 填写：
   - **Host:** `@`
   - **Value:** `alt1.aspmx.l.google.com`
   - **Priority:** `5`
   - **TTL:** Automatic
4. 点击 **"✓"** 保存

#### 添加第三个 MX 记录（优先级 5）：

1. 再次点击 **"Add New Record"**
2. 选择 **"MX Record"**
3. 填写：
   - **Host:** `@`
   - **Value:** `alt2.aspmx.l.google.com`
   - **Priority:** `5`
   - **TTL:** Automatic
4. 点击 **"✓"** 保存

#### 添加第四个 MX 记录（优先级 10）：

1. 再次点击 **"Add New Record"**
2. 选择 **"MX Record"**
3. 填写：
   - **Host:** `@`
   - **Value:** `alt3.aspmx.l.google.com`
   - **Priority:** `10`
   - **TTL:** Automatic
4. 点击 **"✓"** 保存

#### 添加第五个 MX 记录（优先级 10）：

1. 再次点击 **"Add New Record"**
2. 选择 **"MX Record"**
3. 填写：
   - **Host:** `@`
   - **Value:** `alt4.aspmx.l.google.com`
   - **Priority:** `10`
   - **TTL:** Automatic
4. 点击 **"✓"** 保存

### ⚠️ 关于 Google 界面显示的 "SMTP.GOOGLE.COM"

如果 Google Workspace 界面显示的是 `SMTP.GOOGLE.COM`，这可能是：
- 简化版本（用于某些特殊情况）
- 或者界面显示有误

**建议：** 使用标准的 Google Workspace MX 记录值（`aspmx.l.google.com` 等），这些是 Google 官方推荐的配置。

---

## 🎯 完整配置清单

### Google Workspace 需要的 DNS 记录：

#### 1. TXT 记录（域名验证）
```
Type: TXT
Host: @
Value: google-site-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TTL: Automatic
```

#### 2. MX 记录（邮件路由）
```
Type: MX
Host: @
Priority: 1
Value: aspmx.l.google.com

Type: MX
Host: @
Priority: 5
Value: alt1.aspmx.l.google.com

Type: MX
Host: @
Priority: 5
Value: alt2.aspmx.l.google.com

Type: MX
Host: @
Priority: 10
Value: alt3.aspmx.l.google.com

Type: MX
Host: @
Priority: 10
Value: alt4.aspmx.l.google.com
```

#### 3. SPF 记录（可选，但推荐）
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.google.com ~all
TTL: Automatic
```

---

## 📍 界面位置说明

### Namecheap 域名管理页面结构：

```
┌─────────────────────────────────────┐
│  Domain: korascale.com              │
├─────────────────────────────────────┤
│  [Domain] [Advanced DNS] [...]    │ ← 标签页
├─────────────────────────────────────┤
│                                     │
│  Host Records                       │ ← DNS 记录部分
│  ┌─────────────────────────────┐   │
│  │ Type | Host | Value | TTL   │   │
│  ├─────────────────────────────┤   │
│  │ A    | @    | ...   | ...   │   │
│  │ CNAME| www  | ...   | ...   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Add New Record]                 │ ← 添加记录按钮
│                                     │
└─────────────────────────────────────┘
```

---

## ⚠️ 重要提示

### 1. Host 字段说明

- **`@`** = 根域名（`korascale.com`）
- **`www`** = 子域名（`www.korascale.com`）
- **留空** = 在某些界面中，留空也表示根域名

### 2. 记录值格式

- **TXT 记录：** 直接粘贴完整值，包括 `google-site-verification=`
- **MX 记录：** 只填写域名部分（如 `aspmx.l.google.com`），不要包含优先级

### 3. 保存更改

- 添加每条记录后，点击 **"✓"** 保存
- 或点击页面底部的 **"Save All Changes"** 保存所有更改

### 4. DNS 传播时间

- 通常需要 **5 分钟到 2 小时**
- 有时可能需要 **24 小时**
- 添加记录后，等待一段时间再验证

---

## 🔍 验证 DNS 记录

### 方法 1: 在 Namecheap 中查看

1. 进入 Advanced DNS → Host Records
2. 确认所有记录都已正确添加
3. 检查记录值是否正确

### 方法 2: 使用在线工具

1. 访问 https://dnschecker.org
2. 选择记录类型（TXT 或 MX）
3. 输入域名：`korascale.com`
4. 查看全球 DNS 传播状态

### 方法 3: 使用命令行

```bash
# 检查 TXT 记录
dig @8.8.8.8 TXT korascale.com

# 检查 MX 记录
dig @8.8.8.8 MX korascale.com
```

---

## 🎯 快速操作步骤总结

1. **登录 Namecheap**
   - https://www.namecheap.com → Sign In

2. **进入域名管理**
   - Account → Domain List → 找到域名 → Manage

3. **打开 DNS 设置**
   - 点击 **"Advanced DNS"** 标签

4. **添加记录**
   - 点击 **"Add New Record"**
   - 选择记录类型（TXT 或 MX）
   - 填写信息
   - 点击 **"✓"** 保存

5. **等待 DNS 传播**
   - 5 分钟到 2 小时

6. **在 Google Workspace 验证**
   - 返回 Google Workspace 控制台
   - 点击 "Verify" 验证域名

---

## 📞 需要帮助？

如果找不到 Advanced DNS 标签：

1. **确认您已登录**
   - 检查右上角是否显示您的用户名

2. **确认域名已激活**
   - 域名购买后需要几分钟激活

3. **尝试刷新页面**
   - 按 F5 或 Cmd+R 刷新

4. **查看 Namecheap 帮助**
   - https://www.namecheap.com/support/knowledgebase/

---

**配置完成后，等待 DNS 传播，然后在 Google Workspace 中验证域名！** 🎉

