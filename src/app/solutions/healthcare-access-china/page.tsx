import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: 'Healthcare Access in China - Korascale',
	description: 'Healthcare access and support for visitors and residents in China.',
};

export default function HealthcareAccessChinaPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Healthcare Access in China
					</Heading>
					<Text align="center" size="lg" className="max-w-3xl mx-auto">
						Navigate care with confidence. Reach out to learn how we can support your healthcare access needs in China.
					</Text>
				</Container>
			</Section>
		</main>
	);
}
