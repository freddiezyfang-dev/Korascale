/** Sentinel href for CTAs that open PlanTripModal instead of navigating away. */
export const PLAN_TRIP_CTA_HREF = '#plan-your-journey';

export function isPlanTripCtaHref(href: string): boolean {
	return href.trim() === PLAN_TRIP_CTA_HREF;
}
