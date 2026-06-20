import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
describe('public registration guard (PR-C5)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PUBLIC_REGISTRATION_ENABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults to disabled when PUBLIC_REGISTRATION_ENABLED is unset', async () => {
    const { isPublicRegistrationEnabled } = await import('./publicRegistration');
    expect(isPublicRegistrationEnabled()).toBe(false);
  });

  it('defaults to disabled for non-true values', async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = 'false';
    const { isPublicRegistrationEnabled } = await import('./publicRegistration');
    expect(isPublicRegistrationEnabled()).toBe(false);
  });

  it('enables only when PUBLIC_REGISTRATION_ENABLED=true', async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = 'true';
    const { isPublicRegistrationEnabled } = await import('./publicRegistration');
    expect(isPublicRegistrationEnabled()).toBe(true);
  });
});

describe('deployment env guard (PR-C5)', () => {
  it('does not document PUBLIC_REGISTRATION_ENABLED=true in env.example', () => {
    const envExample = readFileSync(path.join(root, 'env.example.txt'), 'utf8');
    const assignmentLines = envExample
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('PUBLIC_REGISTRATION_ENABLED='));
    expect(assignmentLines.every((line) => !/=\s*true\s*$/i.test(line))).toBe(true);
    expect(envExample).toContain('PUBLIC_REGISTRATION_ENABLED');
  });

  it('does not set PUBLIC_REGISTRATION_ENABLED in vercel.json', () => {
    const vercelConfig = readFileSync(path.join(root, 'vercel.json'), 'utf8');
    expect(vercelConfig).not.toMatch(/PUBLIC_REGISTRATION_ENABLED/i);
  });
});
