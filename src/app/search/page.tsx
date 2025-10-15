import { Container, Section, Heading, Text, Button, Card } from '@/components/common';

export const metadata = {
	title: "Search - Korascale",
	description: "Find destinations, journeys, and inspirations for your China adventure.",
};

export default function SearchPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<div className="text-center mb-12">
						<Heading level={1} className="mb-6">
							Search
						</Heading>
						<Text size="lg" className="mb-8">
							Find destinations, journeys, and inspirations for your China adventure
						</Text>
						
						{/* Search Bar */}
						<div className="max-w-2xl mx-auto">
							<div className="relative">
								<input
									type="text"
									className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="Search destinations, hotels, experiences..."
								/>
								<Button 
									variant="primary" 
									className="absolute right-2 top-2"
								>
									Search
								</Button>
							</div>
						</div>
					</div>

					{/* Search Filters */}
					<Card className="p-6 mb-8">
						<Heading level={2} className="mb-4">
							Filter Results
						</Heading>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Category
								</label>
								<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
									<option>All Categories</option>
									<option>Destinations</option>
									<option>Accommodations</option>
									<option>Journeys</option>
									<option>Inspirations</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Location
								</label>
								<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
									<option>All Locations</option>
									<option>Beijing</option>
									<option>Shanghai</option>
									<option>Chengdu</option>
									<option>Chongqing</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Price Range
								</label>
								<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
									<option>Any Price</option>
									<option>Under $100</option>
									<option>$100 - $300</option>
									<option>$300 - $500</option>
									<option>Over $500</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Sort By
								</label>
								<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
									<option>Relevance</option>
									<option>Price: Low to High</option>
									<option>Price: High to Low</option>
									<option>Rating</option>
									<option>Newest</option>
								</select>
							</div>
						</div>
					</Card>

					{/* Search Results */}
					<div className="space-y-6">
						<Heading level={2} className="mb-6">
							Search Results
						</Heading>
						
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{/* Placeholder for search results */}
							{[1, 2, 3, 4, 5, 6].map((item) => (
								<Card key={item} className="overflow-hidden group hover:shadow-xl transition-shadow">
									<div className="h-48 bg-gray-200 flex items-center justify-center">
										<Text className="text-gray-500">Search Result {item}</Text>
									</div>
									<div className="p-4">
										<Heading level={3} className="mb-2">
											Sample Result {item}
										</Heading>
										<Text className="text-gray-600 mb-4">
											This is a sample search result description.
										</Text>
										<Button variant="outline" size="sm">
											View Details
										</Button>
									</div>
								</Card>
							))}
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}

