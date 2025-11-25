import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: "Terms and Conditions - Korascale Travel",
	description: "Read our terms and conditions for booking and using Korascale travel services.",
};

export default function TermsAndConditionsPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Terms and Conditions
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						Please read these terms carefully before using our services.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-3xl mx-auto space-y-8">
						<div>
							<Heading level={2} className="mb-4">
								Booking Terms
							</Heading>
							<Text className="mb-4">
								By booking a journey with Korascale, you agree to these terms and conditions. All bookings are subject to availability and confirmation.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Cancellation Policy
							</Heading>
							<Text className="mb-4">
								Cancellation policies vary by journey type and booking date. Please refer to your booking confirmation for specific cancellation terms.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Payment Terms
							</Heading>
							<Text className="mb-4">
								Full payment may be required at the time of booking or according to the payment schedule specified in your booking confirmation.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Liability
							</Heading>
							<Text className="mb-4">
								Korascale acts as an agent for travel services. We are not liable for the acts, errors, omissions, or negligence of third-party service providers.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Contact
							</Heading>
							<Text>
								For questions about these terms, please contact us at <a href="mailto:legal@korascale.com" className="text-primary-600 hover:underline">legal@korascale.com</a>
							</Text>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}


