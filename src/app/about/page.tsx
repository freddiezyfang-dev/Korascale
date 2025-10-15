import { Container, Section, Heading, Text } from '@/components/common';

export const metadata = {
	title: "About Us - Korascale",
	description: "Learn about Korascale's mission to provide authentic travel experiences in China.",
};

export default function AboutPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						About Korascale
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-4xl mx-auto">
						We are passionate about creating authentic travel experiences that connect you with the heart and soul of China.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div>
							<Heading level={2} className="mb-6">
								Our Mission
							</Heading>
							<Text className="mb-6">
								At Korascale, we believe that travel should be more than just visiting places – it should be about experiencing cultures, 
								connecting with people, and creating memories that last a lifetime.
							</Text>
							<Text className="mb-6">
								We curate every aspect of your journey, from luxury accommodations to authentic local experiences, 
								ensuring that you discover the true essence of China.
							</Text>
						</div>
						<div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
							<Text className="text-gray-500">Team Photo Placeholder</Text>
						</div>
					</div>
				</Container>
			</Section>

			<Section background="tertiary" padding="xl">
				<Container size="xl">
					<div className="text-center">
						<Heading level={2} className="mb-8">
							Why Choose Korascale?
						</Heading>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							<div className="text-center">
								<div className="w-16 h-16 bg-primary-500 rounded-full mx-auto mb-4 flex items-center justify-center">
									<span className="text-white text-2xl">🏛️</span>
								</div>
								<Heading level={3} className="mb-4">Authentic Experiences</Heading>
								<Text>
									We partner with local experts to bring you genuine cultural experiences that go beyond typical tourist attractions.
								</Text>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-primary-500 rounded-full mx-auto mb-4 flex items-center justify-center">
									<span className="text-white text-2xl">⭐</span>
								</div>
								<Heading level={3} className="mb-4">Luxury Accommodations</Heading>
								<Text>
									From boutique hotels to traditional inns, we select only the finest accommodations that reflect local character.
								</Text>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-primary-500 rounded-full mx-auto mb-4 flex items-center justify-center">
									<span className="text-white text-2xl">🎯</span>
								</div>
								<Heading level={3} className="mb-4">Curated Journeys</Heading>
								<Text>
									Every itinerary is carefully crafted to provide a perfect balance of adventure, culture, and relaxation.
								</Text>
							</div>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}

