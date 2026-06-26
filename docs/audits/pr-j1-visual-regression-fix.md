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

### Root cause

Multiple page wrappers used `min-h-screen`, forcing content containers to **at least viewport height** even when content was shorter. Footer sits outside these wrappers in root layout, so the extra height appeared as a large white gap above the black Footer.

**Affected wrappers:**

| File | Element |
|------|---------|
| `JourneysPageClient.tsx` | root `<div className="min-h-screen bg-white">` |
| `ClientJourneyPage.tsx` | root `<div className="min-h-screen bg-white">` |
| `ExploreTogetherLayout.tsx` | root `<div className="min-h-screen bg-white">` |
| `JourneyRouteSkeleton.tsx` | skeleton `min-h-screen` (also leaked into streamed HTML via `type/[type]/loading.tsx`) |

### Fix

- Removed `min-h-screen` from list, detail, and Explore Together root wrappers.
- Loading states use `min-h-[40vh]` only for centered spinners.
- Removed `journeys/type/[type]/loading.tsx` (streamed skeleton with `min-h-screen` into initial HTML).
- Reduced skeleton components to `bg-*` without viewport min-height.
- Group Tours B2B landing retains `min-h-screen` (intentional full-page design).

### Result

Content ends with normal section spacing → Footer (`data-testid="site-footer"`). No artificial 100vh padding on journey list/detail/type pages.

---

## Files changed

| Action | File |
|--------|------|
| Modified | `JourneyDetailServerSections.tsx` — JSON-LD only |
| Deleted | `JourneyTypeServerProductList.tsx` |
| Modified | `type/[type]/page.tsx` — client-only render |
| Modified | `JourneyTypePageClient.tsx` — initialJourneys sync, testids |
| Modified | `ClientJourneyPage.tsx`, `ExploreTogetherLayout.tsx`, `JourneysPageClient.tsx` — remove min-h-screen, journey-hero testid |
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
