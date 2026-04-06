import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: 'Corporate Travel & Experiences - Korascale',
	description: 'Corporate travel and curated experiences in China.',
};

export default function CorporateTravelExperiencesPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Corporate Travel &amp; Experiences
					</Heading>
					<Text align="center" size="lg" className="max-w-3xl mx-auto">
						We design seamless corporate journeys and group experiences across China. Contact us to plan your next program.
					</Text>
				</Container>
			</Section>
		</main>
	);
}
