import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSrc(relativePath: string): string {
  return readFileSync(path.join(root, 'src', relativePath), 'utf8');
}

describe('public navigation (PR-C5)', () => {
  it('does not expose sign in, register, account, or wishlist in Header', () => {
    const source = readSrc('components/layout/Header.tsx');
    expect(source).not.toMatch(/Sign In|Sign in|Register|UserDropdown|openLoginModal|useLoginModal|Wishlist|wishlist/i);
  });

  it('does not expose login, register, account, or wishlist in desktop NavMenu', () => {
    const source = readSrc('components/layout/NavMenu.tsx');
    expect(source).not.toMatch(/Sign in|Log in|Register|openLoginModal|useLoginModal|Wishlist|wishlist/i);
    expect(source).not.toMatch(/Plan Your Journey|\/plan-your-journey/i);
  });

  it('keeps Contact and Plan Your Journey in mobile sidebar', () => {
    const source = readSrc('components/layout/NavSidebar.tsx');
    expect(source).toContain('/contact');
    expect(source).toContain('/plan-your-journey');
    expect(source).toContain('Plan Your Journey');
    expect(source).not.toMatch(/Wishlist|wishlist|Sign in|Register/i);
  });
});

describe('register invitation-only page (PR-C5)', () => {
  it('does not render a registration form or call register API', () => {
    const source = readSrc('app/auth/register/page.tsx');
    expect(source).toContain('Client Access Is Available by Invitation');
    expect(source).toContain('/plan-your-journey');
    expect(source).toContain('/contact');
    expect(source).not.toMatch(/useUser|register\(|Create Account|confirmPassword/i);
    expect(source).toMatch(/index:\s*false/);
  });
});

describe('wishlist redirects (PR-C5)', () => {
  it('redirects /wishlist to /journeys', () => {
    const source = readFileSync(path.join(root, 'next.config.ts'), 'utf8');
    expect(source).toContain("source: '/wishlist'");
    expect(source).toContain("destination: '/journeys'");
    expect(source).toContain('permanent: true');
  });
});

describe('Journey inquiry regression (PR-C5)', () => {
  it('does not gate Journey detail with LoginModal', () => {
    const source = readSrc('app/journeys/[...slug]/ClientJourneyPage.tsx');
    expect(source).not.toMatch(/LoginModal|openLoginModal|handleBookNow|\/auth\/login/i);
    expect(source).toContain('JourneyInquiryModal');
  });
});

describe('registration API guard wiring (PR-C5)', () => {
  it('blocks new user inserts by default in POST /api/users', () => {
    const source = readSrc('app/api/users/route.ts');
    expect(source).toContain('isPublicRegistrationEnabled');
    expect(source).toContain('publicRegistrationForbiddenResponse');
    expect(source).toMatch(/status:\s*403/);
    expect(source).not.toMatch(/UPDATE users/);
  });

  it('routes UserContext.register through POST /api/users', () => {
    const source = readSrc('context/UserContext.tsx');
    expect(source).toContain("fetch('/api/users'");
    expect(source).not.toMatch(/User registered successfully/i);
  });

  it('keeps client login flow available for admin access', () => {
    const source = readSrc('context/UserContext.tsx');
    expect(source).toContain('const login = async');
    expect(source).toContain('admin@korascale.com');
    expect(source).not.toMatch(/register.*login|login.*register/i);
  });
});

describe('legacy booking route redirects (PR-C5)', () => {
  it('redirects legacy booking pages away from checkout semantics', () => {
    const config = readFileSync(path.join(root, 'next.config.ts'), 'utf8');
    expect(config).toContain("source: '/booking/cart'");
    expect(config).toContain("source: '/booking/confirm'");
    expect(config).toContain("source: '/booking/success'");
    expect(config).toContain("destination: '/journeys'");
    expect(config).toContain("source: '/booking/accommodation'");
    expect(config).toContain("destination: '/accommodations'");
  });

  it('uses journey redirects for dynamic booking slug pages', () => {
    const source = readSrc('app/booking/[slug]/page.tsx');
    expect(source).toContain('legacyBookingSlugToJourneyPath');
    expect(source).toContain('redirect(');
    expect(source).not.toMatch(/Confirm Your Booking|Review Your Booking|payment/i);
  });

  it('keeps checkout as an informational page without payment flow', () => {
    const source = readSrc('app/checkout/page.tsx');
    expect(source).toContain('Online Checkout Unavailable');
    expect(source).not.toMatch(/stripe|confirm booking|<form|checkout.*submit/i);
  });

  it('marks checkout as noindex', () => {
    const source = readSrc('app/checkout/page.tsx');
    expect(source).toMatch(/index:\s*false/);
    expect(source).toMatch(/follow:\s*false/);
  });
});

describe('admin auth regression (PR-C5)', () => {
  it('provides dedicated admin logout in layout', () => {
    const source = readSrc('app/admin/layout.tsx');
    expect(source).toContain('handleLogout');
    expect(source).toContain("router.replace('/auth/login')");
    expect(source).toContain('logout()');
  });

  it('redirects admin login to /admin for admin email', () => {
    const source = readSrc('app/auth/login/LoginPageClient.tsx');
    expect(source).toContain("user.email === 'admin@korascale.com'");
    expect(source).toContain("router.push('/admin')");
    expect(source).not.toMatch(/Sign up|Register|\/auth\/register/i);
  });

  it('guards admin dashboard behind login', () => {
    const source = readSrc('app/admin/page.tsx');
    expect(source).toContain("router.push('/auth/login')");
    expect(source).toContain('admin@korascale.com');
  });
});

describe('auth and sitemap SEO (PR-C5)', () => {
  it('marks auth pages as noindex', () => {
    const login = readSrc('app/auth/login/page.tsx');
    const register = readSrc('app/auth/register/page.tsx');
    expect(login).toMatch(/index:\s*false/);
    expect(register).toMatch(/index:\s*false/);
  });

  it('does not include auth or wishlist paths in sitemap allowlist', () => {
    const source = readSrc('lib/journeySitemap.server.ts');
    expect(source).not.toMatch(/\/auth|wishlist/i);
  });
});

describe('removed provider runtime usage (PR-C5)', () => {
  const runtimePaths = [
    'app/layout.tsx',
    'components/layout/Header.tsx',
    'components/layout/NavMenu.tsx',
    'components/layout/NavSidebar.tsx',
    'app/journeys/[...slug]/ClientJourneyPage.tsx',
    'components/modals/HotelDetailModal.tsx',
    'app/booking/[slug]/page.tsx',
    'app/booking/cart/page.tsx',
    'app/booking/review/page.tsx',
    'app/booking/accommodation/page.tsx',
    'app/checkout/page.tsx',
  ];

  const forbiddenPatterns =
    /useLoginModal|openLoginModal|LoginModalProvider|WishlistProvider|useWishlist|WishlistSidebar|UserDropdown/;

  it.each(runtimePaths)('%s does not reference removed providers or account UI', (relativePath) => {
    const source = readSrc(relativePath);
    expect(source).not.toMatch(forbiddenPatterns);
  });

  it('does not mount LoginModalProvider or WishlistProvider in root layout', () => {
    const source = readSrc('app/layout.tsx');
    expect(source).not.toMatch(/LoginModalProvider|WishlistProvider/);
  });
});
