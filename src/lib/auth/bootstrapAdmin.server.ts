import { randomUUID } from 'node:crypto';

import type { Pool } from 'pg';

import { hashPassword } from './password.server';

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export function normalizeAdminEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function validateAdminPassword(password: string): string | null {
	if (!password || !password.trim()) {
		return 'Password cannot be empty';
	}
	if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
		return `Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`;
	}
	return null;
}

export function parseBootstrapCliArgs(argv: string[]): {
	email: string;
	allowProduction: boolean;
} {
	let email = '';
	let allowProduction = false;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--email' && argv[i + 1]) {
			email = argv[i + 1];
			i += 1;
			continue;
		}
		if (arg === '--allow-production') {
			allowProduction = true;
			continue;
		}
		if (arg === '--password' || arg.startsWith('--password=')) {
			throw new Error('Password must not be passed as a command-line argument');
		}
	}

	if (!email) {
		throw new Error('Usage: npm run auth:bootstrap-admin -- --email admin@example.com');
	}

	return { email: normalizeAdminEmail(email), allowProduction };
}

export type BootstrapAdminResult = {
	action: 'created' | 'updated';
	email: string;
	role: 'admin';
};

export async function bootstrapAdminUser(
	pool: Pool,
	email: string,
	password: string
): Promise<BootstrapAdminResult> {
	const normalizedEmail = normalizeAdminEmail(email);
	const passwordError = validateAdminPassword(password);
	if (passwordError) {
		throw new Error(passwordError);
	}

	const passwordHash = hashPassword(password);
	const client = await pool.connect();

	try {
		const existing = await client.query<{ id: string }>(
			`SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
			[normalizedEmail]
		);

		if (existing.rows.length === 0) {
			const userId = randomUUID();
			const displayName = normalizedEmail.split('@')[0] ?? 'Admin';
			await client.query(
				`INSERT INTO users (id, email, name, role, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, 'admin', $4, NOW(), NOW())`,
				[userId, normalizedEmail, displayName, passwordHash]
			);
			return { action: 'created', email: normalizedEmail, role: 'admin' };
		}

		await client.query(
			`UPDATE users
       SET password_hash = $1, role = 'admin', updated_at = NOW()
       WHERE id = $2`,
			[passwordHash, existing.rows[0].id]
		);
		return { action: 'updated', email: normalizedEmail, role: 'admin' };
	} finally {
		client.release();
	}
}
