# Tourism Page-End CTA Inventory

Audit date: 2026-06-26  
Scope: PR-CTA0 + PR-CTA1 — page-end major CTAs in tourism content only.

## Legend

| Action | Meaning |
|--------|---------|
| **Replace** | Replace with `TourismPageCta` in this PR |
| **Keep** | Do not change (Hero, B2B, Solutions, booking product block) |
| **Ignore** | Out of scope or not a page-end major CTA |

| Category | Meaning |
|----------|---------|
| 1 | Tourism page-end CTA |
| 2 | Hero CTA |
| 3 | Card CTA |
| 4 | Inline CTA |
| 5 | B2B-specific CTA |
| 6 | Modal trigger (non page-end) |

---

## Tourism routes

| Route | Current component | Position | Heading | Button | Action | Replace / Keep / Ignore | Cat |
|-------|-------------------|----------|---------|--------|--------|-------------------------|-----|
| `/journeys` | `JourneysPageClient` green Section | Page end | Plan your journey in China with Korascale | PLAN YOUR JOURNEY | `PlanTripModal` | **Replace** | 1 |
| `/journeys` | `JourneysPageClient` Hero card | Hero (top) | Plan your trip in China with Korascale | EXPLORE NOW | `PlanTripModal` | **Keep** | 2 |
| `/journeys/type/explore-together` | `JourneyTypePageClient` green Section | Page end | Plan your journey in China with Korascale | PLAN YOUR JOURNEY | `PlanTripModal` | **Replace** | 1 |
| `/journeys/type/deep-discovery` | Same as above | Page end | Same | Same | Same | **Replace** | 1 |
| `/journeys/type/signature-journeys` | Same as above | Page end | Same | Same | Same | **Replace** | 1 |
| `/journeys/type/group-tours` | `GroupToursLandingClient` mailto block | Page end | We are your on-ground execution system… | Speak to our team | `mailto:` | **Keep** | 5 |
| `/journeys/[slug]` | *(none — page-end tourism CTA missing)* | — | — | — | — | **Replace** (add `TourismPageCta`) | 1 |
| `/journeys/[slug]` | `InclusionsAndOffers` `#booking-section` | Mid-page product | Includes / Select Your Date | REQUEST THIS JOURNEY | `JourneyInquiryModal` | **Keep** | 6 |
| `/destinations` | `PlanningSectionNew` | Page end | Connect with our travel experts… | MAKE AN ENQUIRY | `PlanTripModal` | **Replace** | 1 |
| `/destinations/[region]` | `PlanningSectionNew` | Page end | Same | Same | Same | **Replace** | 1 |
| `/destinations/sichuan` | `PlanningSectionNew` | Page end | Same | Same | Same | **Replace** | 1 |
| `/inspirations` | `PlanningSectionNew` | Page end | Same | Same | Same | **Replace** | 1 |
| `/inspirations/[category]` | *(none)* | — | — | — | — | **Replace** (3 tourism categories only) | 1 |
| `/inspirations/business-travel-bleisure-china` | *(none)* | — | — | — | — | **Keep** (no generic tourism CTA added) | 5 |
| `/inspirations/[category]/[slug]` | `ArticlePrimaryCta` | Page end | Template by mode | Start Planning / Discuss… | `PlanTripModal` or Link | **Replace** (non-corporate only) | 1 |
| `/inspirations/.../corporate articles` | `ArticlePrimaryCta` corporate template | Page end | Plan Your Next China Business Visit | Discuss Your Visit | Corporate `PlanTripModal` | **Keep** | 5 |

---

## Out of scope (must remain diff-free)

| Route | Current component | Action | Cat |
|-------|-------------------|--------|-----|
| `/solutions` | Learn More links only | **Ignore** | 4 |
| `/solutions/corporate-travel` | `CorporateTravelInquiryButton` bottom | **Keep** | 5 |
| `/solutions/corporate-travel-experiences` | Text only | **Ignore** | — |
| `/solutions/healthcare-access-china` | mailto medical advisor | **Keep** | 5 |
| `/` homepage Hero | Video hero CTAs | **Keep** | 2 |
| `/places/[place]` | `PlanningSectionNew` | **Ignore** (not in PR scope) | 1 |
| Journey cards / article cards | View Journey / View more | **Keep** | 3 |

---

## Shared legacy component

| Component | Used by | PR action |
|-----------|---------|-----------|
| `PlanningSectionNew.tsx` | destinations, inspirations (not places in this PR) | Remains for `/places`; tourism routes switch to `TourismPageCta` |
| `PlanYourJourneyCtaSection.tsx` | *(deleted in prior branch work)* | Already removed |

---

## Replacement copy (TourismPageCta)

See `src/lib/tourismPageCtaContent.ts` for Journey, Destination, and Inspiration mappings.
