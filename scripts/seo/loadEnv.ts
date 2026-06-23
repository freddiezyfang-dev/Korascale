import fs from 'node:fs';
import path from 'node:path';

export function loadLocalEnv(): void {
	const candidatePaths = [
		path.join(process.cwd(), '.env.local'),
		path.join(process.cwd(), '.env'),
	];

	for (const envPath of candidatePaths) {
		if (!fs.existsSync(envPath)) continue;

		const content = fs.readFileSync(envPath, 'utf8');
		for (const line of content.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const idx = trimmed.indexOf('=');
			if (idx === -1) continue;
			const key = trimmed.slice(0, idx).trim();
			let value = trimmed.slice(idx + 1).trim();
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			if (!(key in process.env)) {
				process.env[key] = value;
			}
		}
		return;
	}
}

export function requireDatabaseEnv(): void {
	if (!process.env.NEON_POSTGRES_URL && !process.env.POSTGRES_URL) {
		console.error(
			'Error: Database is not configured. Set POSTGRES_URL or NEON_POSTGRES_URL in .env.local.'
		);
		process.exit(1);
	}
}

export function getCreatedBy(): string {
	const createdBy = (process.env.SEO_REVISION_CREATED_BY ?? 'codex').trim();
	if (!createdBy) {
		console.error('Error: SEO_REVISION_CREATED_BY must not be empty.');
		process.exit(1);
	}
	return createdBy;
}

export function parseArgs(argv: string[]): Record<string, string | boolean> {
	const args: Record<string, string | boolean> = {};
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token === '--dry-run') {
			args['dry-run'] = true;
			continue;
		}
		if (token.startsWith('--') && argv[i + 1] && !argv[i + 1].startsWith('--')) {
			args[token.slice(2)] = argv[i + 1];
			i++;
		}
	}
	return args;
}
