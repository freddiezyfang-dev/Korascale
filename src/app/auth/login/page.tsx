'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useUser();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);
		
		try {
			const success = await login(email, password);
			if (success) {
				// 登录成功后重定向到首页
				router.push('/');
			} else {
				setError('Invalid email or password');
			}
		} catch (error) {
			setError('Login failed. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

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
						{error && (
							<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
								{error}
							</div>
						)}
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email Address
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="your.email@example.com"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Password
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="Enter your password"
									required
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

							<Button 
								type="submit" 
								variant="primary" 
								className="w-full"
								disabled={isLoading}
							>
								{isLoading ? 'Signing In...' : 'Sign In'}
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

