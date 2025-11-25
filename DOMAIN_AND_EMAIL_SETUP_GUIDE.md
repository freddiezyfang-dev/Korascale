# 域名和邮箱申请配置指南

本指南将帮助您为 Korascale 旅行网站申请域名并配置专业邮箱服务。

## 📋 目录

1. [域名注册](#1-域名注册)
2. [邮箱服务选择](#2-邮箱服务选择)
3. [域名配置](#3-域名配置)
4. [邮箱配置](#4-邮箱配置)
5. [代码更新](#5-代码更新)

---

## 1. 域名注册

### ⚠️ 重要：中国大陆用户使用国际域名注册商的注意事项

#### 1.0.1 使用 Namecheap 等国际注册商的风险

**潜在风险：**

1. **访问速度问题**
   - Namecheap 的网站和 DNS 服务器在海外
   - 在中国大陆访问可能较慢
   - 影响：管理域名时可能加载慢，但**不影响网站访问速度**（因为您使用 Vercel）

2. **支付问题**
   - 需要使用国际信用卡（Visa/Mastercard）
   - 或 PayPal
   - 部分国内银行卡可能无法支付

3. **客服时差**
   - 客服主要在欧美时区
   - 中文支持有限（虽然有中文客服，但响应可能较慢）

4. **DNS 解析速度**
   - Namecheap 的免费 DNS 服务器在海外
   - 国内用户访问可能稍慢
   - **解决方案：** 使用 Cloudflare 的免费 DNS（全球 CDN，速度快）

5. **政策风险（极低）**
   - 国际域名注册商不受国内监管
   - 理论上更自由，但需要遵守国际域名规则

**实际影响评估：**
- ✅ **网站访问速度：不受影响**（因为您使用 Vercel，Vercel 有全球 CDN）
- ⚠️ **域名管理：可能稍慢**（但影响不大，不经常操作）
- ⚠️ **DNS 解析：可能稍慢**（可通过更换 DNS 服务商解决）

#### 1.0.2 域名转移（更换注册商）完全可行

**好消息：域名可以随时转移！**

**转移流程：**

1. **解锁域名**
   - 在 Namecheap 账户中，找到域名管理
   - 关闭 "Domain Lock" 或 "Registrar Lock"

2. **获取转移码（Authorization Code/EPP Code）**
   - 在 Namecheap 域名管理页面
   - 点击 "Get Auth Code" 或 "Transfer Domain"
   - 系统会发送转移码到注册邮箱

3. **在新注册商提交转移**
   - 在新注册商（如阿里云、腾讯云）提交域名转入
   - 输入转移码
   - 确认转移

4. **确认转移**
   - 检查注册邮箱，确认转移请求
   - 等待 5-7 天完成转移

**转移注意事项：**
- ⏰ **时间限制：** 域名注册后 60 天内通常不能转移（ICANN 规则）
- 💰 **费用：** 转移通常需要续费 1 年（相当于续费）
- 🔒 **锁定状态：** 确保域名未锁定
- 📧 **邮箱：** 确保注册邮箱可接收邮件

**可以转移到的注册商：**
- 阿里云（国内，中文支持好）
- 腾讯云（国内，中文支持好）
- GoDaddy（国际，但支持中文）
- Cloudflare Registrar（国际，价格透明）

#### 1.0.3 推荐方案对比

| 方案 | 优点 | 缺点 | 适合场景 |
|------|------|------|----------|
| **Namecheap** | 价格便宜、界面友好、隐私保护免费 | 国内访问可能慢、中文支持有限 | 预算有限、主要面向海外用户 |
| **阿里云** | 国内访问快、中文支持好、备案方便 | 价格稍贵、隐私保护需付费 | 主要面向国内用户、需要备案 |
| **Cloudflare** | 价格透明、免费隐私保护、DNS 快 | 界面较技术化 | 技术用户、重视隐私 |

#### 1.0.4 针对您的项目的建议

**当前建议：**

1. **如果主要面向海外用户：**
   - ✅ 使用 Namecheap 没问题
   - 建议将 DNS 更换为 Cloudflare（免费、速度快）

2. **如果主要面向国内用户：**
   - 🤔 可以考虑使用阿里云或腾讯云
   - 但 Namecheap 也可以，只是管理稍慢

3. **混合方案（推荐）：**
   - 域名在 Namecheap 注册（价格便宜）
   - DNS 使用 Cloudflare（免费、全球 CDN、速度快）
   - 这样既省钱又保证速度

**结论：**
- ✅ 使用 Namecheap **风险很低**，主要是访问速度问题
- ✅ 域名**可以随时转移**到其他注册商
- 💡 **最佳实践：** Namecheap 注册 + Cloudflare DNS

### 1.1 选择域名注册商

**推荐服务商：**

- **Namecheap** (https://www.namecheap.com)
  - 价格合理，界面友好
  - 支持中文客服
  - 适合国际业务

- **GoDaddy** (https://www.godaddy.com)
  - 全球最大域名注册商
  - 提供多种附加服务
  - 中文支持良好

- **阿里云** (https://www.aliyun.com) - 如果主要面向中国市场
  - 国内访问速度快
  - 中文界面和客服
  - 备案支持

- **Cloudflare Registrar** (https://www.cloudflare.com/products/registrar)
  - 价格透明，无隐藏费用
  - 免费隐私保护
  - 适合技术用户

### 1.2 域名选择建议

**推荐域名格式：**
- `korascale.com` (首选)
- `korascale-travel.com`
- `korascalechina.com`
- `korascale.cn` (如果主要面向中国市场)

**注意事项：**
- 尽量选择 `.com` 后缀（最专业、最易记）
- 避免使用连字符（除非必要）
- 保持简短易记
- 检查商标冲突

### 1.3 注册步骤

1. **访问注册商网站**
   - 创建账户
   - 搜索想要的域名
   - 查看可用性和价格

2. **完成购买**
   - 选择注册年限（建议至少1-2年）
   - 启用隐私保护（Whois Privacy）
   - 完成支付

3. **验证邮箱**
   - 检查注册邮箱
   - 点击验证链接
   - 完成账户验证

### 1.4 Namecheap 购买页面选择指南 ⭐

如果您在 Namecheap 购买页面，请按以下建议选择：

#### ✅ **必须购买：**

1. **域名本身** - `korascale.com`
   - 价格：约 ¥80-100/年
   - 选择注册年限：建议 1-2 年（通常有折扣）
   - ✅ **必须勾选**

2. **隐私保护（Whois Privacy）**
   - 通常免费或很便宜（¥10-20/年）
   - 保护您的个人信息不被公开
   - ✅ **强烈建议勾选**

#### ❌ **不需要购买（因为使用 Vercel）：**

1. **Web Hosting** - ¥34.72/月
   - ❌ 不需要：Vercel 已提供免费托管
   - 您的 Next.js 应用已部署在 Vercel

2. **WordPress Hosting**
   - ❌ 不需要：您使用的是 Next.js，不是 WordPress

3. **SSL 证书** - ¥42.61/年
   - ❌ 不需要：Vercel 自动提供免费 SSL 证书
   - 所有 Vercel 部署的网站都有免费 HTTPS

4. **Premium DNS** - ¥34.72
   - ❌ 通常不需要：Namecheap 的免费 DNS 已足够
   - 除非您需要高级 DNS 功能（如 DDoS 防护）

#### 🤔 **可选（根据需求）：**

1. **Business Email** - 免费试用
   - 🤔 可以考虑：如果试用满意可以继续使用
   - 更经济的替代方案：
     - Zoho Mail 免费版（5GB 存储）
     - Google Workspace（$6/月/用户，更专业）
   - 建议：先不购买，购买域名后再单独配置邮箱服务

2. **其他服务**（VPN、SEO 等）
   - ❌ 不需要：与您的网站项目无关

#### 📝 **推荐购买清单：**

```
✅ korascale.com (1-2 年)
✅ Whois Privacy (隐私保护)
❌ 其他所有服务 - 暂时不购买
```

**总费用：** 约 ¥90-120/年（仅域名 + 隐私保护）

#### 💡 **购买后下一步：**

1. 在 Vercel 配置域名（见第 3 节）
2. 配置邮箱服务（见第 4 节）
3. 更新代码中的邮箱地址（见第 5 节）

---

## 2. 邮箱服务选择

### 2.1 方案对比

#### 方案 A: Google Workspace (原 G Suite) ⭐ 推荐

**优点：**
- 专业、可靠
- 30GB 存储空间
- 包含 Google Drive、Calendar 等
- 优秀的垃圾邮件过滤
- 移动端支持好

**价格：** $6/月/用户起

**适用场景：** 需要专业邮箱且预算充足

#### 方案 B: Microsoft 365

**优点：**
- 与 Office 套件集成
- 50GB 存储空间
- 企业级安全
- 中文支持好

**价格：** ¥45/月/用户起（中国区）

**适用场景：** 需要 Office 办公套件

#### 方案 C: Zoho Mail

**优点：**
- 价格便宜（免费版可用）
- 5GB 免费存储
- 界面简洁
- 支持自定义域名

**价格：** 免费版可用，付费版 $1/月/用户

**适用场景：** 预算有限，需要基础邮箱功能

#### 方案 D: Resend (仅用于发送邮件) ⭐ 适合您的项目

**优点：**
- 专为开发者设计
- 与 Vercel 集成好
- API 简单易用
- 发送邮件可靠

**价格：** 免费额度 3000 封/月，之后 $20/月起

**适用场景：** 主要用于系统自动发送邮件（如订单确认、通知等）

**注意：** Resend 主要用于发送邮件，不能接收邮件。如果需要接收邮件，需要配合其他服务。

### 2.2 推荐配置方案

**方案 1：完整方案（推荐）**
- **接收邮件：** Google Workspace 或 Zoho Mail
  - `info@yourdomain.com` - 通用咨询
  - `customer-service@yourdomain.com` - 客服
  - `support@yourdomain.com` - 技术支持
  - `noreply@yourdomain.com` - 系统发送（不接收回复）

- **发送邮件：** Resend
  - 用于系统自动发送邮件
  - 配置简单，与 Vercel 集成好

**方案 2：经济方案**
- **接收和发送：** Zoho Mail（免费版或付费版）
- 所有邮箱地址统一管理

### 2.3 ⚠️ 重要：Google Workspace 和 Zoho Mail 是平行选择

**关键理解：**

#### Google Workspace 和 Zoho Mail 是**二选一**的关系

**不能同时使用！** 原因：

1. **MX 记录冲突**
   - 每个域名只能配置一套 MX 记录
   - Google Workspace 和 Zoho Mail 需要不同的 MX 记录
   - 如果同时配置，邮件会发送到错误的地方

2. **DNS 配置限制**
   - 域名只能指向一个邮件服务器
   - 不能同时指向 Google 和 Zoho

#### 选择建议：

| 服务 | 价格 | 适合场景 | 推荐度 |
|------|------|----------|--------|
| **Google Workspace** | $6/月/用户 | 需要专业邮箱、预算充足 | ⭐⭐⭐⭐ |
| **Zoho Mail** | 免费或 $1/月/用户 | 预算有限、基础需求 | ⭐⭐⭐⭐⭐ |
| **Microsoft 365** | ¥45/月/用户 | 需要 Office 套件 | ⭐⭐⭐ |

#### 如何选择：

**选择 Google Workspace 如果：**
- ✅ 预算充足（$6/月/用户）
- ✅ 需要专业的企业邮箱
- ✅ 需要 Google Drive、Calendar 等附加服务
- ✅ 团队协作需求多

**选择 Zoho Mail 如果：**
- ✅ 预算有限（免费版可用）
- ✅ 只需要基础邮箱功能
- ✅ 个人或小团队使用
- ✅ 想要快速开始

#### 切换服务商：

**可以切换，但需要：**
1. 删除旧的 MX 记录
2. 配置新的 MX 记录
3. 等待 DNS 传播（几小时）
4. 重新创建邮箱地址

**注意：** 切换时，旧邮箱中的邮件不会自动迁移，需要手动导出。

---

## 3. 域名配置

### 3.1 在 Vercel 配置自定义域名

1. **登录 Vercel Dashboard**
   - 访问 https://vercel.com/dashboard
   - 选择您的项目

2. **添加域名**
   - 进入项目 Settings → Domains
   - 点击 "Add Domain"
   - 输入您的域名（如 `korascale.com`）

3. **配置 DNS 记录**
   Vercel 会提供 DNS 配置说明，通常需要添加：
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel 提供的 IP)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **在域名注册商配置 DNS**
   - 登录域名注册商管理面板
   - 找到 DNS 设置
   - 添加 Vercel 提供的 DNS 记录
   - 等待 DNS 传播（通常 1-24 小时）

### 3.2 DNS 记录类型说明

- **A 记录：** 将域名指向 IP 地址
- **CNAME 记录：** 将子域名指向另一个域名
- **MX 记录：** 用于邮箱服务（见下方）
- **TXT 记录：** 用于验证和 SPF/DKIM 配置

---

## 4. 邮箱配置

### 4.1 使用 Google Workspace 配置邮箱

#### 步骤 1: 注册 Google Workspace

1. 访问 https://workspace.google.com
2. 选择 "Get Started"
3. 选择 "For Business"
4. 输入您的域名
5. 创建管理员账户
6. 完成支付设置

#### 步骤 2: 验证域名所有权

1. Google 会提供 TXT 记录
2. 在域名注册商的 DNS 设置中添加：
   ```
   Type: TXT
   Name: @
   Value: google-site-verification=xxxxxxxxxxxxx
   ```

#### 步骤 3: 配置 MX 记录

在域名注册商的 DNS 设置中添加：

```
Type: MX
Priority: 1
Value: aspmx.l.google.com

Type: MX
Priority: 5
Value: alt1.aspmx.l.google.com

Type: MX
Priority: 5
Value: alt2.aspmx.l.google.com

Type: MX
Priority: 10
Value: alt3.aspmx.l.google.com

Type: MX
Priority: 10
Value: alt4.aspmx.l.google.com
```

#### 步骤 4: 创建邮箱地址

1. 登录 Google Workspace 管理控制台
2. 进入 "Users" → "Add new user"
3. 创建以下邮箱：
   - `info@yourdomain.com`
   - `customer-service@yourdomain.com`
   - `support@yourdomain.com`
   - `noreply@yourdomain.com` (可选，用于系统发送)

### 4.2 使用 Zoho Mail 配置邮箱

#### ⚠️ 重要：Zoho Mail 的配置流程

**Zoho Mail 的配置分为两个阶段：**

1. **第一阶段：购买/注册**（您现在看到的页面）
   - 选择方案（Mail Lite、Mail Premium 等）
   - 输入用户数量
   - 完成支付
   - ❌ **此时不需要配置域名和 MX 记录**

2. **第二阶段：域名配置**（购买完成后）
   - 登录 Zoho Mail 管理控制台
   - 添加您的域名
   - 验证域名所有权
   - 配置 MX 记录
   - ✅ **这些步骤在购买后才会出现**

#### 步骤 1: 注册/购买 Zoho Mail

1. 访问 https://www.zoho.com/mail/
2. 选择 "Sign Up Now" 或 "Buy Now"
3. 选择 "Business Email"
4. 选择方案（Mail Lite、Mail Premium 等）
5. 输入用户数量
6. 完成支付/注册
7. **注意：此时还没有配置域名**

#### 步骤 2: 登录管理控制台并添加域名

**购买完成后，您需要：**

1. 登录 Zoho Mail 管理控制台
   - 访问 https://mailadmin.zoho.com
   - 使用注册时创建的账户登录

2. 添加域名
   - 在控制台中找到 "Domains" 或 "Domain Setup"
   - 点击 "Add Domain"
   - 输入您的域名：`korascale.com`
   - 点击 "Add"

3. **此时才会显示域名验证和 MX 记录配置步骤**

#### 步骤 3: 验证域名所有权

1. Zoho 会提供 TXT 记录用于验证
2. 在 Namecheap 的 DNS 设置中添加：
   ```
   Type: TXT
   Name: @
   Value: [Zoho 提供的验证值]
   ```
3. 等待几分钟让 DNS 传播
4. 在 Zoho 控制台点击 "Verify" 验证域名

#### 步骤 4: 配置 MX 记录

**域名验证通过后，Zoho 会要求配置 MX 记录：**

在 Namecheap 的 DNS 设置中添加：

```
Type: MX
Priority: 10
Value: mx.zoho.com

Type: MX
Priority: 20
Value: mx2.zoho.com
```

#### 步骤 5: 配置 SPF 记录（防止垃圾邮件）

```
Type: TXT
Name: @
Value: v=spf1 include:zoho.com ~all
```

#### 步骤 6: 创建邮箱地址

MX 记录配置完成后（等待几小时让 DNS 传播），您可以：

1. 在 Zoho Mail 控制台创建邮箱地址
2. 例如：
   - `info@korascale.com`
   - `customer-service@korascale.com`
   - `support@korascale.com`

### 4.3 配置 Resend（用于发送邮件）

#### 步骤 1: 注册 Resend

1. 访问 https://resend.com
2. 注册账户
3. 验证邮箱

#### 步骤 2: 添加域名

1. 登录 Resend Dashboard
2. 进入 "Domains"
3. 点击 "Add Domain"
4. 输入您的域名

#### 步骤 3: 配置 DNS 记录

Resend 会提供以下 DNS 记录，在域名注册商添加：

**SPF 记录：**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

**DKIM 记录：**（Resend 会提供具体值）
```
Type: TXT
Name: resend._domainkey
Value: [Resend 提供的值]
```

#### 步骤 4: 获取 API Key

1. 在 Resend Dashboard 进入 "API Keys"
2. 点击 "Create API Key"
3. 复制 API Key（只显示一次，请保存好）

---

## 5. 代码更新

### 5.1 更新环境变量

在 Vercel Dashboard 或 `.env.local` 文件中更新：

```bash
# 客服邮箱（接收旅行定制请求）
CUSTOMER_SERVICE_EMAIL=customer-service@yourdomain.com

# Resend 配置（用于发送邮件）
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 5.2 更新代码中的邮箱地址

需要更新以下文件中的邮箱地址：

1. **`src/app/support/page.tsx`**
   ```tsx
   Email: <a href="mailto:support@yourdomain.com">support@yourdomain.com</a>
   ```

2. **`src/app/contact/page.tsx`**（如果有硬编码的邮箱）

3. **`src/components/layout/Footer.tsx`**（如果有邮箱链接）

### 5.3 安装 Resend 包（如果还没有）

```bash
npm install resend
```

### 5.4 测试邮件发送

1. 在网站上提交一个旅行定制请求
2. 检查客服邮箱是否收到邮件
3. 检查 Resend Dashboard 的发送日志

---

## 6. 邮箱地址规划建议

根据您的业务需求，建议创建以下邮箱：

| 邮箱地址 | 用途 | 接收者 |
|---------|------|--------|
| `info@yourdomain.com` | 通用咨询 | 市场/客服团队 |
| `customer-service@yourdomain.com` | 客户服务 | 客服团队 |
| `support@yourdomain.com` | 技术支持 | 技术支持团队 |
| `booking@yourdomain.com` | 预订相关 | 预订团队 |
| `noreply@yourdomain.com` | 系统发送 | 不接收回复 |

---

## 7. 常见问题

### Q: DNS 记录需要多久生效？
A: 通常 1-24 小时，有时可能需要 48 小时。

### Q: 可以同时使用多个邮箱服务吗？
A: 可以。例如：用 Google Workspace 接收邮件，用 Resend 发送邮件。

### Q: 免费邮箱服务够用吗？
A: 对于小型业务，Zoho Mail 免费版通常够用。如果业务量大，建议使用付费服务。

### Q: 需要备案吗？
A: 如果域名使用 `.cn` 后缀且服务器在中国，需要备案。`.com` 等国际域名通常不需要。

---

## 8. 检查清单

完成以下步骤后，您的域名和邮箱就配置好了：

- [ ] 注册域名
- [ ] 在 Vercel 添加自定义域名
- [ ] 配置 DNS 记录（A、CNAME）
- [ ] 选择并配置邮箱服务
- [ ] 配置 MX 记录
- [ ] 配置 SPF/DKIM 记录
- [ ] 创建必要的邮箱地址
- [ ] 在 Vercel 配置环境变量
- [ ] 更新代码中的邮箱地址
- [ ] 测试邮件发送和接收

---

## 9. 推荐工作流程

1. **第 1 天：** 注册域名，在 Vercel 配置域名
2. **第 2 天：** 等待 DNS 传播，注册邮箱服务
3. **第 3 天：** 配置邮箱 DNS 记录，创建邮箱地址
4. **第 4 天：** 配置 Resend，更新代码
5. **第 5 天：** 测试所有功能

---

## 10. 技术支持

如果遇到问题，可以：
- 查看域名注册商的帮助文档
- 查看邮箱服务商的帮助文档
- 查看 Vercel 的域名配置文档
- 查看 Resend 的文档

---

**祝您配置顺利！** 🎉

