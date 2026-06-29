export type JourneyFieldReadSource =
	| 'column'
	| 'jsonb'
	| 'legacy_column'
	| 'fallback'
	| 'missing';

export type ResolvedJourneyField<T> = {
	value: T;
	source: JourneyFieldReadSource;
	path: string;
};
