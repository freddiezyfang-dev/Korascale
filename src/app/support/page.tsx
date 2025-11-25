import { Container, Section, Heading, Text } from '@/components/common';

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
						We're here to help you with any questions or concerns about your travel experience.
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
								Our support team is available to assist you with booking inquiries, travel planning, and any issues you may encounter during your journey.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Contact Support
							</Heading>
							<Text className="mb-4">
								Email: <a href="mailto:support@korascale.com" className="text-primary-600 hover:underline">support@korascale.com</a>
							</Text>
							<Text className="mb-4">
								Phone: <a href="tel:+8613800000000" className="text-primary-600 hover:underline">+86 138 0000 0000</a>
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


