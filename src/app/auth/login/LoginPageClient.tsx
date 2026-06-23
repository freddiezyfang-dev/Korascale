'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';

function LoginForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { login, user } = useUser();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirect = searchParams.get('redirect');

	useEffect(() => {
		if (user) {
			if (redirect) {
				router.push(redirect);
			} else if (user.isAdmin) {
				router.push('/admin');
			} else {
				router.push('/');
			}
		}
	}, [user, redirect, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			const success = await login(email, password);
			if (success) {
				if (redirect) {
					router.push(redirect);
				} else {
					router.push('/admin');
				}
			} else {
				setError('Invalid email or password');
			}
		} catch {
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
							Sign In
						</Heading>
						<Text size="lg">
							For authorized team access. To plan a journey, use our inquiry forms — no account required.
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

							<Button
								type="submit"
								variant="primary"
								className="w-full"
								disabled={isLoading}
							>
								{isLoading ? 'Signing In...' : 'Sign In'}
							</Button>
						</form>

						<div className="mt-6 text-center space-y-2">
							<Text className="text-gray-600 text-sm">
								Looking to plan a trip?{' '}
								<Link href="/plan-your-journey" className="text-primary-600 hover:text-primary-500">
									Plan Your Journey
								</Link>{' '}
								or{' '}
								<Link href="/contact" className="text-primary-600 hover:text-primary-500">
									Contact KoraScale
								</Link>
								.
							</Text>
						</div>
					</Card>
				</Container>
			</Section>
		</main>
	);
}

export default function LoginPageClient() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-white">
					<Section background="primary" padding="xl">
						<Container size="sm">
							<div className="text-center">
								<Text>Loading...</Text>
							</div>
						</Container>
					</Section>
				</main>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
