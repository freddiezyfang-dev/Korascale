'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
		agreeToTerms: false,
	});
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { register } = useUser();
	const router = useRouter();

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
		setError(''); // Clear error when user starts typing
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		// Validation
		if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
			setError('Please fill in all required fields');
			setIsLoading(false);
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			setIsLoading(false);
			return;
		}

		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters long');
			setIsLoading(false);
			return;
		}

		if (!formData.agreeToTerms) {
			setError('Please agree to the Terms of Service and Privacy Policy');
			setIsLoading(false);
			return;
		}

		try {
			// Call register function
			const success = await register({
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				password: formData.password,
			});
			
			if (success) {
				// Registration successful, redirect to home
				router.push('/');
			} else {
				setError('Registration failed. Please try again.');
			}
		} catch (error) {
			console.error('Registration error:', error);
			setError('Registration failed. Please try again.');
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
							Join Korascale
						</Heading>
						<Text size="lg">
							Create your account to start your China adventure
						</Text>
					</div>

					<Card className="p-8">
						{error && (
							<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
								{error}
							</div>
						)}
						
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										First Name *
									</label>
									<input
										type="text"
										value={formData.firstName}
										onChange={(e) => handleInputChange('firstName', e.target.value)}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										placeholder="Your first name"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Last Name *
									</label>
									<input
										type="text"
										value={formData.lastName}
										onChange={(e) => handleInputChange('lastName', e.target.value)}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										placeholder="Your last name"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email Address *
								</label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="your.email@example.com"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Password *
								</label>
								<input
									type="password"
									value={formData.password}
									onChange={(e) => handleInputChange('password', e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="Create a strong password"
									required
									minLength={6}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Confirm Password *
								</label>
								<input
									type="password"
									value={formData.confirmPassword}
									onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="Confirm your password"
									required
								/>
							</div>

							<div className="flex items-center">
								<input 
									type="checkbox" 
									checked={formData.agreeToTerms}
									onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
									className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
								/>
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

							<Button 
								type="submit" 
								variant="primary" 
								className="w-full"
								disabled={isLoading}
							>
								{isLoading ? 'Creating Account...' : 'Create Account'}
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

