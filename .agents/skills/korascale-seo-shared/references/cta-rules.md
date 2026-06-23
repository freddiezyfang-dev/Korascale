# CTA Rules

Page-level CTAs use `ctaConfig` (`ArticleCtaConfig`). Resolved at render time by `resolveArticleCta()` in `src/lib/articleCta.ts`.

## Modes

| Mode | When to use |
|------|-------------|
| `auto` | Default; template picked from category |
| `private_journey` | Leisure / planning articles |
| `corporate_travel` | Business travel category |
| `custom` | Fully custom copy and URLs; all required fields must be valid |
| `hidden` | No page-level CTA |

## Category-appropriate messaging

### China Travel Planning

- Explore China journeys
- Start planning a private journey
- Compare destination options

### Business Travel & Bleisure in China

- Discuss your China business travel requirements
- Plan post-event or post-visit arrangements
- Explore corporate travel support

### Destinations & Route Strategy

- Explore related regional journeys
- Compare route options
- Request a tailored itinerary

### Culture, Dining & Local Experiences

- Discover journeys featuring this experience
- Continue reading related cultural articles
- Add this experience to a private itinerary

## URL rules

- `primaryHref` / `secondaryHref` must start with `/`, `https://`, `http://`, or `mailto:`
- `#plan-your-journey` opens the plan-trip modal (`PLAN_TRIP_CTA_HREF`)
- Prefer real site paths: `/journeys`, `/solutions/corporate-travel`, `/plan-your-journey`

## Forbidden

- Same generic "Contact Us" on every article
- Corporate hosting CTA on culture/dining articles
- Pushing leisure sightseeing tours on business-travel articles
- Links to pages that do not exist

## Custom mode

When `mode` is `custom`, required: `heading`, `body`, `primaryLabel`, `primaryHref`. Secondary button needs both `secondaryLabel` and `secondaryHref`.
