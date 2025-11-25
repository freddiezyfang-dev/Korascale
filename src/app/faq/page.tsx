import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: "Frequently Asked Questions - Korascale Travel",
	description: "Find answers to common questions about booking, travel, and services with Korascale.",
};

export default function FAQPage() {
	const faqs = [
		{
			question: "How do I book a journey?",
			answer: "You can browse our journeys on the Journeys page, select your preferred trip, and click 'Book Now' to start the booking process."
		},
		{
			question: "What payment methods do you accept?",
			answer: "We accept major credit cards, debit cards, and bank transfers. All transactions are secure and encrypted."
		},
		{
			question: "Can I cancel or modify my booking?",
			answer: "Yes, you can modify or cancel your booking according to our cancellation policy. Please contact our support team for assistance."
		},
		{
			question: "Do you offer travel insurance?",
			answer: "We recommend purchasing travel insurance for your journey. Our team can help you find suitable coverage options."
		},
		{
			question: "What languages do you support?",
			answer: "Our website and services are available in English, Chinese, and German. Our travel consultants are multilingual and can assist you in your preferred language."
		}
	];

	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Frequently Asked Questions
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						Find answers to the most common questions about our services and bookings.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-3xl mx-auto space-y-6">
						{faqs.map((faq, index) => (
							<div key={index} className="border-b border-gray-200 pb-6">
								<Heading level={3} className="mb-3">
									{faq.question}
								</Heading>
								<Text>
									{faq.answer}
								</Text>
							</div>
						))}
					</div>
				</Container>
			</Section>
		</main>
	);
}


