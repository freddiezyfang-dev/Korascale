import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: "Currency Settings - Korascale Travel",
	description: "Change your currency preference and view prices in your preferred currency.",
};

export default function CurrencyPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Currency Settings
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						Select your preferred currency for viewing prices and making payments.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-3xl mx-auto space-y-8">
						<div>
							<Heading level={2} className="mb-4">
								Supported Currencies
							</Heading>
							<Text className="mb-4">
								We support the following currencies:
							</Text>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>USD (US Dollar) - Default</li>
								<li>CNY (Chinese Yuan)</li>
								<li>EUR (Euro)</li>
								<li>GBP (British Pound)</li>
							</ul>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								How to Change Currency
							</Heading>
							<Text className="mb-4">
								You can change your currency preference using the currency selector in the website header or footer. Prices will be converted using current exchange rates.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Exchange Rates
							</Heading>
							<Text>
								Currency conversion rates are updated regularly and are for reference only. Final payment will be processed in the currency you select, and your bank may apply additional conversion fees.
							</Text>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}


