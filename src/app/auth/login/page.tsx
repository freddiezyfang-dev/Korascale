import { Container, Section, Heading, Text, Button, Card } from '@/components/common';

export const metadata = {
	title: "Login - Korascale",
	description: "Access your travel account to manage your bookings and preferences.",
};

export default function LoginPage() {
	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="sm">
					<div className="text-center mb-8">
						<Heading level={1} className="mb-4">
							Welcome Back
						</Heading>
						<Text size="lg">
							Sign in to your account to continue your journey
						</Text>
					</div>

					<Card className="p-8">
						<form className="space-y-6">
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
									placeholder="Enter your password"
								/>
							</div>

							<div className="flex items-center justify-between">
								<label className="flex items-center">
									<input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
									<span className="ml-2 text-sm text-gray-600">Remember me</span>
								</label>
								<a href="#" className="text-sm text-primary-600 hover:text-primary-500">
									Forgot password?
								</a>
							</div>

							<Button variant="primary" className="w-full">
								Sign In
							</Button>

							<div className="text-center">
								<Text className="text-gray-600">
                    Don&apos;t have an account?{' '}
									<a href="/auth/register" className="text-primary-600 hover:text-primary-500">
										Sign up here
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

