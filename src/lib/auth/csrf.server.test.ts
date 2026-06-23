import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assertSameOriginForCookieWrite } from './csrf.server';

function createRequest(origin: string | null, host = 'localhost:3001') {
	const headers = new Headers();
	if (origin) headers.set('origin', origin);
	if (host) headers.set('host', host);
	return new NextRequest('http://localhost:3001/api/test', {
		method: 'POST',
		headers,
	});
}

describe('csrf.server', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.stubEnv('NODE_ENV', 'development');
		process.env = { ...originalEnv, NODE_ENV: 'development' };
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		process.env = originalEnv;
	});

	it('rejects write requests without Origin', () => {
		const response = assertSameOriginForCookieWrite(createRequest(null));
		expect(response).not.toBeNull();
		expect(response?.status).toBe(403);
	});

	it('allows matching localhost origin in development', () => {
		const response = assertSameOriginForCookieWrite(
			createRequest('http://localhost:3001', 'localhost:3001')
		);
		expect(response).toBeNull();
	});

	it('rejects arbitrary production origin', () => {
		vi.stubEnv('NODE_ENV', 'production');
		const response = assertSameOriginForCookieWrite(
			createRequest('https://evil.example', 'korascale.com')
		);
		expect(response).not.toBeNull();
		expect(response?.status).toBe(403);
	});

	it('allows configured site origin in production', () => {
		vi.stubEnv('NODE_ENV', 'production');
		process.env.NEXT_PUBLIC_SITE_URL = 'https://korascale.com';
		const response = assertSameOriginForCookieWrite(
			createRequest('https://korascale.com', 'korascale.com')
		);
		expect(response).toBeNull();
	});
});
