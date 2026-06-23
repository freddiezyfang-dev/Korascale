import type { NextRequest } from 'next/server';

import { invalidOriginResponse } from './authErrors';

const DEV_ALLOWED_HOSTS = new Set([
	'localhost:3000',
	'localhost:3001',
	'127.0.0.1:3000',
	'127.0.0.1:3001',
]);

function parseAllowedOrigins(): Set<string> {
	const configured = (process.env.ADMIN_ALLOWED_ORIGINS ?? '')
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean);

	const defaults = new Set<string>();
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL;
	if (siteUrl) {
		try {
			defaults.add(new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`).origin);
		} catch {
			// ignore invalid env URL
		}
	}
	for (const origin of configured) {
		defaults.add(origin);
	}
	return defaults;
}

function isDevHost(host: string | null): boolean {
	if (!host) return false;
	return DEV_ALLOWED_HOSTS.has(host.toLowerCase());
}

export function assertSameOriginForCookieWrite(request: NextRequest) {
	const origin = request.headers.get('origin');
	const host = request.headers.get('host');

	if (!origin) {
		// Non-browser clients without Origin are blocked for cookie-authenticated writes.
		return invalidOriginResponse();
	}

	let originHost: string;
	try {
		originHost = new URL(origin).host;
	} catch {
		return invalidOriginResponse();
	}

	if (process.env.NODE_ENV !== 'production' && isDevHost(originHost) && isDevHost(host)) {
		return null;
	}

	const allowed = parseAllowedOrigins();
	if (allowed.has(origin)) {
		return null;
	}

	if (host && originHost === host) {
		return null;
	}

	return invalidOriginResponse();
}
