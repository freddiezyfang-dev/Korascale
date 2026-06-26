# PR-J0 Journey Audit

**Audit date:** 2026-06-26  
**Branch:** `main` @ `42e03c2`  
**Scope:** Read-only — no production logic changes, no DB writes, no deploy.

---

## 1. Executive Summary

| Metric | Value |
|--------|------:|
| Journey 总数（DB） | 83 |
| Active Journey | 24 |
| Sitemap Journey URL 数 | 29（24 详情 + 4 类型页 + `/journeys`） |
| SEO-ready（审计脚本判定） | 4 / 24 active |
| **P0** | **4** |
| **P1** | **11** |
| **P2** | **14** |
| **P3** | **6** |

**是否建议进入 PR-J1：** **是。** 数据层存在 trailing hyphen、taxonomy 缺口、SEO 字段与关联空白；应在 PR-J2/PR-J3 前先做数据规范化。

**最关键的 5 个结论：**

1. **列表页 SSR 有效**：生产 `/journeys` 初始 HTML 含 **24** 条 active 产品 `<a href="/journeys/{slug}">` 链接，与 DB 一致。
2. **详情页主体未进入可抓取正文**：24/24 active 详情页初始 HTML 正文约 **635 字符**（仅导航 + skeleton），无 H1、无 itinerary 天数、无 Trip JSON-LD；metadata/canonical 由服务端正确输出。
3. **类型页产品网格完全客户端加载**：`/journeys/type/*` 初始 HTML **0** 条产品详情链接；Hero/文案可 SSR，产品依赖 `useJourneyManagement` → `/api/journeys`。
4. **Legacy 类型 URL 未 301**：`/journeys/explore-together` 等返回 **200**，canonical 指向 `/journeys/type/...`，形成可索引重复 URL。
5. **Journey × Inspiration 联动几乎为空**：24/24 active Journey 的 `data.relatedArticles` 为 0；22 篇 active Article 中 18 篇 `related_journey_ids` 为空。

---

## 2. Workspace Baseline

### Git

| Command | Result |
|---------|--------|
| `git branch --show-current` | `main` |
| `git status --short` | 4 modified `.gitkeep` under `content-workspace/{approved,drafts,revisions,source}/` |
| `git diff --stat` | 4 files, +1 line each (`.gitkeep` placeholders) |
| `git log -5 --oneline` | `42e03c2` Merge PR #13 admin revision … → `757efd5` Merge PR #11 server admin auth |

**未提交修改是否影响 Journey 审计：** **否。** 仅 content-workspace 占位文件，与 Journey 路由/查询/SSR 无关。

### Tooling

| Item | Value |
|------|-------|
| Next.js | `^15.5.7` |
| React | `19.1.0` |
| TypeScript | `strict: true`, paths `@/*` |
| DB access | `@/lib/db` → `pg` Pool，`POSTGRES_URL` / `NEON_POSTGRES_URL` |
| Scripts | `dev`, `build`, `start`, `lint`, `typecheck`, `test` |
| Sitemap | `src/app/sitemap.ts` (`force-dynamic`) |
| Robots | `src/app/robots.ts` → `https://www.korascale.com/sitemap.xml` |
| Redirects | `next.config.ts` — Inspiration 旧类、wishlist/booking → `/journeys`；**无 Journey slug 301 表** |
| Middleware | **不存在** |

---

## 3. Current Journey Architecture

| Area | File | Responsibility | Server/Client | Data source | Risk notes |
|------|------|----------------|---------------|-------------|------------|
| List route | `src/app/journeys/page.tsx` | SSR 拉取列表 + metadata | **Server** → `JourneysPageClient` | `getActiveJourneysForList()` → DB | Client 边界内渲染卡片，但 **props SSR 有效** |
| List UI | `src/app/journeys/JourneysPageClient.tsx` | 筛选、卡片、fallback defaults | Client | `initialJourneys` + Context API | 筛选纯客户端；fallback 硬编码 7 条 demo |
| Type route | `src/app/journeys/type/[type]/page.tsx` | 校验 slug、`generateStaticParams` | Server shell | `journeyTypeRoutes` | **不传 journey 列表** |
| Type UI | `src/app/journeys/type/[type]/JourneyTypePageClient.tsx` | Hero、推荐、筛选网格 | Client | `useJourneyManagement()` → `/api/journeys` | **产品列表非 SSR**；网格 Card **无 Link** |
| Group tours | `src/app/journeys/type/group-tours/page.tsx` | 独立 B2B landing | Server shell → `GroupToursLandingClient` | 静态文案 | 与 `[type]` 路由并存；**更具体路由优先** |
| Detail route | `src/app/journeys/[...slug]/page.tsx` | `generateMetadata`、redirect type slug、`initialJourney` | **Server** | `getJourneyBySlugForPage()` | `generateStaticParams` + `dynamicParams: true` |
| Detail UI | `src/app/journeys/[...slug]/ClientJourneyPage.tsx` | 全文 UI、JSON-LD、API fallback | Client | `initialJourney` + Context + `/api/journeys/slug/*` | **主体 + Trip schema 在 Client**；SSR 常输出 skeleton |
| List query | `src/lib/journeyListQuery.server.ts` | 列表/ sitemap slug | Server | PostgreSQL `journeys` | `status = 'active' OR status IS NULL` |
| Detail query | `src/lib/journeyDetailQuery.server.ts` | slug 详情、static params、sitemap slugs | Server | PostgreSQL | 同上 active 条件 |
| Facade | `src/lib/journeyServer.ts` | `cache()` 去重 metadata+page | Server | 上述 query | metadata 与 page **同源** |
| Context | `src/context/JourneyManagementContext.tsx` | 全站 journey 状态 | Client | `journeyAPI.getAll` → `/api/journeys` | 首屏 `isLoading: true` 影响类型/详情 SSR |
| Types | `src/config/journeyTypeRoutes.ts` | URL slug ↔ `JourneyType` 标签 | Shared | 常量 | DB 存 **标签** 非 slug |
| Sitemap | `src/app/sitemap.ts` + `journeySitemap.server.ts` | 静态路径 + journey slugs | Server | DB slugs | `lastModified` **非** `updated_at` |
| Related trips | `Journey.data.relatedTrips` JSONB | 手工/生成相关 Journey | Data | JSONB | 非 Article UUID |
| Related articles | Article 侧 | `recommended_items`、`related_journey_ids` | DB | `articles` 表 | Journey 侧 **无** `relatedArticles` 列 |

### 架构问答（证据导向）

| Question | Answer |
|----------|--------|
| `/journeys` 是否 Server Component？ | **是** — `page.tsx` 无 `'use client'`，服务端 `await getActiveJourneysForList()` |
| 类型页是否服务端按 type 查数据？ | **否** — 仅校验 slug，产品由 Client Context 拉全量再 filter |
| 类型页是否先加载全部再客户端过滤？ | **是** — `JourneyTypePageClient` L204–220 |
| 详情主体是否在 Server Component 获取？ | **部分** — Server 取 `initialJourney`，但渲染在 `ClientJourneyPage` |
| 是否存在 useEffect + fetch 才加载主体？ | **是** — 当 `initialJourney` 不可渲染且 Context 未就绪时（L386–425）；生产 HTML 为 skeleton |
| generateMetadata 与页面是否同源？ | **是** — 均调用 `getJourneyBySlugForPage`（React `cache` 去重） |
| 是否重复查询？ | **同请求内否**；Context 仍会 **第二次** 请求 `/api/journeys` |
| catch-all vs `/type/[type]` 冲突？ | **有** — `/journeys/{type-slug}` 应 `redirect()` 至 `/journeys/type/{slug}`；生产仍 **200** |
| notFound / redirect / canonical | `notFound()` 无 journey；type redirect 在 `[...slug]/page.tsx` L104–106；canonical 在 `generateMetadata` |
| force-dynamic / SSG | Journey 详情 **SSG**（`●` in build）；sitemap `force-dynamic`；列表静态 |
| sitemap active 条件 | 与前台一致：`status = 'active' OR status IS NULL`（当前 DB 无 NULL status） |

---

## 4. Database and Data Model Findings

### 主表 `journeys`（`database/migrations/001_create_tables.sql`）

| 字段 | 说明 |
|------|------|
| PK | `id UUID` |
| slug | `VARCHAR(255) UNIQUE NOT NULL` |
| status | `VARCHAR(20) DEFAULT 'draft'` |
| journey_type | `VARCHAR(50)` — 存 **展示标签**（Explore Together 等） |
| title, description, short_description | 列级 |
| pageTitle, metaDescription, heroImage, itinerary… | **`data JSONB`** |
| price | `DECIMAL` 列 |
| duration, max_participants | 列级；`maxGuests` 多在 JSONB |
| published_at | **不存在**；使用 `created_at` |
| updated_at | 有 |
| display_order / seo_ready | **不存在** |
| places/regions | `region`, `place` 列；无独立关系表 |
| Journey ↔ Article | **无关系表**；Article 侧 `related_journey_ids`、`recommended_items` JSONB |
| Journey ↔ Journey | `data.relatedTrips` JSONB 数组 |

### Status 分布（只读查询）

| Status | Count |
|--------|------:|
| active | 24 |
| inactive | 59 |
| NULL | 0 |
| draft | 0 |

代码中 `status IS NULL` 视为 active 的条件 **仍存在于** `journeyListQuery.server.ts` L119–121，但当前数据无 NULL。

### Journey type 分布

| journey_type（DB 值） | 全部 | Active |
|-------------------------|-----:|-------:|
| Explore Together | 48 | 8 |
| Deep Discovery | 34 | 16 |
| NULL | 1 | 0 |
| Signature Journeys | 0 | 0 |
| Group Tours | 0 | 0 |

**Taxonomy 不匹配：** 类型页 slug（`signature-journeys`, `group-tours`）在 active 产品中 **0 条**。

### Slug 异常

| 检查项 | Count | Active 影响 |
|--------|------:|-------------|
| trailing hyphen | 4 | **1** — `beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-` |
| duplicate slug | 0 | — |
| 保留路径冲突 | 0 | — |

---

## 5. Journey Inventory Summary

完整清单：`docs/audits/pr-j0-journey-inventory.csv`（83 行）

Active 摘要：

- **SEO-ready（脚本）：** 4/24  
- **无 hero alt（JSONB）：** 24/24  
- **currency 未结构化：** 24/24（脚本记 `unknown`）  
- **itinerary 存在（JSONB）：** 多数有；7 条 active 在 CSV 中 `itinerary_exists=false`（需 PR-J1 核对 JSONB 结构）  
- **relatedArticles：** 0/24  
- **relatedTrips：** 仅个别 Journey 有（如 chongqing-highlights 有 4）  

---

## 6. Listing Page Findings

**URL：** https://www.korascale.com/journeys  
**HTTP：** 200

| Check | Production evidence |
|-------|---------------------|
| title | `Journeys \| Korascale` |
| meta description | 有（服务端 metadata） |
| canonical | `https://www.korascale.com/journeys` |
| robots | 未设置（默认 index） |
| H1 | 1× — `See Where We Can Take You` |
| 卡片于初始 HTML | **是** — 24 产品链接 + 4 类型 + legacy 类型链接 |
| 链接为 `<a href>` | **是** |
| 覆盖全部 active | **是**（24/24 链接出现在 HTML） |
| 图片 alt | 有 fallback alt（`getJourneyCardImageAlt`） |
| 卡片字段 | 名称、时长、人数、价格可见（价格格式 `$number`，币种未统一） |
| duration filter | UI 仅 1–4 Days；active 产品有 **6–18 天**，筛选 **不覆盖** |
| query parameter URL | 筛选 **不** 写 URL |
| faceted URL 风险 | **低**（无 query 筛选 URL） |
| 无 JS 可读性 | **是** — 产品链接在 HTML |
| JSON-LD | Organization + TravelAgency（layout） |
| 可见正文长度 | ~4176 字符（含导航） |

---

## 7. Type Page Findings

| Type | DB active | HTML 产品链接 | H1 | Canonical | SSR 产品列表 | Main issue |
|------|----------:|----------------:|----|-----------|--------------|------------|
| explore-together | 8 | **0** | Explore Together | **缺失** | **否** | 产品仅客户端；推荐区依赖 Context |
| deep-discovery | 16 | **0** | Deep Discovery | **缺失** | **否** | 同上 |
| signature-journeys | 0 | **0** | Signature Journeys | **缺失** | **否** | **空类型页仍 200/index** |
| group-tours | 0 | **0** | Group Travel in China… | **缺失** | **否** | **B2B landing**，非产品列表；独立 `group-tours/page.tsx` |

**group-tours：** 使用 `GroupToursLandingClient` B2B 文案 + 表单 CTA，**不是**产品 grid。

**Legacy URL（/journeys/{type-slug}）：** 全部 **HTTP 200**，无 301；canonical 指向 `/journeys/type/...`（metadata 来自 catch-all redirect 分支）。

---

## 8. Detail Page SSR Findings

对 **24/24** active Journey 执行生产 HTML 抓取（`scripts/audit/pr-j0-html-audit.ts` + 手工校验）。

### 汇总

| 指标 | 结果 |
|------|------|
| HTTP 200 | 24/24 |
| Server title + canonical | 24/24 正确 |
| 初始 HTML `<h1>` | **0/24** |
| 初始 HTML 可见正文（去 script/head） | ~**635** 字符 — nav + **skeleton** |
| Journey 名称于正文 | **0/24** |
| itinerary / Day 1 于正文 | **0/24** |
| Trip JSON-LD | **0/24**（仅 layout Organization/TravelAgency） |
| 依赖客户端 | **是** — `ClientJourneyPage` + Context loading |

### 样例（beijing-city-imperial-grandeur-urban-chic-1-day-tour）

| Field | Value |
|-------|-------|
| HTTP | 200 |
| Title | `Beijing City Imperial Grandeur & Urban Chic 1-Day Tour \| Korascale` |
| Canonical | 正确 |
| Body | skeleton（`animate-pulse`），无产品 H1 |
| Production cache | `x-nextjs-prerender: 1`, `x-vercel-cache: HIT` |

### Production vs Local

| 环境 | 详情正文 SSR |
|------|-------------|
| Production | metadata ✅ / body ❌（skeleton） |
| Local `next build && next start` | 同架构；Client 边界导致 SSG 输出 skeleton（代码路径一致） |

**根因：** `ClientJourneyPage` 在 `journeysLoading && !journeyHasRenderableContent(initialJourney)` 时渲染 skeleton；SSG/首屏 Context 初始 `isLoading: true`；Trip JSON-LD 在 Client `useMemo` 内输出。

---

## 9. Sitemap and Canonical Findings

| Metric | Count |
|--------|------:|
| Active Journeys in DB | 24 |
| SEO-ready Journeys | 4 |
| Journey URLs in sitemap | 29 |
| Missing from sitemap | **0** |
| Invalid sitemap URLs（HTTP≠200） | **0**（抽样全 200） |
| Redirecting sitemap URLs | **0** |
| Duplicate sitemap URLs | **0** |

**异常 URL：**

- `.../beijing-to-shanxi-...-6-day-tour-` — trailing hyphen，sitemap 与 canonical **一致**（但 slug 本身不规范）

**问题：**

- `lastModified` 使用 `new Date()` fallback（`sitemap.ts` L17、L33），**非** journey `updated_at`  
- 类型页在 sitemap 中 ✅  
- `/journeys` 在 sitemap 中 ✅  
- sitemap 条件含 `status IS NULL`（当前无实例）

---

## 10. Redirect and Slug Findings

| 机制 | 状态 |
|------|------|
| DB redirect 表 | **无** |
| next.config Journey slug 301 | **无** |
| `[...slug]/page.tsx` type slug | 代码 `redirect()` → `/journeys/type/{slug}` |
| Production `/journeys/explore-together` | **200**（非 301）；canonical → type URL |
| Trailing hyphen active slug | **200**，无规范化 301 |
| www/https | Vercel HSTS ✅ |
| trailing slash | 无异常 |

**建议（不在 PR-J0 执行）：** trailing hyphen 301、legacy type URL 301、slug 变更映射表。

---

## 11. Journey × Inspiration Findings

| 机制 | 实现 |
|------|------|
| Journey → Article | **未实现**（`data.relatedArticles` 全空） |
| Article → Journey | `articles.related_journey_ids` JSONB + `recommended_items` |
| Article 页面 Related Journey 展示 | admin 标注 **future module**，前台 **未展示** |
| Inspiration Related Articles | `recommended_items` / revision workflow UUID |

### 统计

| 指标 | Count |
|------|------:|
| Active Journey 无 Related Inspiration | **24** |
| 仅 1 篇 Related Article 的 Journey | 0 |
| Active Article 无 Related Journey | **18** / 22 |
| Journey `relatedTrips` | 极少数（JSONB 内嵌 slug 对象） |

**Legacy category：** Article `category` 字段仍见历史值（如 Food Journey）；正式四类 slug 在 Inspiration 路由使用。详见 `docs/audits/pr-j0-article-relations.json`。

---

## 12. Structured Data Findings

| 页面 | 初始 HTML JSON-LD |
|------|-------------------|
| 全站 layout | Organization, TravelAgency ✅ 有效 |
| Journey 详情 | **无 Trip/Offer** 于初始 HTML |
| 类型页 | 仅 layout schema |
| 列表页 | 仅 layout schema |

**Client 内 intended schema（未进初始 HTML）：** `@type: Trip` + nested Offer（`ClientJourneyPage.tsx` L781–807），`priceCurrency: 'CNY'` 硬编码，**无** AggregateRating/FAQ schema。

**未调用 Google Rich Results Test**（审计约束）。

---

## 13. Build and Validation Results

| Command | Result | Journey 相关 |
|---------|--------|-------------|
| `npm run typecheck` | **FAIL** — 3 errors（inquiries 测试，非 Journey） | 否 |
| `npm run lint` | **FAIL** — 4185 errors / 14613 warnings（历史债务；`ignoreDuringBuilds: true`） | 部分 Journey 文件有 unused-vars |
| `npm run build` | **SUCCESS** — Journey 详情 SSG 24 paths | 是 |
| `npm run test` | **PASS** — 302 tests | 无 dedicated Journey page tests |

---

## 14. Issues by Severity

### [P0] 详情页初始 HTML 无可抓取主体内容

- **Evidence:** 24/24 active 详情页 body 文本 ~635 字符；含 `animate-pulse` skeleton；无 H1、无 Day 1、无 Trip JSON-LD。例：`curl` https://www.korascale.com/journeys/beijing-city-imperial-grandeur-urban-chic-1-day-tour
- **Affected URLs / records:** 全部 24 active Journey 详情 URL
- **Relevant files:** `src/app/journeys/[...slug]/ClientJourneyPage.tsx` L311–828；`src/context/JourneyManagementContext.tsx` L809–929
- **Root cause:** 详情 UI 为 Client Component；SSG 时 Context `isLoading: true` 触发 skeleton；正文与 schema 在 hydration 后渲染
- **SEO impact:** 爬虫可能仅见 nav/footer；与已索引 title/description 不一致
- **Recommended PR:** PR-J2
- **Do not fix in PR-J0:** ✅

### [P0] 类型页产品列表不在初始 HTML

- **Evidence:** `/journeys/type/deep-discovery` HTML 中产品详情链接 **0**；仅 4 条 type 导航链接
- **Affected URLs:** 4 个类型页
- **Relevant files:** `src/app/journeys/type/[type]/page.tsx`；`JourneyTypePageClient.tsx` L126–220
- **Root cause:** 服务端不传 `initialJourneys`；依赖 Client Context fetch
- **SEO impact:** 类型页无法被关联到具体产品 URL
- **Recommended PR:** PR-J3
- **Do not fix in PR-J0:** ✅

### [P0] Legacy 类型 URL 返回 200 重复内容

- **Evidence:** `/journeys/explore-together` HTTP 200；canonical `https://www.korascale.com/journeys/type/explore-together`；无 redirect chain
- **Affected URLs:** `/journeys/explore-together`, `deep-discovery`, `signature-journeys`, `group-tours`
- **Relevant files:** `src/app/journeys/[...slug]/page.tsx` L26–36, L104–106；`JourneysPageClient.tsx` L377–467（链接指向 legacy 路径）
- **Root cause:** 列表页链到 `/journeys/{type}`；生产静态页未执行 301（或旧缓存）
- **SEO impact:** 重复 URL；依赖 canonical 收敛
- **Recommended PR:** PR-J3 + PR-J1（内链）
- **Do not fix in PR-J0:** ✅

### [P0] Active Journey trailing hyphen slug 可访问且入 sitemap

- **Evidence:** DB slug `beijing-to-shanxi-...-6-day-tour-`；HTTP 200；sitemap 含同 URL
- **Affected URLs / records:** 1 active + 3 inactive trailing hyphen
- **Relevant files:** DB data；`fetchActiveJourneySitemapSlugs` 仅 trim 首尾空白，不拒绝 trailing `-`
- **Root cause:** 入库 slug 生成未规范化
- **SEO impact:** 非规范 URL、分享/追踪分裂
- **Recommended PR:** PR-J1
- **Do not fix in PR-J0:** ✅

### [P1] 类型页缺少 canonical

- **Evidence:** 4 个类型页 `generateMetadata` 无 `alternates.canonical`
- **Relevant files:** `src/app/journeys/type/[type]/page.tsx` L25–34
- **Recommended PR:** PR-J3

### [P1] Signature / Group Tours 无 active 产品但页面可索引

- **Evidence:** DB active 0；sitemap 仍含类型 URL
- **Recommended PR:** PR-J1 + PR-J3

### [P1] Trip JSON-LD 不在服务端 HTML

- **Evidence:** 详情页初始 HTML 无 `@type: Trip`；仅在 Client
- **Relevant files:** `ClientJourneyPage.tsx` L781–880
- **Recommended PR:** PR-J2

### [P1] 详情页无 H1 于初始 HTML

- **Evidence:** 24/24 `h1_count=0`
- **Recommended PR:** PR-J2

### [P1] Sitemap lastModified 非 journey updated_at

- **Evidence:** `sitemap.ts` L17–36 使用 `fallbackModified = new Date()`
- **Recommended PR:** PR-J2 或独立 SEO PR

### [P1] 列表 duration 筛选不覆盖 5+ 天产品

- **Evidence:** UI 选项 1–4 Days；active 有 6–18 天 Journey
- **Relevant files:** `JourneysPageClient.tsx` L256
- **Recommended PR:** PR-J3

### [P1] 类型页产品 Card 无 href（网格区）

- **Evidence:** `JourneyTypePageClient.tsx` L853–890 Card 无 Link
- **Recommended PR:** PR-J3

### [P1] status IS NULL 视为 active 的查询条件

- **Evidence:** `journeyListQuery.server.ts` L119–121（数据虽无 NULL，规则风险仍在）
- **Recommended PR:** PR-J1

### [P1] 价格无结构化 currency / price basis

- **Evidence:** CSV 24/24 `currency=unknown`
- **Recommended PR:** PR-J1

### [P1] 7+ active Journey itinerary 数据缺口

- **Evidence:** inventory CSV 部分 active 行 `itinerary_exists=false`
- **Recommended PR:** PR-J1

### [P1] 双 group-tours 路由（`[type]` vs 专用页）

- **Evidence:** build 输出两个 group-tours 入口；专用页覆盖
- **Recommended PR:** PR-J3（文档化/合并）

### [P2] 24/24 active Journey 无 relatedArticles

- **Recommended PR:** PR-J4

### [P2] 18/22 active Article 无 related_journey_ids

- **Recommended PR:** PR-J4

### [P2] hero alt 全缺

- **Recommended PR:** PR-J1

### [P2] 列表页链到 legacy type URL

- **Relevant files:** `JourneysPageClient.tsx` L377–467
- **Recommended PR:** PR-J3

### [P2] 详情页 Client fetch 冗余

- **Evidence:** `fetch('/api/journeys/slug/...')` when Context empty
- **Recommended PR:** PR-J2

### [P2] defaultJourneys fallback 仍存在于 Client

- **Risk:** API 失败时展示过时 demo 数据
- **Recommended PR:** PR-J3

### [P2] title 中 `| Korascale Travel | Korascale` 重复

- **Evidence:** 部分详情页 production title
- **Recommended PR:** PR-J2

### [P2] Explore Together 与 Deep Discovery taxonomy 仅两类有产品

- **Recommended PR:** PR-J1

### [P2] 无 published_at 字段

- **Recommended PR:** PR-J1

### [P2] relatedTrips 与 DB Journey 关系未 UUID 化

- **Recommended PR:** PR-J4

### [P2] Article admin：Related Journeys 未在前台展示

- **Recommended PR:** PR-J4

### [P2] JSON-LD Offer priceCurrency 硬编码 CNY

- **Recommended PR:** PR-J2

### [P2] 类型页 status 过滤与列表不一致

- **Evidence:** 类型页 `status === 'active'`；列表 `null \|\| active`
- **Recommended PR:** PR-J1

### [P2] inactive 记录 trailing hyphen（3）

- **Recommended PR:** PR-J1

### [P3] duration 推断 journey type 逻辑（Client）

- **Recommended PR:** PR-J3

### [P3] 筛选体验 / search 仅客户端

- **Recommended PR:** PR-J3

### [P3] FAQ structured data 可补充

- **Recommended PR:** PR-J2

### [P3] AggregateRating 无真实评价支撑

- **Recommended PR:** PR-J2

### [P3] group-tours B2B 文案 vs 产品能力对齐审查

- **Recommended PR:** PR-J3

### [P3] lint/typecheck 技术债

- **Recommended PR:** 独立 chore

---

## 15. Proposed PR-J1 Scope（数据规范化 — 不执行）

- 修复 trailing hyphen slug（含 active 1 条 + inactive 3 条）
- 统一 `journey_type` 标签；补 Signature / Group Tours 或标记为非产品类型
- 结构化 price currency、basis、maxGuests
- 补 metaDescription、heroAlt、itinerary/highlights/FAQ 缺口
- 移除或明确 `status IS NULL` 语义；禁止 NULL=active 入 sitemap
- 添加 slug 变更 301 映射（表或 config）
- 可选：`published_at` / `display_order` / `seo_ready` 字段设计

---

## 16. Proposed PR-J2 Scope（详情 SSR + SEO 模板 — 不执行）

- 将详情主体、H1、itinerary、breadcrumb 拆为 Server Component 或 RSC 子树
- 服务端输出 Trip/Product JSON-LD（与可见价格一致）
- 消除 skeleton 作为 SEO 首屏
- sitemap `lastModified` ← `updated_at`
- 统一 title 模板；metadata 与 body 对齐

---

## 17. Proposed PR-J3 Scope（列表 + 类型页 — 不执行）

- 类型页 SSR 传入 filtered `initialJourneys`
- 修正列表 → `/journeys/type/{slug}` 内链
- Legacy URL 301
- 类型页 canonical
- duration 筛选扩展；类型页 Card 加 Link
- 空类型页 noindex 或隐藏 sitemap
- 合并 group-tours 双路由策略

---

## 18. Proposed PR-J4 Scope（Journey × Inspiration — 不执行）

- Journey `data.relatedArticles` UUID 方案
- Article `related_journey_ids` 双向维护
- 详情页 Related Inspiration 模块 SSR
- Article 页 Related Journeys 模块
- 废弃 category URL 清理与 301 审计

---

## 19. Appendix

### 执行命令

```bash
git branch --show-current
git status --short
git diff --stat
git log -5 --oneline

npx tsx --tsconfig tsconfig.json scripts/audit/pr-j0-db-inventory.ts
npx tsx --tsconfig tsconfig.json scripts/audit/pr-j0-html-audit.ts
npx tsx --tsconfig tsconfig.json scripts/audit/pr-j0-article-relations.ts

npm run typecheck
npm run lint
npm run build
npm run test

# 生产 HTML spot-check（示例）
curl -sL 'https://www.korascale.com/journeys'
curl -sL 'https://www.korascale.com/journeys/beijing-city-imperial-grandeur-urban-chic-1-day-tour'
curl -sI 'https://www.korascale.com/journeys/explore-together'
```

### 查询说明

- PostgreSQL 只读：`BEGIN TRANSACTION READ ONLY` … `ROLLBACK`
- 未输出连接串、密码、API key

### 未能验证的项目

- Google Search Console（范围外）
- Google Rich Results Test（未调用）
- 禁用 JS 的浏览器人工复测（用初始 HTML 分析替代）
- Preview/staging 环境对比

### 环境限制

- 本地 audit 使用 `.env.local` 中 `POSTGRES_URL`（只读 SELECT）
- Build 成功依赖本地 env 可用

### Production 与 Local 差异

- Journey 详情 SSR 问题在代码层一致；非「未部署 SSR 改造」单独问题
- Production Vercel 缓存 `x-vercel-cache: HIT` 可能延长旧 HTML 存活

### 产出文件

| File | Purpose |
|------|---------|
| `docs/audits/pr-j0-journey-audit.md` | 本报告 |
| `docs/audits/pr-j0-journey-inventory.csv` | 83 行 inventory |
| `docs/audits/pr-j0-db-summary.json` | DB 摘要 |
| `docs/audits/pr-j0-html-audit.json` | 生产 HTML 抓取 |
| `docs/audits/pr-j0-article-relations.json` | 联动统计 |
| `scripts/audit/pr-j0-*.ts` | 只读审计脚本 |

---

*PR-J0 完成 — 未修改生产逻辑、未写入数据库、未提交、未部署。*
