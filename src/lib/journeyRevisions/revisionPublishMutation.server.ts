import type { JourneyMutationOptions } from '@/lib/journeyNormalization/journeyAdminMutation.server';

/** Journey Revision publish always dual-writes normalized columns (J5C2). */
export const REVISION_PUBLISH_MUTATION_OPTIONS: JourneyMutationOptions = {
	normalizedColumnWritePolicy: 'always',
};
