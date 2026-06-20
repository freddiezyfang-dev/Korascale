import { describe, expect, it } from 'vitest';

import {
  buildArticleInquiryContext,
  buildCorporateVisitContext,
  buildCustomJourneyContext,
  buildGeneralContactContext,
  EMPTY_INQUIRY_FORM_VALUES,
  getInquiryFormConfig,
  resolveArticleInquiryIntent,
  resolveArticleSourceCta,
} from './inquiryFormConfig';
import {
  buildInquiryPayload,
  shouldBlockDuplicateSubmit,
  shouldShowInquirySuccess,
  validateInquiryFormValues,
} from './inquiryFormLogic';

describe('inquiryFormConfig', () => {
  it('builds corporate hero and bottom contexts with the same form intent', () => {
    const hero = buildCorporateVisitContext('corporate_hero');
    const bottom = buildCorporateVisitContext('corporate_bottom');

    expect(hero.intent).toBe('corporate_visit');
    expect(bottom.intent).toBe('corporate_visit');
    expect(hero.sourceContext?.sourceCta).toBe('corporate_hero');
    expect(bottom.sourceContext?.sourceCta).toBe('corporate_bottom');
    expect(hero.sourcePage).toBe('/solutions/corporate-travel');
  });

  it('maps article CTAs to custom or corporate intents', () => {
    expect(resolveArticleInquiryIntent('private_journey')).toBe('custom_journey');
    expect(resolveArticleInquiryIntent('corporate_travel')).toBe('corporate_visit');
    expect(
      resolveArticleInquiryIntent('auto', 'business-travel-bleisure-china')
    ).toBe('corporate_visit');
    expect(resolveArticleSourceCta('custom_journey')).toBe('start_planning');
    expect(resolveArticleSourceCta('corporate_visit')).toBe('discuss_your_visit');
  });

  it('builds article source tracking context', () => {
    const context = buildArticleInquiryContext({
      intent: 'custom_journey',
      sourcePage: '/inspirations/china-travel-planning/sample',
      articleSlug: 'sample',
      articleTitle: 'Sample Article',
      categorySlug: 'china-travel-planning',
      sourceCta: 'start_planning',
    });

    expect(context.sourceType).toBe('article');
    expect(context.sourceSlug).toBe('sample');
    expect(context.sourceContext).toEqual({
      sourceCta: 'start_planning',
      articleSlug: 'sample',
      articleTitle: 'Sample Article',
      category: 'china-travel-planning',
    });
  });

  it('builds general contact context', () => {
    expect(buildGeneralContactContext()).toEqual({
      intent: 'general_contact',
      sourceType: 'contact',
      sourcePage: '/contact',
      sourceContext: {},
    });
  });
});

describe('inquiryFormLogic payloads', () => {
  it('maps custom journey fields and omits empty details', () => {
    const config = getInquiryFormConfig('custom_journey');
    const payload = buildInquiryPayload({
      config,
      context: buildCustomJourneyContext({
        sourceType: 'article',
        sourcePage: '/inspirations/foo/bar',
        sourceSlug: 'bar',
        sourceContext: {
          sourceCta: 'start_planning',
          articleSlug: 'bar',
          articleTitle: 'Bar',
          category: 'china-travel-planning',
        },
      }),
      values: {
        ...EMPTY_INQUIRY_FORM_VALUES,
        name: 'Jane Doe',
        email: 'jane@example.com',
        travelDates: 'September 2026',
        destinations: '',
        message: 'Hello',
      },
    });

    expect(payload.intent).toBe('custom_journey');
    expect(payload.details).toEqual({ travelDates: 'September 2026' });
    expect(payload.details).not.toHaveProperty('destinations');
    expect(payload.message).toBe('Hello');
  });

  it('maps corporate visit fields including requiredServices', () => {
    const config = getInquiryFormConfig('corporate_visit');
    const payload = buildInquiryPayload({
      config,
      context: buildCorporateVisitContext('corporate_hero'),
      values: {
        ...EMPTY_INQUIRY_FORM_VALUES,
        name: 'Alex Chen',
        email: 'alex@company.com',
        company: 'Acme Ltd',
        requiredServices: ['airport_transfers', 'business_dinners'],
      },
    });

    expect(payload.intent).toBe('corporate_visit');
    expect(payload.sourceType).toBe('solution');
    expect(payload.details).toEqual({
      company: 'Acme Ltd',
      requiredServices: ['airport_transfers', 'business_dinners'],
    });
    expect(payload.sourceContext).toEqual({ sourceCta: 'corporate_hero' });
  });

  it('maps general contact subject into details', () => {
    const config = getInquiryFormConfig('general_contact');
    const payload = buildInquiryPayload({
      config,
      context: buildGeneralContactContext(),
      values: {
        ...EMPTY_INQUIRY_FORM_VALUES,
        name: 'Sam',
        email: 'sam@example.com',
        subject: 'Partnership inquiry',
        message: 'Hello team',
      },
    });

    expect(payload.intent).toBe('general_contact');
    expect(payload.sourcePage).toBe('/contact');
    expect(payload.details).toEqual({ subject: 'Partnership inquiry' });
  });

  it('validates required fields', () => {
    const config = getInquiryFormConfig('general_contact');
    const errors = validateInquiryFormValues(EMPTY_INQUIRY_FORM_VALUES, config.requiredFields);
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.subject).toBeTruthy();
    expect(errors.message).toBeTruthy();
  });

  it('blocks duplicate submit while loading or after success', () => {
    const payload = buildInquiryPayload({
      config: getInquiryFormConfig('general_contact'),
      context: buildGeneralContactContext(),
      values: {
        ...EMPTY_INQUIRY_FORM_VALUES,
        name: 'Sam',
        email: 'sam@example.com',
        subject: 'Hi',
        message: 'Hello',
      },
    });

    expect(shouldBlockDuplicateSubmit(payload, null, true)).toBe(true);
    expect(shouldBlockDuplicateSubmit(payload, JSON.stringify(payload), false)).toBe(true);
    expect(shouldBlockDuplicateSubmit(payload, null, false)).toBe(false);
  });

  it('treats failed or skipped notifications as customer-visible success', () => {
    expect(shouldShowInquirySuccess('sent')).toBe(true);
    expect(shouldShowInquirySuccess('failed')).toBe(true);
    expect(shouldShowInquirySuccess('skipped')).toBe(true);
    expect(shouldShowInquirySuccess('pending')).toBe(false);
  });
});
