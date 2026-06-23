import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
	N: 16384,
	r: 8,
	p: 1,
	maxmem: 64 * 1024 * 1024,
} as const;

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS);
	return `scrypt$${salt}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
	if (!storedHash || !storedHash.startsWith('scrypt$')) {
		return false;
	}

	const parts = storedHash.split('$');
	if (parts.length !== 3) return false;

	const salt = parts[1];
	const expectedHex = parts[2];
	if (!salt || !expectedHex) return false;

	let expected: Buffer;
	try {
		expected = Buffer.from(expectedHex, 'hex');
	} catch {
		return false;
	}

	const actual = scryptSync(password, salt, expected.length, SCRYPT_OPTIONS);
	if (expected.length !== actual.length) return false;
	return timingSafeEqual(expected, actual);
}
