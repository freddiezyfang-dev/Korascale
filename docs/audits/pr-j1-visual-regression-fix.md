# PR-J1 Visual Regression Fix

**Branch:** `fix/pr-j1-journey-indexability`  
**Date:** 2026-06-26

## Summary

Fixed three Vercel Preview visual regressions introduced by PR-J1 while preserving SSR/SEO (24/24 detail, 4/4 type, 4/4 legacy redirect).

---

## 1. Journey detail — extra Breadcrumb bar

### Root cause

`JourneyDetailServerSections.tsx` rendered a standalone visible block:

```html
<nav aria-label="Breadcrumb" class="bg-[#f5f1e6] border-b border-[#e0d7c4]">…</nav>
```

Inserted between site navigation and the client Hero, creating a full-width beige strip.

### Fix

- `JourneyDetailServerSections` now outputs **only** Trip + BreadcrumbList JSON-LD `<script>` tags.
- No visible `<nav>`; Hero follows Header/Navigation directly.
- H1, excerpt, itinerary remain in `ClientJourneyPage` initial SSR via `initialJourney`.

### Structure after fix

```
Header → Navigation → Hero (data-testid="journey-hero") → … → Footer
```

---

## 2. Type pages — extra Server Product List

### Root cause

`page.tsx` rendered **both**:

1. `JourneyTypeServerProductList` — plain text card grid above Hero (SSR SEO block)
2. `JourneyTypePageClient` — original designed page with Hero + product grid

### Fix

- **Deleted** `JourneyTypeServerProductList.tsx` and its import/usage.
- `getActiveJourneysByType()` → `initialJourneys` → `JourneyTypePageClient` only.
- `initialJourneys !== undefined` used (not truthy length) so Signature empty state uses server `[]` without context fallback delay.
- Product `<a href>` links render inside `data-testid="journey-grid"` on first SSR.

### Structure after fix

```
Header → Navigation → Hero (data-testid="journey-type-hero") → … → Grid (data-testid="journey-grid") → Footer
```

### SSR link counts (validated)

| Page | Grid hrefs |
|------|------------|
| Explore Together | 8 |
| Deep Discovery | 16 |
| Signature Journeys | 0 (empty state, noindex) |
| Group Tours | B2B landing unchanged |

---

## 3. Footer white space

### DOM 几何结论（2026-06-26 复测，`f34158a`）

| 指标 | 结果 |
|------|------|
| `structuralGap`（`footer.top − footerPrev.bottom`） | **六类页面均为 0px** |
| `wrapperInternalGap`（wrapper 内 lastChild 底部至 wrapper 底部） | **均为 0px** |
| `unexplainedGap` | **≤ 2px（舍入误差）** |
| `emptyTallElements`（Footer 前无文本且 height≥80px） | **无** |

**Footer 前的 DOM sibling：**

| 页面 | `footer.previousElementSibling` | 最后子节点 |
|------|----------------------------------|------------|
| `/journeys` | `div.bg-white` | `section.bg-white…py-12`（Plan Your Journey） |
| 类型页 | `main.bg-[#f5f1e6]` | 同上 |
| 详情页 | `div.bg-white` | 末 section（Booking / Experiences 等） |
| Group Tours | `main.min-h-screen` | 末 section（仍 0 gap） |

**`/journeys` Footer 区域截图**（`docs/audits/footer-gap-screenshots/journeys-list.png`）：绿色 Plan Your Journey CTA 紧贴黑色 Footer，**无额外白色空白带**。

完整 JSON：`docs/audits/pr-j1-footer-gap-diagnosis.json`

### 为何删除 `min-h-screen` 后用户仍可能在 Preview 看到「白块」

1. **并非 layout gap**：末段 `Section background="primary"`（`bg-white py-12`）是 Plan Your Journey CTA 区块，**设计上为白色**，紧邻 Footer；易被误认为「空白」。
2. **`min-h-screen` 不是当前 commit 的实际占空元素**：DOM 几何未显示任何 `min-height: 100vh` 元素在 Footer 前产生 >150px 无内容间距（Group Tours 保留 `min-h-screen` 但 gap 仍为 0）。
3. **Preview 自动化不可达**：Vercel Preview 需 SSO 登录（`vercel.com/login?next=…`），无法在 CI/脚本中复现线上视觉；部署 SHA 与本地 HEAD 一致（见下）。

### 此前 `min-h-screen` 批量移除

仍保留在 `f34158a` 中（列表/详情/Explore Together 根 wrapper、Skeleton、`type/[type]/loading.tsx` 删除），但 **不是当前 DOM 中 Footer 前空白的占空根因**。

### 若仍出现 >150px 无内容白块

在浏览器 DevTools 中对 Footer 上方 60px 执行 `document.elementsFromPoint(innerWidth/2, footer.getBoundingClientRect().top - 60)`，并对比 `footer.previousElementSibling.getBoundingClientRect().bottom` 与 `footer.getBoundingClientRect().top`。

---

## 4. Plan Your Journey CTA — invisible on Preview

### Root cause (Case B: DOM exists but not visible)

Rendering chain:

```
JourneyTypePageClient / JourneysPageClient ('use client')
  → PlanYourJourneyCtaSection
    → Section (bg-white py-12, testId=plan-your-journey-section)
      → Container (bg-[#1e3b32], testId=plan-your-journey-cta)
        → Heading + Text (inline color #FFFFFF)
        → Button (white border/text, opens PlanTripModal)
      → PlanTripModal
```

- Section **always renders** (no conditional wrapper).
- CTA is **not** gated on `mounted`, IntersectionObserver, or Framer Motion.
- Problem: inner Container used **`bg-tertiary`**, but Tailwind v4 **never emitted `.bg-tertiary`** (no `--color-tertiary` in `@theme` before fix).
- Computed `background-color: rgba(0,0,0,0)` on transparent Container over **white Section** → looks like empty white block.
- Heading/Text use **white** inline styles → white-on-white = invisible copy/button outline only.

### Fix

- Extracted `PlanYourJourneyCtaSection.tsx` with explicit `bg-[#1e3b32]` (SSR-safe arbitrary class, present in built CSS).
- Added `data-testid="plan-your-journey-section"` and `data-testid="plan-your-journey-cta"`.
- Registered `--color-tertiary: #1e3b32` in `globals.css` `@theme inline` for other legacy `bg-tertiary` usages.
- HTML + Playwright validation: section present ⇒ CTA text visible, opacity 1, background rgb(30,59,50).

Validation JSON: `docs/audits/pr-j1-plan-cta-validation.json`

---

## Files changed

| Action | File |
|--------|------|
| Modified | `JourneyDetailServerSections.tsx` — JSON-LD only |
| Deleted | `JourneyTypeServerProductList.tsx` |
| Modified | `type/[type]/page.tsx` — client-only render |
| Modified | `JourneysPageClient.tsx`, `JourneyTypePageClient.tsx` — use `PlanYourJourneyCtaSection` |
| Added | `PlanYourJourneyCtaSection.tsx` — explicit green CTA + testids |
| Modified | `Section.tsx`, `Container.tsx` — optional `testId` |
| Modified | `globals.css` — `@theme` `--color-tertiary` |
| Modified | `scripts/audit/pr-j1-html-validation.ts` — Plan CTA SSR checks |
| Added | `scripts/audit/pr-j1-plan-cta-validation.ts` — visibility audit |
| Modified | `JourneyRouteSkeleton.tsx` — no min-h-screen |
| Deleted | `type/[type]/loading.tsx` |
| Modified | `Footer.tsx` — `data-testid="site-footer"` |
| Modified | `scripts/audit/pr-j1-html-validation.ts` — visual regression checks |

---

## SSR preserved

- ✅ 24/24 detail: H1, body, itinerary, Trip JSON-LD, BreadcrumbList JSON-LD
- ✅ No duplicate primary content, no CSS-hidden SEO blocks
- ✅ Explore 8 / Deep 16 product hrefs in `journey-grid`
- ✅ Signature `noindex, follow`; Group Tours B2B landing
- ✅ Legacy 308 redirects 4/4

---

## Desktop / mobile

Validated via production build + HTML audit (semantic testids). Expected layout:

- **Desktop 1440px:** Header → Nav → Hero (no breadcrumb strip, no server product list) → content → Footer
- **Mobile 390px:** Same order; no extra blocks above Hero; no viewport-forced white gap before Footer

---

## Quality

- `npm run build` — pass
- `npm run test` — 314/314 pass
- `pr-j1-html-validation.ts` — 24/24 + 4/4 + 4/4 pass
