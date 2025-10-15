import { Container, Section, Heading, Text, Button } from '@/components/common';

export const metadata = {
	title: "Contact Us - Korascale",
	description: "Get in touch with our travel experts for personalized assistance and support.",
};

export default function ContactPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<Heading level={1} align="center" className="mb-8">
						Contact Us
					</Heading>
					<Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
						Ready to start your adventure? Our travel experts are here to help you plan the perfect journey.
					</Text>
				</Container>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
						{/* Contact Information */}
						<div>
							<Heading level={2} className="mb-8">
								Get in Touch
							</Heading>
							
							<div className="space-y-6">
								<div>
									<Heading level={3} className="mb-2">Email</Heading>
									<Text className="text-primary-600">info@korascale.com</Text>
								</div>
								
								<div>
									<Heading level={3} className="mb-2">Phone</Heading>
									<Text className="text-primary-600">+86 138 0000 0000</Text>
								</div>
								
								<div>
									<Heading level={3} className="mb-2">Address</Heading>
									<Text>
										Korascale Travel Co.<br />
										Beijing, China<br />
										100000
									</Text>
								</div>
								
								<div>
									<Heading level={3} className="mb-2">Business Hours</Heading>
									<Text>
										Monday - Friday: 9:00 AM - 6:00 PM<br />
										Saturday: 10:00 AM - 4:00 PM<br />
										Sunday: Closed
									</Text>
								</div>
							</div>
						</div>

						{/* Contact Form */}
						<div>
							<Heading level={2} className="mb-8">
								Send us a Message
							</Heading>
							
							<form className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											First Name
										</label>
										<input
											type="text"
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
											placeholder="Your first name"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Last Name
										</label>
										<input
											type="text"
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
											placeholder="Your last name"
										/>
									</div>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email
									</label>
									<input
										type="email"
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										placeholder="your.email@example.com"
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Subject
									</label>
									<input
										type="text"
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										placeholder="What can we help you with?"
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Message
									</label>
									<textarea
										rows={5}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										placeholder="Tell us about your travel plans or questions..."
									></textarea>
								</div>
								
								<Button variant="primary" className="w-full">
									Send Message
								</Button>
							</form>
						</div>
					</div>
				</Container>
			</Section>
		</main>
	);
}

