# Factual Safety

## Non-negotiable

Do not invent:

- Statistics or survey results
- Visa or immigration rules
- Government policies
- Prices or fees
- Opening hours
- Transport schedules or durations
- Named client cases or partnerships
- KoraScale service capabilities not documented elsewhere

## factCheckItems

When a claim cannot be verified from the export, catalog, or a source the user provides:

```json
{
  "item": "Verify 144-hour transit visa-free eligibility for [nationality/scenario]",
  "resolved": false,
  "note": "Policy changes frequently; needs official source before publish"
}
```

## Rules

- Do not delete fact-check reminders to pass validation.
- Unresolved items **still allow** dry-run and pending revision submission.
- Always list unresolved items in the verbal change summary.
- Skills must **never** auto-publish or mark revisions as published.

## FAQ triggers

Add fact-check items when FAQs cover policy, visa, transport timing, price, or opening hours unless a reliable current source is cited in the answer.
