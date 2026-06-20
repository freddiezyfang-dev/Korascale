/**
 * Server-side public registration guard (default deny).
 *
 * Anonymous POST /api/users writes (INSERT and UPDATE) are blocked unless
 * PUBLIC_REGISTRATION_ENABLED=true, which allows INSERT for new users only.
 *
 * Do not set PUBLIC_REGISTRATION_ENABLED=true on Vercel Preview or Production.
 */
export const PUBLIC_REGISTRATION_ENV = 'PUBLIC_REGISTRATION_ENABLED';

export function isPublicRegistrationEnabled(): boolean {
  return process.env[PUBLIC_REGISTRATION_ENV] === 'true';
}

export const PUBLIC_REGISTRATION_FORBIDDEN_MESSAGE =
  'Public registration is not available. Please contact us to request access.';

export function publicRegistrationForbiddenResponse() {
  return {
    error: PUBLIC_REGISTRATION_FORBIDDEN_MESSAGE,
  };
}
