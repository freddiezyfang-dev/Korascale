#!/usr/bin/env node

import { stdin as input, stdout as output } from 'node:process';

import { Pool } from 'pg';

import { bootstrapAdminUser, parseBootstrapCliArgs } from '../../src/lib/auth/bootstrapAdmin.server';
import { assertWritableDatabaseEnvironment } from '../../src/lib/auth/dbEnvironment';

function loadLocalEnv(): void {
	const fs = require('node:fs') as typeof import('node:fs');
	const path = require('node:path') as typeof import('node:path');

	for (const filename of ['.env.local', '.env']) {
		const filePath = path.join(process.cwd(), filename);
		if (!fs.existsSync(filePath)) continue;

		const content = fs.readFileSync(filePath, 'utf8');
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

async function readAllStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of input) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	return Buffer.concat(chunks).toString('utf8').trim();
}

async function readPasswordHidden(prompt: string): Promise<string> {
	if (!input.isTTY) {
		return readAllStdin();
	}

	output.write(prompt);
	input.setRawMode?.(true);
	input.resume();
	input.setEncoding('utf8');

	let password = '';
	return new Promise((resolve, reject) => {
		const onData = (char: string) => {
			switch (char) {
				case '\n':
				case '\r':
				case '\u0004':
					input.setRawMode?.(false);
					input.pause();
					input.removeListener('data', onData);
					output.write('\n');
					resolve(password);
					break;
				case '\u0003':
					reject(new Error('Cancelled'));
					break;
				case '\u007f':
					password = password.slice(0, -1);
					break;
				default:
					password += char;
					break;
			}
		};

		input.on('data', onData);
	});
}

async function readPasswordConfirmation(): Promise<string> {
	if (!input.isTTY) {
		const password = await readAllStdin();
		return password;
	}

	const password = await readPasswordHidden('Admin password (min 12 characters): ');
	const confirm = await readPasswordHidden('Confirm password: ');
	if (password !== confirm) {
		throw new Error('Passwords do not match');
	}
	return password;
}

async function main() {
	loadLocalEnv();
	const { email, allowProduction } = parseBootstrapCliArgs(process.argv.slice(2));
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	const dbEnv = assertWritableDatabaseEnvironment({
		connectionString,
		allowProduction,
	});

	const password = await readPasswordConfirmation();
	const pool = new Pool({
		connectionString,
		ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
	});

	try {
		const result = await bootstrapAdminUser(pool, email, password);
		console.log(
			JSON.stringify(
				{
					ok: true,
					action: result.action,
					email: result.email,
					role: result.role,
					database: dbEnv.sanitizedEndpoint,
				},
				null,
				2
			)
		);
	} finally {
		await pool.end();
	}
}

main().catch((error: Error) => {
	console.error(error.message || 'bootstrap-admin failed');
	process.exit(1);
});
