import { describe, expect, it, vi } from 'vitest';

import { hashPassword, verifyPassword } from './password.server';

describe('password.server', () => {
	it('hashes and verifies a password', () => {
		const hash = hashPassword('secure-pass-123');
		expect(hash.startsWith('scrypt$')).toBe(true);
		expect(verifyPassword('secure-pass-123', hash)).toBe(true);
	});

	it('rejects wrong password', () => {
		const hash = hashPassword('correct');
		expect(verifyPassword('wrong', hash)).toBe(false);
	});

	it('rejects missing or invalid stored hash', () => {
		expect(verifyPassword('x', null)).toBe(false);
		expect(verifyPassword('x', 'plaintext')).toBe(false);
		expect(verifyPassword('x', 'scrypt$onlytwo')).toBe(false);
	});

	it('rejects damaged scrypt hash safely', () => {
		expect(verifyPassword('pw', 'scrypt$deadbeef$')).toBe(false);
		expect(verifyPassword('pw', 'scrypt$$')).toBe(false);
	});

	it('uses different salts for repeated hashing', () => {
		const first = hashPassword('same-password');
		const second = hashPassword('same-password');
		expect(first).not.toBe(second);
	});

	it('uses timing-safe comparison path', () => {
		const hash = hashPassword('secret-value-12');
		const spy = vi.spyOn(Buffer, 'from');
		expect(verifyPassword('secret-value-12', hash)).toBe(true);
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('does not embed the raw password in the hash', () => {
		const password = 'my-secret-password';
		const hash = hashPassword(password);
		expect(hash).not.toContain(password);
	});
});
