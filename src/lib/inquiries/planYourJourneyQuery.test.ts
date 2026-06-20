import { describe, expect, it } from 'vitest';

import { parsePlanYourJourneyQuery } from './planYourJourneyQuery';

describe('parsePlanYourJourneyQuery', () => {
  it('defaults to direct custom journey context', () => {
    expect(parsePlanYourJourneyQuery({})).toEqual({
      intent: 'custom_journey',
      sourceType: 'direct',
      sourcePage: '/plan-your-journey',
      sourceSlug: null,
      sourceContext: {},
    });
  });

  it('accepts limited article query params', () => {
    expect(
      parsePlanYourJourneyQuery({
        intent: 'custom_journey',
        source: 'article',
        slug: 'shanghai-weekend-guide',
      })
    ).toEqual({
      intent: 'custom_journey',
      sourceType: 'article',
      sourcePage: '/plan-your-journey',
      sourceSlug: 'shanghai-weekend-guide',
      sourceContext: { articleSlug: 'shanghai-weekend-guide' },
    });
  });

  it('rejects unsafe query values', () => {
    expect(
      parsePlanYourJourneyQuery({
        intent: 'corporate_visit',
        source: 'contact',
        slug: '../../../etc/passwd',
        status: 'SENT',
        notificationStatus: 'sent',
        email: 'attacker@evil.com',
      })
    ).toEqual({
      intent: 'custom_journey',
      sourceType: 'direct',
      sourcePage: '/plan-your-journey',
      sourceSlug: null,
      sourceContext: {},
    });
  });
});
