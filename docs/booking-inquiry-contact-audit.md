# KoraScale Booking / Inquiry / Contact 入口审计

**审计日期：** 2025-06-19  
**审计类型：** 只读扫描（未修改代码、未调整视觉、未重构组件）  
**代码库分支：** `main`（审计时工作区干净，`git diff --stat` 为空）

---

## 1. 执行摘要

当前站点存在 **至少 4 套并行的「联系 / 预订」路径**，在文案、后台与数据留存上不一致：

| 路径 | 前台表现 | 后台 | 数据 |
|------|----------|------|------|
| **PlanTripModal** | 「PLAN YOUR JOURNEY」/「MAKE AN ENQUIRY」 | `POST /api/plan-trip` | 仅邮件（Resend/SMTP）；无 DB |
| **Journey Request to Book** | 「REQUEST TO BOOK」 | `POST /api/bookings` | 写入 `bookings` 表；无邮件 |
| **Contact 页 + mailto** | Email / WhatsApp / 静态表单 | 无 | 无 |
| **Article CTA** | 「Start Planning」等 | 默认跳转 `/contact` | 无 |

### 1.1 主要问题清单

1. **无独立 `/plan-your-journey` 页面** — 定制入口全部是弹窗 `PlanTripModal`。
2. **Contact 页「Send Message」表单无 submit handler** — 属于死表单。
3. **`/api/bookings` 入库但不发邮件**；**`/api/plan-trip` 发邮件但不入库** — 成功 UI 与后台留存不对称。
4. **邮箱 / 电话 / WhatsApp 多处硬编码且不一致**（`customer-service@` vs `support@` vs 占位电话）。
5. **Request to Book 需登录**，语义像即时预订，实际是 `status=REQUESTED` 的咨询请求（与 migration 注释一致）。
6. **Article 默认 CTA 指向 `/contact` 死表单**，而非 PlanTripModal 或带上下文的 inquiry。
7. **`ClientJourneyPage` 挂载了 `PlanTripModal` 但从未打开** — 死代码。
8. **Wishlist / Accommodation / Checkout 等遗留预订流** 仅本地 mock，无真实 inquiry API。
9. **Header Email 仅 desktop 显示**；首页正文无 WhatsApp；全站唯一商务 WhatsApp 仅在 `/contact`。
10. **`tailor_made_requests` 表已 migration，但 `/api/tailor-made` 与前端页面未实现**。

### 1.2 推荐方向

**方案 B（推荐）：** 前台保留差异化文案与入口，后台统一到单一 Inquiry API、数据模型与配置（详见第 7 节）。

---

## 2. 前台入口清单

### 2.1 全局布局（所有公开页）

| Source file | Component | Page/route | Button text | Element type | Destination | Intent | Context passed | Desktop/mobile | Shared component | Status | Notes |
|-------------|-----------|------------|-------------|--------------|-------------|--------|----------------|----------------|------------------|--------|-------|
| `src/components/layout/Header.tsx` | `SocialAndSearch` | 全站 | Email 图标 | anchor | `mailto:customer-service@korascale.com` | direct contact | 无 | **仅 desktop**（`hidden lg:flex`） | Header | valid | 移动端 Header 无 Email |
| `src/components/layout/Footer.tsx` | Footer | 全站 | Email 图标 | anchor | `mailto:customer-service@korascale.com` | direct contact | 无 | both | Footer | valid | — |
| `src/components/layout/Footer.tsx` | Footer | 全站 | Contact | Link | `/contact` | direct contact | 无 | both | Footer | valid | — |
| `src/components/layout/Footer.tsx` | Footer | 全站 | SUBSCRIBE | button | **无 handler** | — | 无 | both | Footer | **dead** | Newsletter 不提交 |
| `src/components/layout/NavMenu.tsx` | NavMenu | 全站 | — | — | 无直接联系入口 | — | — | desktop nav | — | — | 仅 Destinations/Journeys/Inspirations/Solutions |
| `src/components/layout/NavSidebar.tsx` | NavSidebar | 全站 mobile | — | — | 无直接联系入口 | — | — | mobile | NavSidebar | — | 同 Nav 结构 |

### 2.2 Homepage (`/`)

| Source file | Component | Page/route | Button text | Element type | Destination | Intent | Context | Desktop/mobile | Shared | Status | Notes |
|-------------|-----------|------------|-------------|--------------|-------------|--------|---------|----------------|--------|--------|-------|
| `src/app/HomePageClient.tsx` | — | `/` | — | — | — | — | — | — | — | — | **首页无 Email/WhatsApp/Plan/Book CTA** |
| `src/app/page.tsx` | EditorialMosaic | `/` | 文章卡片 | Link | `/inspirations/{cat}/{slug}` | article navigation | article slug | both | EditorialMosaic | valid | 非 inquiry 入口 |
| `src/components/sections/CategoryExplorer` | CategoryExplorer | `/` | 区域/旅程卡片 | Link | `/destinations/*`, `/journeys`, `/inspirations/*` | navigation | 无 | both | shared | valid | 间接通向 inquiry 页 |

> **说明：** Homepage Email/WhatsApp 仅通过全站 Header（desktop mailto）和 Footer（mailto + Contact 链接）间接存在；首页正文无 WhatsApp。

### 2.3 Journey Listing (`/journeys`)

| Source file | Component | Page/route | Button text | Element type | Destination | Intent | Context | D/M | Shared | Status | Notes |
|-------------|-----------|------------|-------------|--------------|-------------|--------|---------|-----|--------|--------|-------|
| `src/app/journeys/JourneysPageClient.tsx` | Hero CTA | `/journeys` | EXPLORE NOW | button | 打开 `PlanTripModal` | custom journey | **无** source/journey | both | PlanTripModal | valid | — |
| 同上 | Bottom section | `/journeys` | PLAN YOUR JOURNEY | button | 打开 `PlanTripModal` | custom journey | 无 | both | PlanTripModal | **duplicate** | 同页两处相同 modal |
| 同上 | Journey cards | `/journeys` | 卡片点击 | Link | `/journeys/{slug}` | navigation | slug | both | — | valid | — |

### 2.4 Journey Type Pages (`/journeys/type/[type]`)

| Source file | Component | Page/route | Button text | Element type | Destination | Intent | Context | D/M | Shared | Status | Notes |
|-------------|-----------|------------|-------------|--------------|-------------|--------|---------|-----|--------|--------|-------|
| `src/app/journeys/type/[type]/JourneyTypePageClient.tsx` | Plan section | 各 type 页 | PLAN YOUR JOURNEY | button | `PlanTripModal` | custom journey | 无 type slug | both | PlanTripModal | valid | Group Tours 文案提「Contact Group Travel Specialists」但无按钮 |
| `src/app/journeys/type/group-tours/GroupToursLandingClient.tsx` | CTA | `/journeys/type/group-tours` | Speak to our team | anchor | `mailto:customer-service@korascale.com?subject=Group%20tours%20inquiry` | corporate inquiry | subject 预填 | both | — | valid | 与 PlanTripModal 并行 |

### 2.5 Journey Detail (`/journeys/[...slug]`)

| Source file | Component | Page/route | Button text | Element type | Destination | Intent | Context | D/M | Shared | Status | Notes |
|-------------|-----------|------------|-------------|--------------|-------------|--------|---------|-----|--------|--------|-------|
| `ClientJourneyPage.tsx` | `handleBookNow` | Journey detail | REQUEST TO BOOK | button | 未登录→LoginModal；已登录→`/booking/review/{slug}?date&price` | journey booking | **journey slug, date, price** | both | BookingCalendarGrid / InclusionsAndOffers | valid | 需登录 |
| `BookingCalendarGrid.tsx` | CTA | Explore Together 布局 | REQUEST TO BOOK | button | `onBookingClick` | journey booking | date, price | both | shared | valid | — |
| `InclusionsAndOffers.tsx` | CTA | 标准 Journey 页 | REQUEST TO BOOK | button | `onBookingClick` | journey booking | date, price | both | shared | valid | — |
| `ExperienceDetailModal.tsx` | ENQUIRE | Journey detail modal | ENQUIRE | anchor | `/contact` | direct contact | **无 journey/experience 上下文** | both | — | **inconsistent** | 应带 query 或统一 inquiry |
| `ClientJourneyPage.tsx` | PlanTripModal | Journey detail | — | — | modal 已挂载但 **从未 `setOpen(true)`** | — | — | — | PlanTripModal | **dead** | 死代码 |

**Booking 链路：**

```
REQUEST TO BOOK
→ LoginModal（如需）
→ /booking/review/[journeyId]?date=&price=
→ fetch POST /api/bookings
→ bookings 表 (status=REQUESTED)
→ 成功 modal（无邮件）
```

### 2.6 Inspiration

| Source file | Component | Page/route | Button text | Element type | Destination | Intent | Context | D/M | Shared | Status | Notes |
|-------------|-----------|------------|-------------|--------------|-------------|--------|---------|-----|--------|--------|-------|
| `src/app/inspirations/InspirationsPageView.tsx` | PlanningSectionNew | `/inspirations` | MAKE AN ENQUIRY | button | PlanTripModal | custom journey | 无 article | both | shared | valid | — |
| 同上 | PlanningSectionNew | `/inspirations` | customer-service@… | anchor | mailto | direct contact | 无 | both | shared | valid | — |
| `src/lib/articleCta.ts` + `ArticlePrimaryCta.tsx` | ArticlePrimaryCta | `/inspirations/{cat}/{slug}` | 默认 **Start Planning** | Link | **`/contact`** | custom journey | **无 article slug**（默认模板） | both | shared | **inconsistent** | 落到死表单 |
| 同上 | ArticlePrimaryCta | article | 默认 **Explore Journeys** | Link | `/journeys` | navigation | 无 | both | shared | valid | secondary |
| 同上 | ArticlePrimaryCta | article | **Discuss Your Visit**（corporate 模板） | Link | `/contact` | corporate inquiry | 无 | both | shared | **inconsistent** | admin 可 custom 覆盖 |
| `ClientArticlePage.tsx` | ArticleShareButtons | article | WhatsApp 分享 | button | `wa.me/?text={当前URL}` | social share | URL only | both | — | valid | **非商务 WhatsApp 号** |
| `src/app/inspirations/[category]/page.tsx` | — | category | — | — | 无专用 CTA | — | — | — | — | — | — |

### 2.7 Plan Your Journey（无独立 route）

| Source file | Component | Pages | Button text | Element type | Destination | Intent | Context | D/M | Shared | Status |
|-------------|-----------|-------|-------------|--------------|-------------|--------|---------|-----|--------|--------|
| `PlanTripModal.tsx` | modal | 见下 | Plan Your Trip（标题） | form submit | `POST /api/plan-trip` | custom journey | departureDate, duration, destinations, contact | both | **shared** | valid |
| `PlanningSectionNew.tsx` | section | `/destinations`, `/destinations/[region]`, `/destinations/sichuan`, `/inspirations`, `/places/[place]` | MAKE AN ENQUIRY | button | PlanTripModal | custom journey | 无 | both | shared | valid |
| `JourneysPageClient.tsx` | hero + footer | `/journeys` | EXPLORE NOW / PLAN YOUR JOURNEY | button | PlanTripModal | custom journey | 无 | both | shared | duplicate |

### 2.8 Contact (`/contact`)

| Source file | Component | Page | Button text | Element type | Destination | Intent | Context | D/M | Shared | Status | Notes |
|-------------|-----------|------|-------------|--------------|-------------|--------|---------|-----|--------|--------|-------|
| `src/app/contact/page.tsx` | Email | `/contact` | customer-service@… | anchor | mailto | direct contact | 无 | both | — | valid | — |
| 同上 | WhatsApp | `/contact` | +86 155 5648 6995 | anchor | `https://wa.me/8615556486995` | direct contact | 无预填消息 | both | — | valid | **全站唯一商务 WhatsApp 号** |
| 同上 | Contact form | `/contact` | Send Message | button | **无 onSubmit** | — | 无 | both | — | **dead** | 前端假表单 |

### 2.9 Solutions / Corporate / Healthcare

| Source file | Page | Button text | Element type | Destination | Intent | Context | Status | Notes |
|-------------|------|-------------|--------------|-------------|--------|---------|--------|-------|
| `solutions/page.tsx` | `/solutions` | Learn More ×2 | Link | 子 solution 页 | navigation | — | valid | 无直接 inquiry |
| `solutions/corporate-travel/page.tsx` | `/solutions/corporate-travel` | Tell Us About Your Upcoming Visit | Link | `/contact` | corporate inquiry | 无 | **inconsistent** | → 死表单 |
| 同上 | | Submit a Visit Request | Link | `/contact` | corporate inquiry | 无 | **inconsistent** | — |
| `solutions/corporate-travel-experiences/page.tsx` | `/solutions/corporate-travel-experiences` | — | — | 仅文案「Contact us」 | — | — | **unclear** | 无 CTA 按钮 |
| `HealthcareAccessChinaClient.tsx` | `/solutions/healthcare-access-china` | Speak to our medical advisor | anchor | mailto + subject | corporate inquiry | subject | valid | 不走 API |
| `GroupToursLandingClient.tsx` | group-tours | Speak to our team | anchor | mailto + subject | corporate inquiry | subject | valid | — |

### 2.10 其他公开页

| Page | 联系相关入口 | Status |
|------|-------------|--------|
| `/about` | 无 | — |
| `/support` | `support@korascale.com`, `tel:+8613800000000`（占位） | **inconsistent** |
| `/faq` | 文案提及「Book Now」 | 无实际按钮 |
| `/language` | 文案「Contact us」 | 无链接 |
| `/privacy-policy`, `/terms-and-conditions` | `privacy@`, `legal@` mailto | valid（法务） |
| `/links` | 旅程/文章链接 | 无 inquiry |
| `/places/[place]` | PlanningSectionNew | valid |
| `/accommodations`, `/booking/*`, `/checkout` | 遗留 mock 预订流 | **dead / legacy** |
| `/wishlist-demo` | demo | 非生产入口 |

**Sitemap 静态路径**（`src/lib/journeySitemap.server.ts`）不含 `/contact`、`/about`、`/support` 等 — 这些页存在但未列入 sitemap allowlist。

### 2.11 Floating / Sticky / Popup

| 类型 | 文件 | 说明 | Status |
|------|------|------|--------|
| Modal | `PlanTripModal` | 定制 inquiry 主弹窗 | valid |
| Modal | `LoginModal` | Journey booking 门禁 | valid |
| Modal | `BookingModal` | 住宿 mock 预订 | **dead**（仅 console.log） |
| Sidebar | `WishlistSidebar` |「Add to Booking」→ `/booking/cart` | legacy |
| Dropdown | `UserDropdown` |「REQUEST TO BOOK」→ `/checkout` | **dead** |
| Sticky nav | Journey detail `#booking-section` | 锚点导航，非浮动 CTA 按钮 | — |

**未发现** 全站 floating WhatsApp 按钮或 sticky contact bar。

---

## 3. 表单与 API 清单

### 3.1 PlanTripModal（主定制表单）

| 字段 | 内容 |
|------|------|
| Form component | `src/components/modals/PlanTripModal.tsx` |
| Route | 弹窗；触发页见第 2 节 |
| Fields | departureDate, tripDuration, destinations, fullName, email, phoneNumber, additionalNotes |
| Submit handler | `handleSubmit` → `fetch('/api/plan-trip')` |
| API endpoint | `POST /api/plan-trip` |
| Database | **否**（`tailor_made_requests` 表已 migration 但 **无 API/前端**） |
| Email notification | **是**（Resend → SMTP → dev console 假成功） |
| Provider | Resend / Nodemailer（`src/lib/optionalEmail.ts`） |
| Success handling | modal 内 success step |
| Error handling | `setErrors({ submit: '...' })` |
| Source tracking | **否** |
| Journey context | **否** |
| Article context | **否** |
| Duplicate | 与 Contact 表单、bookings 职责重叠 |

### 3.2 Journey Booking Review

| 字段 | 内容 |
|------|------|
| Form component | `src/app/booking/review/[journeyId]/page.tsx` |
| Route | `/booking/review/{slug}?date=&price=` |
| Fields | adults, children, specialRequests, firstTimeChina, traveledDevelopingRegions, whatMattersMost, departureCity（+ 用户账户信息） |
| Submit handler | `handleSubmit` → `fetch('/api/bookings')` |
| API endpoint | `POST /api/bookings` |
| Database | **是** → `bookings` 表，`status='REQUESTED'` |
| Email notification | **否** |
| Success handling | `setShowSuccessModal(true)` |
| Error handling | `alert(...)` |
| Source tracking | **否** |
| Journey context | **是**（journeyId, slug, title, date, price） |
| Article context | 否 |

### 3.3 Contact 页「Send us a Message」

| 字段 | 内容 |
|------|------|
| Form component | `src/app/contact/page.tsx` 内联 `<form>` |
| Fields | firstName, lastName, email, subject, message |
| Submit handler | **无** |
| API | **无** |
| Status | **dead** |

### 3.4 Footer Newsletter

| 字段 | 内容 |
|------|------|
| Form component | `src/components/layout/Footer.tsx` |
| Fields | firstName, lastName, email |
| Submit handler | **无** |
| Status | **dead** |

### 3.5 BookingModal（住宿）

| 字段 | 内容 |
|------|------|
| Form component | `src/components/modals/BookingModal.tsx` |
| Submit | `handleConfirmBooking` → **setTimeout + console.log** |
| API | **无** |
| Status | **dead**（前端假成功） |

### 3.6 Legacy 预订流

| 组件 | 行为 | API | Status |
|------|------|-----|--------|
| `booking/[slug]/page.tsx` | `addOrder()` → OrderManagementContext | 无 | legacy mock |
| `booking/accommodation/page.tsx` | 加入 cart | 无 | legacy |
| `checkout/page.tsx` | `updateOrderStatus('paid')` | 无 | legacy mock |

### 3.7 API 汇总

| Endpoint | Method | Validation | DB | Email | 备注 |
|----------|--------|------------|-----|-------|------|
| `/api/plan-trip` | POST | 必填字段校验 | 否 | Resend/SMTP/dev mock | 无 source/journey |
| `/api/bookings` | POST | 必填字段校验 | `bookings` INSERT | 否 | admin 可读 GET |
| `/api/bookings/[id]` | PATCH | status | UPDATE | 否 | admin 标记已处理 |
| `/api/tailor-made` | — | **不存在** | migration 已有表 | — | 文档计划未实现 |

### 3.8 后台链路对比

```
PlanTripModal:  UI success ✅ → API 200 ✅ → 邮件 ⚠️(可能 dev mock) → DB ❌
Booking Review: UI success ✅ → API 200 ✅ → DB ✅ → 邮件 ❌
Contact form:   UI 可点 ⚠️ → 无 handler ❌
BookingModal:   UI success ✅ → console only ❌
```

---

## 4. 联系方式配置

### 4.1 邮箱地址

| 地址 | 出现位置 | 用途 |
|------|----------|------|
| `customer-service@korascale.com` | Header, Footer, Contact, PlanningSectionNew, plan-trip API fallback, Group/Healthcare mailto | **主客服** |
| `support@korascale.com` | `/support` | **不一致** |
| `legal@korascale.com` | terms | 法务 |
| `privacy@korascale.com` | privacy | 隐私 |
| `noreply@korascale.com` | plan-trip Resend from fallback | 发件 |
| `admin@korascale.com` | admin 门禁 | 内部 |
| `CUSTOMER_SERVICE_EMAIL` env | `env.example.txt`, plan-trip API | 应与硬编码一致 |

### 4.2 WhatsApp / 电话

| 配置 | 位置 | 格式 | 问题 |
|------|------|------|------|
| `https://wa.me/8615556486995` | `/contact` | 商务号 | 全站唯一；Header/Footer **无** WhatsApp |
| `https://wa.me/?text={url}` | Article 分享 | 无号码 | 分享用，非咨询 |
| `tel:+8613800000000` | `/support` | 占位号 | **疑似假号码** |

### 4.3 Route 配置

| Route | 存在 | 说明 |
|-------|------|------|
| `/contact` | ✅ | 静态联系页 + 死表单 |
| `/plan-your-journey` | ❌ | 仅 PlanTripModal 弹窗 |
| `/tailor-made-china` | ❌ | 文档计划，未实现 |

### 4.4 环境变量 vs 代码

- `env.example.txt` 定义 `CUSTOMER_SERVICE_EMAIL`、`RESEND_*`、`SMTP_*` — 仅 **plan-trip** 使用。
- **bookings API 不读任何邮件 env**。
- 大量 mailto **硬编码**，未集中配置。

---

## 5. 重复与失效流程

| 问题 | 严重度 | 详情 |
|------|--------|------|
| Contact 表单假提交 | **高** | Corporate/Article 默认 CTA 均指向 `/contact` |
| plan-trip 无 DB + bookings 无邮件 | **高** | 运营可能漏单或漏通知 |
| 双客服邮箱 support vs customer-service | 中 | Support 页与全站不一致 |
| Support 占位电话 | 中 | `+86 138 0000 0000` |
| Journey PlanTripModal 死挂载 | 低 | ClientJourneyPage 未触发 |
| Journeys 页双 CTA 同 modal | 低 | duplicate UX |
| UserDropdown REQUEST TO BOOK → checkout | **高** | checkout 为 mock |
| BookingModal 假成功 | 中 | 用户以为已预订 |
| Homepage 无 WhatsApp | 中 | 用户预期与 Contact 页不一致 |
| Header Email 仅 desktop | 中 | mobile 无 Header mailto |
| Article CTA 无 article/journey 上下文 | **高** | 无法归因 |
| tailor_made DB 无 API | 中 | 架构半成品 |
| Sitemap 缺 /contact 等 | 低 | SEO/发现性 |

---

## 6. 建议分类（Keep / Merge / Remove）

### A — 应保留为独立用户入口

- Journey **REQUEST TO BOOK**（带 date/journey 的 structured inquiry）
- **PlanTripModal** 系列（定制 journey，多页复用）
- **mailto + WhatsApp** 直连（Contact 页、Healthcare、Group Tours）
- **Article CTA**（内容营销归因入口，需修 destination）
- Corporate Travel **专用文案** CTA（可仍跳统一 inquiry，但保留文案）

### B — 前台保留，后台应合并

- PlanTripModal + Booking Review → **统一 Inquiry API**
- Article `/contact` CTA → 改为带 `?source=article&slug=` 的 inquiry 或 Plan 页
- Corporate `/contact` CTA → 同上，`intent=corporate`

### C — 应统一到共享组件

- `PlanningSectionNew` + Journeys/Type 底部 Plan section → 共享 `<PlanJourneyCta />`
- mailto / WhatsApp → 共享 `ContactChannels` 读 env
- Article CTA 模板 → 已有 `articleCta.ts`，应扩展 default href

### D — 重复，应移除

- Journeys 页 hero + footer 双 PlanTrip 入口（保留一处或差异化文案）
- ClientJourneyPage 未使用的 PlanTripModal 挂载
- Footer/UserDropdown 假 SUBSCRIBE / REQUEST TO BOOK → checkout

### E — 已失效，应修复

- Contact 表单 submit
- `/support` 邮箱/电话与主站对齐
- BookingModal / checkout / legacy booking/[slug] 要么接 API 要么下线
- `/api/bookings` 补邮件通知或 admin 告警

### F — 暂时无法确认

- Production 是否配置 `RESEND_API_KEY`（未读 .env）
- `bookings` 表 production 是否有数据/监控
- Admin 是否日常处理 bookings 而不依赖邮件
- Custom Article CTA（admin `ctaConfig.mode=custom`）href 可能指向任意 URL — 需 DB 抽样审计

---

## 7. 推荐目标架构

### 7.1 方案对比

#### 方案 A：所有入口统一跳转 Plan Your Journey 页面

| 优点 | 缺点 |
|------|------|
| 单一 UX、易测 | 丢失 Journey 结构化字段（date/price/qualification） |
| 实现快 |「Request to Book」语义与「填定制表」不匹配 |
| | 需新建 `/plan-your-journey` 并迁移 modal |

#### 方案 B：前台差异化，后台统一 Inquiry API（**推荐**）

| 优点 | 缺点 |
|------|------|
| 保留「Request to Book」vs「Plan Journey」vs「Contact」文案 | 需设计 intent 路由与表单字段映射 |
| 单一 `inquiries` 表 + 单一邮件模板 | 一次性迁移两套 API |
| Article/Journey source 可入库 | |
| Admin 一个列表看全部询盘 | |

**推荐方案 B**，原因：

1. 当前产品**无即时库存/支付**，Journey「Book」本质是 **qualified request** — 应与定制 inquiry 同库，但 `intent=journey_booking` 区分。
2. Request to Book 已有丰富字段（firstTimeChina 等），不应强迫用户重填 PlanTripModal。
3. 可**不统一前台文案**，仅统一后台 — 符合「后台合并、前台保留」的运营需求。

### 7.2 目标数据模型（概念层，不含 migration）

```typescript
{
  intent: 'journey_booking' | 'custom_journey' | 'corporate' | 'healthcare' | 'general' | 'article_cta',
  sourceType: 'homepage' | 'journey_detail' | 'article' | 'solutions' | 'contact' | 'header' | ...,
  sourcePage: string,        // pathname
  sourceSlug?: string,
  journeySlug?: string,
  journeyTitle?: string,
  articleSlug?: string,
  articleTitle?: string,
  channel: 'form' | 'mailto' | 'whatsapp',
  name, email, phone, message,
  travelDates?, groupSize?,
  // journey_booking 扩展:
  selectedDate?, adults?, children?, finalPrice?, departureCity?,
  qualification?: { firstTimeChina, traveledDevelopingRegions, whatMattersMost },
  createdAt
}
```

### 7.3 架构示意

```
[Request to Book] ──┐
[PlanTripModal]   ──┼──► POST /api/inquiries ──► inquiries 表
[Contact Page]    ──┤         │
[Article CTA]     ──┘         ├──► Resend/SMTP 邮件
                              └──► /admin/inquiries
```

### 7.4 专项建议

| 主题 | 建议 |
|------|------|
| Request to Book 命名 | 保留或改为「Request Availability / Submit Travel Request」，避免暗示即时确认 |
| Article CTA | Primary → `/plan-your-journey?article={slug}` 或 modal 预填 source；Secondary 保持 `/journeys` |
| Homepage Email/WhatsApp | 保留 Footer mailto + Contact；可选增加 `PlanningSectionNew` 或 WhatsApp |
| Contact vs Plan | Contact = 通用消息 + 直连渠道；Plan = 结构化 trip brief；Contact 表单必须接 API 或重定向 |

---

## 8. 风险与未知项

1. Production 邮件配置未知 — plan-trip 可能在 dev 模式返回 200 但仅 `console.log`。
2. `bookings` 无邮件 — 新 REQUESTED 仅 admin 主动查看可知。
3. 未发现 CRM/webhook 集成。
4. Legacy `/booking/*`、`/checkout` 是否仍有外链/SEO 流量未知。
5. ESLint 报告大量既有问题（审计时 26595 problems），与 inquiry 流无直接关系。

---

## 9. 验证命令与结果（审计当日）

| Command | 结果 |
|---------|------|
| `npm run lint` | **失败** — 26595 problems（4116 errors, 22479 warnings） |
| `npm run build` | **成功** |
| `npm test` | **不存在**该 script |
| `npx vitest run` | **失败** — Playwright browser 未安装 |
| `npx vitest run src/lib/articleCta.test.ts src/lib/articleRichText.test.ts` | **成功** — 27 tests passed |
| Playwright E2E | **无** `.spec` 测试文件 |

---

## 10. 关键源文件索引

| 类别 | 路径 |
|------|------|
| 定制弹窗 | `src/components/modals/PlanTripModal.tsx` |
| 定制区块 | `src/components/sections/PlanningSectionNew.tsx` |
| Journey 预订 | `src/app/journeys/[...slug]/ClientJourneyPage.tsx` |
| 预订审核页 | `src/app/booking/review/[journeyId]/page.tsx` |
| 联系页 | `src/app/contact/page.tsx` |
| 文章 CTA | `src/lib/articleCta.ts`, `src/components/articles/ArticlePrimaryCta.tsx` |
| Plan-trip API | `src/app/api/plan-trip/route.ts` |
| Bookings API | `src/app/api/bookings/route.ts` |
| 邮件辅助 | `src/lib/optionalEmail.ts` |
| 环境变量示例 | `env.example.txt` |
| Bookings 表 migration | `database/migrations/007_create_bookings_table.sql`, `008_bookings_qualification_and_requested.sql` |
| Tailor-made 表 migration | `database/migrations/003_create_tailor_made_china.sql` |
| Sitemap 静态路径 | `src/lib/journeySitemap.server.ts` |

---

## 11. 修订记录

| 日期 | 说明 |
|------|------|
| 2025-06-19 | 初版：只读审计，未实施任何代码修改 |
