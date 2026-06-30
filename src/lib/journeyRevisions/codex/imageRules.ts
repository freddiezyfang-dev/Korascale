const ALLOWED_IMAGE_PREFIXES = [
	'/images/',
	'/uploads/',
	'https://www.korascale.com/',
	'https://korascale.com/',
	'https://',
	'http://',
];

export type ImageValidationResult = {
	errors: Array<{ field: string; message: string; code: string }>;
	assetUploadRequired: boolean;
};

function isSuspiciousLocalPath(value: string): boolean {
	const v = value.trim();
	if (!v) return false;
	if (v.startsWith('file://')) return true;
	if (v.startsWith('/Users/') || v.startsWith('/tmp/') || v.startsWith('C:\\')) return true;
	if (v.startsWith('./') || v.startsWith('../')) return true;
	if (/\.(png|jpe?g|webp|gif)$/i.test(v) && !v.startsWith('/')) return true;
	return false;
}

function isAllowedImageUrl(value: string): boolean {
	const v = value.trim();
	if (!v) return true;
	if (isSuspiciousLocalPath(v)) return false;
	return ALLOWED_IMAGE_PREFIXES.some((prefix) => v.startsWith(prefix));
}

function collectImageStrings(value: unknown, path: string, out: Array<{ path: string; value: string }>): void {
	if (typeof value === 'string') {
		if (/image|hero|gallery|photo|thumbnail/i.test(path) || path.endsWith('.url')) {
			out.push({ path, value });
		}
		return;
	}
	if (Array.isArray(value)) {
		value.forEach((item, index) => collectImageStrings(item, `${path}[${index}]`, out));
		return;
	}
	if (value && typeof value === 'object') {
		for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
			const next = path ? `${path}.${key}` : key;
			if (/image|hero|gallery|photo|url/i.test(key)) {
				if (typeof child === 'string') out.push({ path: next, value: child });
			}
			collectImageStrings(child, next, out);
		}
	}
}

export function validateImageUrlsInChanges(changes: Record<string, unknown>): ImageValidationResult {
	const errors: ImageValidationResult['errors'] = [];
	let assetUploadRequired = false;

	const candidates: Array<{ path: string; value: string }> = [];
	for (const key of ['hero_image_url', 'heroImage', 'image', 'heroImage']) {
		if (typeof changes[key] === 'string') {
			candidates.push({ path: key, value: changes[key] as string });
		}
	}
	if (changes.data && typeof changes.data === 'object') {
		collectImageStrings(changes.data, 'data', candidates);
	}

	for (const { path, value } of candidates) {
		if (!value.trim()) continue;
		if (isSuspiciousLocalPath(value)) {
			errors.push({
				field: path,
				code: 'ASSET_UPLOAD_REQUIRED',
				message: 'Local or invented image paths are not allowed. Upload asset in J5D first.',
			});
			assetUploadRequired = true;
			continue;
		}
		if (!isAllowedImageUrl(value)) {
			errors.push({
				field: path,
				code: 'ASSET_UPLOAD_REQUIRED',
				message: 'Image URL must be an existing confirmed asset URL.',
			});
			assetUploadRequired = true;
		}
	}

	return { errors, assetUploadRequired };
}
