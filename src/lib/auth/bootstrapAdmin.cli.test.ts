import { describe, expect, it } from 'vitest';

import { parseBootstrapCliArgs } from './bootstrapAdmin.server';

describe('bootstrap-admin CLI args', () => {
	it('rejects plaintext password arguments', () => {
		expect(() =>
			parseBootstrapCliArgs(['--email', 'a@b.com', '--password', 'secret'])
		).toThrow(/must not be passed/i);
	});

	it('requires email argument', () => {
		expect(() => parseBootstrapCliArgs([])).toThrow(/Usage:/);
	});
});
