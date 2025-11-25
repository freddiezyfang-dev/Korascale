import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: "Privacy Policy - Korascale Travel",
	description: "Learn how Korascale protects and handles your personal information and data privacy.",
};

export default function PrivacyPolicyPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Privacy Policy
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						Your privacy is important to us. This policy explains how we collect, use, and protect your information.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-3xl mx-auto space-y-8">
						<div>
							<Heading level={2} className="mb-4">
								Information We Collect
							</Heading>
							<Text className="mb-4">
								We collect information you provide directly, such as name, email, phone number, and travel preferences when you book a journey or contact us.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								How We Use Your Information
							</Heading>
							<Text className="mb-4">
								We use your information to process bookings, communicate with you, improve our services, and send you relevant travel information and offers (with your consent).
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Data Protection
							</Heading>
							<Text className="mb-4">
								We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Your Rights
							</Heading>
							<Text className="mb-4">
								You have the right to access, update, or delete your personal information. You can also opt-out of marketing communications at any time.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Contact Us
							</Heading>
							<Text>
								For privacy-related questions, please contact us at <a href="mailto:privacy@korascale.com" className="text-primary-600 hover:underline">privacy@korascale.com</a>
							</Text>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}


