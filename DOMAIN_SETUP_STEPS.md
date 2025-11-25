# 域名配置详细步骤 - Namecheap + Vercel

## 📋 快速开始

您已经购买了 `korascale.com` 域名，现在需要将其配置到 Vercel。按照以下步骤操作：

---

## 步骤 1: 在 Vercel 添加域名

### 1.1 登录 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 登录您的账户
3. 找到您的项目（my-travel-web）

### 1.2 添加域名

1. 点击项目名称进入项目详情
2. 点击顶部菜单的 **Settings**
3. 在左侧菜单中找到 **Domains**
4. 点击 **Add Domain** 按钮
5. 输入您的域名：`korascale.com`
6. 点击 **Add** 按钮

### 1.3 查看 DNS 配置说明

添加域名后，Vercel 会显示配置说明。通常有两种方式：

**方式 A：使用 Vercel 的 Nameservers（推荐，最简单）**
- Vercel 会提供 2-4 个 Nameservers
- 例如：`ns1.vercel-dns.com`, `ns2.vercel-dns.com`

**方式 B：使用 A 记录和 CNAME 记录**
- 需要添加 A 记录和 CNAME 记录
- 例如：
  ```
  Type: A
  Name: @
  Value: 76.76.21.21
  ```
  ```
  Type: CNAME
  Name: www
  Value: cname.vercel-dns.com
  ```

**建议：** 如果 Vercel 提供了 Nameservers，使用方式 A（更简单）。如果没有，使用方式 B。

### 1.4 📍 在哪里找到 Vercel 提供的 IP 地址或 DNS 配置？

**重要：** Vercel 的 DNS 配置信息显示在域名添加后的页面上。按以下步骤查找：

#### 步骤 1: 进入域名配置页面

1. 在 Vercel Dashboard 中，进入您的项目
2. 点击 **Settings** → **Domains**
3. 找到您刚添加的域名 `korascale.com`
4. 点击域名名称或右侧的 **...** 菜单

#### 步骤 2: 查看配置说明

Vercel 会显示一个配置面板，通常包含：

**如果显示 Nameservers（推荐）：**
```
Nameservers:
- ns1.vercel-dns.com
- ns2.vercel-dns.com
```

**如果显示 DNS Records（A 记录和 CNAME）：**
```
A Record:
Name: @
Value: 76.76.21.21

CNAME Record:
Name: www
Value: cname.vercel-dns.com
```

#### 步骤 3: 如果看不到配置信息

如果添加域名后没有立即显示配置信息：

1. **刷新页面** - 有时需要刷新才能看到
2. **点击域名名称** - 点击域名本身可能会展开配置详情
3. **查看状态** - 如果显示 "Invalid Configuration" 或 "Configuration"，点击查看详情
4. **查看帮助链接** - 通常页面底部有 "Learn more" 或 "View instructions" 链接

#### 步骤 4: 使用 Vercel CLI 查看（备选方案）

如果网页上找不到，可以使用 Vercel CLI：

```bash
# 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 登录
vercel login

# 查看域名配置
vercel domains inspect korascale.com
```

#### 📸 界面位置说明

在 Vercel Dashboard 中，DNS 配置信息通常显示在：

1. **域名列表页面：**
   - Settings → Domains
   - 每个域名下方会显示配置状态
   - 点击域名或 "..." 菜单查看详情

2. **域名详情页面：**
   - 点击域名后进入的页面
   - 会显示 "Configuration" 或 "DNS Records" 部分
   - 包含所有需要的 DNS 信息

3. **配置卡片：**
   - 通常是一个蓝色或灰色的卡片
   - 标题为 "Configure DNS" 或 "DNS Configuration"
   - 包含具体的记录值

#### ⚠️ 重要提示

- **不要使用示例 IP 地址**（如 76.76.21.21），必须使用 Vercel 在您的账户中显示的实际值
- **每个项目/域名的配置可能不同**，确保使用正确的值
- **如果 Vercel 提供了 Nameservers，优先使用**（比 A 记录更简单）

---

## 步骤 2: 在 Namecheap 配置 DNS

### 2.1 登录 Namecheap

1. 访问 https://www.namecheap.com
2. 登录您的账户
3. 点击右上角的 **Account** → **Domain List**

### 2.2 找到您的域名

1. 在域名列表中找到 `korascale.com`
2. 点击域名右侧的 **Manage** 按钮

### 2.3 配置 DNS（选择一种方式）

#### 方式 A：使用 Vercel Nameservers（推荐）

1. 在域名管理页面，找到 **Nameservers** 部分
2. 选择 **Custom DNS**（自定义 DNS）
3. 删除现有的 Nameservers
4. 添加 Vercel 提供的 Nameservers（通常是 2-4 个）
   - 例如：
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
5. 点击 **✓** 保存
6. 等待几分钟让更改生效

**优点：** 
- 最简单，只需配置一次
- Vercel 自动管理所有 DNS 记录
- 后续添加子域名更方便

#### 方式 B：使用 A 记录和 CNAME 记录

1. 在域名管理页面，找到 **Advanced DNS** 标签
2. 删除现有的 A 记录和 CNAME 记录（如果有）
3. 点击 **Add New Record** 添加新记录

**添加 A 记录：**
- **Type:** A Record
- **Host:** @
- **Value:** `76.76.21.21`（使用 Vercel 提供的 IP 地址）
- **TTL:** Automatic（或 30 min）
- 点击 **✓** 保存

**添加 CNAME 记录（用于 www 子域名）：**
- **Type:** CNAME Record
- **Host:** www
- **Value:** `cname.vercel-dns.com`（使用 Vercel 提供的值）
- **TTL:** Automatic（或 30 min）
- 点击 **✓** 保存

**注意：** 确保使用 Vercel Dashboard 中显示的确切值，不要使用示例值。

---

## 步骤 3: 等待 DNS 传播

### 3.1 DNS 传播时间

- **通常：** 5 分钟到 2 小时
- **最长：** 24-48 小时（很少见）
- **国内：** 可能需要更长时间（1-4 小时）

### 3.2 检查 DNS 状态

1. 在 Vercel Dashboard 的 **Domains** 页面
2. 查看域名状态：
   - ✅ **Valid Configuration** - 配置正确，等待传播
   - ⚠️ **Invalid Configuration** - 配置有误，需要检查
   - ✅ **Active** - 已生效，可以使用

### 3.3 验证域名是否生效

等待一段时间后（建议 1-2 小时），可以通过以下方式验证：

1. **在浏览器访问：**
   - `http://korascale.com`
   - `http://www.korascale.com`
   - 应该能看到您的网站

2. **使用在线工具检查：**
   - https://dnschecker.org
   - 输入域名，检查全球 DNS 传播情况

3. **在 Vercel Dashboard 检查：**
   - 如果显示 **Active**，说明已生效

---

## 步骤 4: 配置 HTTPS（自动）

### 4.1 Vercel 自动配置 SSL

- Vercel 会自动为您的域名配置免费的 SSL 证书
- 通常需要等待几分钟到几小时
- 配置完成后，`https://korascale.com` 会自动可用

### 4.2 验证 HTTPS

1. 等待 SSL 证书配置完成（Vercel Dashboard 会显示状态）
2. 访问 `https://korascale.com`
3. 浏览器地址栏应该显示锁图标 🔒

---

## 步骤 5: 验证配置完成

### 5.1 检查清单

完成以下检查，确保配置正确：

- [ ] 在 Vercel 添加了域名
- [ ] 在 Namecheap 配置了 DNS（Nameservers 或 A/CNAME 记录）
- [ ] 等待了至少 1 小时
- [ ] Vercel Dashboard 显示域名状态为 **Active**
- [ ] 可以通过 `http://korascale.com` 访问网站
- [ ] 可以通过 `https://korascale.com` 访问网站（SSL 已配置）

### 5.2 常见问题排查

#### 问题 1: 域名显示 "Invalid Configuration"

**可能原因：**
- DNS 记录配置错误
- 使用了错误的 IP 地址或域名

**解决方法：**
1. 检查 Vercel Dashboard 中的配置说明
2. 确认 Namecheap 中的 DNS 记录与 Vercel 要求完全一致
3. 删除错误的记录，重新添加

#### 问题 2: 域名一直显示 "Valid Configuration" 但未生效

**可能原因：**
- DNS 传播还未完成
- 本地 DNS 缓存

**解决方法：**
1. 等待更长时间（最多 24 小时）
2. 清除浏览器缓存
3. 使用其他网络环境测试（如手机 4G）
4. 使用在线 DNS 检查工具查看全球传播情况

#### 问题 3: 可以访问但显示 "Not Secure"

**可能原因：**
- SSL 证书还未配置完成

**解决方法：**
1. 等待 Vercel 自动配置 SSL（通常几分钟到几小时）
2. 在 Vercel Dashboard 检查 SSL 状态
3. 如果超过 24 小时仍未配置，联系 Vercel 支持

---

## 步骤 6: 配置重定向（可选）

### 6.1 配置 www 到根域名重定向

如果您希望 `www.korascale.com` 自动重定向到 `korascale.com`：

1. 在 Vercel Dashboard 的 **Domains** 页面
2. 找到 `www.korascale.com`
3. 点击 **...** 菜单
4. 选择 **Redirect** 或 **Add Redirect**
5. 设置重定向到 `korascale.com`

或者，在 `next.config.ts` 中配置：

```typescript
async redirects() {
  return [
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: 'www.korascale.com',
        },
      ],
      destination: 'https://korascale.com/:path*',
      permanent: true,
    },
  ];
}
```

---

## 下一步：配置邮箱

域名配置完成后，您可以：

1. **配置邮箱服务**（见 `DOMAIN_AND_EMAIL_SETUP_GUIDE.md` 第 4 节）
2. **更新代码中的邮箱地址**（见 `DOMAIN_AND_EMAIL_SETUP_GUIDE.md` 第 5 节）

---

## 需要帮助？

如果遇到问题：

1. **查看 Vercel 文档：**
   - https://vercel.com/docs/concepts/projects/domains

2. **查看 Namecheap 帮助：**
   - https://www.namecheap.com/support/knowledgebase/

3. **使用 DNS 检查工具：**
   - https://dnschecker.org
   - https://www.whatsmydns.net

---

**祝您配置顺利！** 🎉

