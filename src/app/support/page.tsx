import Link from 'next/link';

import { Container, Section, Heading, Text } from '@/components/common';
import {
	CUSTOMER_SERVICE_EMAIL,
	WHATSAPP_NUMBER_DISPLAY,
	WHATSAPP_URL,
} from '@/lib/contactChannels';

export const metadata = {
	title: "Support - Korascale Travel",
	description: "Get help and support for your travel bookings and inquiries with Korascale.",
};

export default function SupportPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Support
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						We&apos;re here to help you with any questions or concerns about your travel experience.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-3xl mx-auto space-y-8">
						<div>
							<Heading level={2} className="mb-4">
								Need Help?
							</Heading>
							<Text>
								Our team is available to assist you with booking inquiries, travel planning, and any
								issues you may encounter during your journey.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Contact Support
							</Heading>
							<Text className="mb-4">
								Email:{' '}
								<a
									href={`mailto:${CUSTOMER_SERVICE_EMAIL}`}
									className="text-primary-600 hover:underline"
								>
									{CUSTOMER_SERVICE_EMAIL}
								</a>
							</Text>
							<Text className="mb-4">
								WhatsApp:{' '}
								<a
									href={WHATSAPP_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary-600 hover:underline"
								>
									{WHATSAPP_NUMBER_DISPLAY}
								</a>
							</Text>
							<Text className="mb-4">
								<Link href="/contact" className="text-primary-600 hover:underline">
									View all contact options
								</Link>
							</Text>
							<Text>
								Business Hours: Monday - Friday, 9:00 AM - 6:00 PM (CST)
							</Text>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}
