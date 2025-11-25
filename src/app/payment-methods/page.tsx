import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: "Payment Methods - Korascale Travel",
	description: "Learn about accepted payment methods and secure payment options for your travel bookings.",
};

export default function PaymentMethodsPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Payment Methods
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						We offer secure and convenient payment options for your travel bookings.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-3xl mx-auto space-y-8">
						<div>
							<Heading level={2} className="mb-4">
								Accepted Payment Methods
							</Heading>
							<Text className="mb-4">
								We accept the following payment methods:
							</Text>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Major credit cards (Visa, Mastercard, American Express)</li>
								<li>Debit cards</li>
								<li>Bank transfers</li>
								<li>PayPal (where available)</li>
							</ul>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Secure Payment
							</Heading>
							<Text className="mb-4">
								All transactions are processed through secure, encrypted payment gateways. We never store your full credit card information on our servers.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Payment Schedule
							</Heading>
							<Text className="mb-4">
								Payment terms vary by journey type. Some bookings may require a deposit, with the balance due before travel. Details will be provided in your booking confirmation.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Currency
							</Heading>
							<Text>
								Prices are displayed in USD by default. You can change the currency preference in your account settings or during checkout.
							</Text>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}


