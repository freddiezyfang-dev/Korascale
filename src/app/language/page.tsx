import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: "Language Settings - Korascale Travel",
	description: "Change your language preference and access Korascale in your preferred language.",
};

export default function LanguagePage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Language Settings
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						Choose your preferred language for browsing and booking.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-3xl mx-auto space-y-8">
						<div>
							<Heading level={2} className="mb-4">
								Available Languages
							</Heading>
							<Text className="mb-4">
								Our website and services are available in the following languages:
							</Text>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>English</li>
								<li>中文 (Chinese)</li>
								<li>Deutsch (German)</li>
							</ul>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								How to Change Language
							</Heading>
							<Text className="mb-4">
								You can change your language preference using the language selector in the website header or footer. Your preference will be saved for future visits.
							</Text>
						</div>

						<div>
							<Heading level={2} className="mb-4">
								Multilingual Support
							</Heading>
							<Text>
								Our travel consultants are multilingual and can assist you in your preferred language. Contact us to speak with a consultant in your language.
							</Text>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}


