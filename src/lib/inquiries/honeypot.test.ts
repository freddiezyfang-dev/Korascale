import { describe, expect, it } from 'vitest';

import {
  buildHoneypotSuccessResponse,
  INQUIRY_HONEYPOT_FIELD,
  isHoneypotTriggered,
  stripHoneypotField,
} from './honeypot';

describe('inquiry honeypot', () => {
  it('detects filled honeypot field', () => {
    expect(isHoneypotTriggered({ [INQUIRY_HONEYPOT_FIELD]: 'https://spam.example' })).toBe(true);
  });

  it('ignores empty honeypot field', () => {
    expect(isHoneypotTriggered({ [INQUIRY_HONEYPOT_FIELD]: '   ' })).toBe(false);
    expect(isHoneypotTriggered({ name: 'Jane' })).toBe(false);
  });

  it('strips honeypot before validation', () => {
    const body = {
      [INQUIRY_HONEYPOT_FIELD]: '',
      intent: 'general_contact',
      name: 'Jane',
    };
    expect(stripHoneypotField(body)).toEqual({
      intent: 'general_contact',
      name: 'Jane',
    });
  });

  it('returns a plausible success payload without persisting', () => {
    const response = buildHoneypotSuccessResponse();
    expect(response.success).toBe(true);
    expect(response.notificationStatus).toBe('skipped');
    expect(response.submissionId).toMatch(/^KS-\d{8}-[A-Z0-9]{6}$/);
  });
});
