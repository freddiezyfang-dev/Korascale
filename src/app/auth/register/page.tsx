import { Container, Section, Heading, Text, Button, Card } from '@/components/common';

export const metadata = {
	title: "Register - Korascale",
	description: "Create your travel account to start planning your China adventure.",
};

export default function RegisterPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="sm">
					<div className="text-center mb-8">
						<Heading level={1} className="mb-4">
							Join Korascale
						</Heading>
						<Text size="lg">
							Create your account to start your China adventure
						</Text>
					</div>

					<Card className="p-8">
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
									Email Address
								</label>
								<input
									type="email"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="your.email@example.com"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Password
								</label>
								<input
									type="password"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="Create a strong password"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Confirm Password
								</label>
								<input
									type="password"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="Confirm your password"
								/>
							</div>

							<div className="flex items-center">
								<input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
								<span className="ml-2 text-sm text-gray-600">
									I agree to the{' '}
									<a href="#" className="text-primary-600 hover:text-primary-500">
										Terms of Service
									</a>{' '}
									and{' '}
									<a href="#" className="text-primary-600 hover:text-primary-500">
										Privacy Policy
									</a>
								</span>
							</div>

							<Button variant="primary" className="w-full">
								Create Account
							</Button>

							<div className="text-center">
								<Text className="text-gray-600">
									Already have an account?{' '}
									<a href="/auth/login" className="text-primary-600 hover:text-primary-500">
										Sign in here
									</a>
								</Text>
							</div>
						</form>
					</Card>
				</Container>
			</Section>
		</main>
	);
}

