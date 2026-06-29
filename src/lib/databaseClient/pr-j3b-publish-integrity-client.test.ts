import { describe, expect, it } from 'vitest';

import {
	JourneyPublishIntegrityClientError,
	type JourneyPublishFieldError,
} from '@/lib/databaseClient';
import { JOURNEY_PUBLISH_INTEGRITY_ERROR } from '@/lib/journeyNormalization/journeyPublishIntegrity';

describe('PR-J3B admin client publish integrity errors', () => {
	it('maps 422 API payload to JourneyPublishIntegrityClientError for Admin UI', () => {
		const fields: JourneyPublishFieldError[] = [
			{ field: 'meta_description', code: 'REQUIRED', message: 'Meta description is required.' },
		];

		const error = new JourneyPublishIntegrityClientError(
			'This Journey is not ready to publish.',
			fields
		);

		expect(error.name).toBe('JourneyPublishIntegrityClientError');
		expect(error.message).toBe('This Journey is not ready to publish.');
		expect(error.fields[0]?.field).toBe('meta_description');
		expect(JOURNEY_PUBLISH_INTEGRITY_ERROR).toBe('JOURNEY_PUBLISH_INTEGRITY_FAILED');
	});
});
