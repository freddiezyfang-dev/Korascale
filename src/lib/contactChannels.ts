/** Primary customer-facing email (aligned with Contact page and plan-trip API fallback). */
export const CUSTOMER_SERVICE_EMAIL = 'customer-service@korascale.com';

export const CUSTOMER_SERVICE_MAILTO = `mailto:${CUSTOMER_SERVICE_EMAIL}`;

/** Business WhatsApp (aligned with Contact page). */
export const WHATSAPP_NUMBER_DISPLAY = '+86 155 5648 6995';

export const WHATSAPP_URL = 'https://wa.me/8615556486995';

export function buildMailtoHref(subject?: string): string {
	if (!subject) return CUSTOMER_SERVICE_MAILTO;
	return `mailto:${CUSTOMER_SERVICE_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
