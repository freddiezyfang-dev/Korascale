import {
	evaluateJourneyContentCompleteness,
	JOURNEY_PUBLISH_INTEGRITY_ERROR,
	type JourneyPublishCandidate,
	type JourneyPublishIntegrityResult,
	validateJourneyPublishReadiness,
} from './journeyPublishIntegrity';
import {
	findJourneySlugConflict,
	resolveCandidateComparisonSlug,
} from './journeySlugUniqueness.server';

export type JourneyPublishGateResult =
	| {
			ok: true;
			contentComplete: boolean;
			publishReady: boolean;
			errors: [];
			seoComplete: boolean;
	  }
	| {
			ok: false;
			status: 422;
			body: {
				error: typeof JOURNEY_PUBLISH_INTEGRITY_ERROR;
				message: string;
				fields: JourneyPublishIntegrityResult['errors'];
			};
	  };

export function buildPublishIntegrityFailureResponse(
	result: JourneyPublishIntegrityResult
): JourneyPublishGateResult {
	return {
		ok: false,
		status: 422,
		body: {
			error: JOURNEY_PUBLISH_INTEGRITY_ERROR,
			message: 'This Journey is not ready to publish.',
			fields: result.errors,
		},
	};
}

export async function runJourneyPublishIntegrityGate(
	candidate: JourneyPublishCandidate
): Promise<JourneyPublishGateResult> {
	const content = evaluateJourneyContentCompleteness(candidate);
	const seoComplete = content.contentComplete;

	if (candidate.status !== 'active') {
		return {
			ok: true,
			contentComplete: content.contentComplete,
			publishReady: false,
			errors: [],
			seoComplete,
		};
	}

	const comparisonSlug = resolveCandidateComparisonSlug(candidate);
	const slugConflict = comparisonSlug
		? await findJourneySlugConflict(comparisonSlug, candidate.id)
		: false;

	const readiness = validateJourneyPublishReadiness(candidate, { slugConflict });
	if (!readiness.publishReady) {
		return buildPublishIntegrityFailureResponse(readiness);
	}

	return {
		ok: true,
		contentComplete: readiness.contentComplete,
		publishReady: true,
		errors: [],
		seoComplete,
	};
}

export function nextResponseFromPublishGateFailure(
	gate: Extract<JourneyPublishGateResult, { ok: false }>
) {
	return gate.body;
}
