export type DatabaseEnvironmentInfo = {
	host: string;
	database: string;
	isProductionLike: boolean;
	sanitizedEndpoint: string;
};

const PRODUCTION_HOST_PATTERNS = [
	/-prod[.-]/i,
	/production/i,
	/main\.neon/i,
	/ep-.*-main-/i,
];

const KNOWN_DEV_HOST_FRAGMENTS = ['ep-morning-bird-adrx3dvv'];

export function parseDatabaseEnvironment(
	connectionString: string | undefined
): DatabaseEnvironmentInfo | null {
	if (!connectionString?.trim()) return null;

	try {
		const url = new URL(connectionString);
		const host = url.hostname.toLowerCase();
		const database = url.pathname.replace(/^\//, '') || 'unknown';
		const vercelEnv = process.env.VERCEL_ENV;
		const isProductionLike =
			vercelEnv === 'production' ||
			process.env.NODE_ENV === 'production' ||
			PRODUCTION_HOST_PATTERNS.some((pattern) => pattern.test(host)) ||
			(host.includes('neon.tech') &&
				!KNOWN_DEV_HOST_FRAGMENTS.some((fragment) => host.includes(fragment)) &&
				!process.env.ADMIN_BOOTSTRAP_ALLOWED_HOST?.split(',').some((h) => host.includes(h.trim())));

		return {
			host,
			database,
			isProductionLike,
			sanitizedEndpoint: `${host}/${database}`,
		};
	} catch {
		return null;
	}
}

export function assertWritableDatabaseEnvironment(options: {
	connectionString: string | undefined;
	allowProduction?: boolean;
}): DatabaseEnvironmentInfo {
	const env = parseDatabaseEnvironment(options.connectionString);
	if (!env) {
		throw new Error('Unable to identify database environment from connection URL');
	}

	if (env.isProductionLike && !options.allowProduction) {
		throw new Error(
			`Refusing to write: database endpoint appears to be production (${env.sanitizedEndpoint}). Pass --allow-production to override.`
		);
	}

	return env;
}
