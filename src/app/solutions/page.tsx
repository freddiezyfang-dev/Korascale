import Link from 'next/link';
import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: 'Solutions - Korascale',
	description: 'Corporate travel, experiences, and healthcare access solutions in China.',
};

export default function SolutionsPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Solutions
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-3xl mx-auto">
						Tailored programs for organizations and individuals seeking exceptional travel and access in China.
					</Text>
					<ul className="max-w-xl mx-auto space-y-4 text-center">
						<li>
							<Link
								href="/solutions/corporate-travel-experiences"
								className="text-lg font-subheading font-semibold text-black underline underline-offset-4 hover:opacity-80"
							>
								Corporate Travel &amp; Experiences
							</Link>
						</li>
						<li>
							<Link
								href="/solutions/healthcare-access-china"
								className="text-lg font-subheading font-semibold text-black underline underline-offset-4 hover:opacity-80"
							>
								Healthcare Access in China
							</Link>
						</li>
					</ul>
				</Container>
			</Section>
		</main>
	);
}
