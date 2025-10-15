'use client';

import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useOrders } from '@/context/OrderContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


export default function CheckoutPage() {
	const { user } = useUser();
	const { addOrder } = useOrders();
	const router = useRouter();
	const [isProcessing, setIsProcessing] = useState(false);

	const handleCompleteBooking = async () => {
		if (!user) {
			alert('Please log in to complete your booking');
			return;
		}

		setIsProcessing(true);
		
		try {
			// 模拟处理时间
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// 创建订单
			const orderId = addOrder({
				customerName: user.name,
				customerEmail: user.email,
				hotelId: 'hotel-1', // 从URL参数或状态获取
				hotelName: 'Chongqing Jiefangbei Walking Street Intercity Hotel',
				location: 'Jiefangbei Walking Street, Chongqing',
				checkIn: '2024-02-15',
				checkOut: '2024-02-18',
				adults: 2,
				children: 1,
				roomType: 'Intercity Deluxe King Room',
				totalPrice: 942,
				status: 'confirmed',
				paymentStatus: 'paid',
				specialRequests: 'High floor room preferred'
			});

			console.log('Order created successfully:', orderId);
			alert('Booking completed successfully! Your order has been confirmed.');
			router.push('/');
		} catch (error) {
			console.error('Error completing booking:', error);
			alert('There was an error processing your booking. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<main className="min-h-screen bg-white">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<div className="text-center mb-8">
						<Heading level={1} className="mb-4">
							Complete Your Booking
						</Heading>
						<Text size="lg">
							Secure your China adventure with our easy checkout process
						</Text>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Booking Summary */}
						<Card className="p-6">
							<Heading level={2} className="mb-6">
								Booking Summary
							</Heading>
							<div className="space-y-4">
								<div className="flex justify-between">
									<Text>Accommodation</Text>
									<Text className="font-semibold">$299/night</Text>
								</div>
								<div className="flex justify-between">
									<Text>Duration</Text>
									<Text>3 nights</Text>
								</div>
								<div className="flex justify-between">
									<Text>Taxes & Fees</Text>
									<Text>$45</Text>
								</div>
								<hr />
								<div className="flex justify-between text-lg font-bold">
									<Text>Total</Text>
									<Text>$942</Text>
								</div>
							</div>
						</Card>

						{/* Payment Form */}
						<Card className="p-6">
							<Heading level={2} className="mb-6">
								Payment Information
							</Heading>
							<form className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Card Number
									</label>
									<input
										type="text"
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										placeholder="1234 5678 9012 3456"
									/>
								</div>
								
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Expiry Date
										</label>
										<input
											type="text"
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
											placeholder="MM/YY"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											CVV
										</label>
										<input
											type="text"
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
											placeholder="123"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Cardholder Name
									</label>
									<input
										type="text"
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										placeholder="John Doe"
									/>
								</div>

								<Button 
									variant="primary" 
									className="w-full"
									onClick={handleCompleteBooking}
									disabled={isProcessing}
								>
									{isProcessing ? 'Processing...' : 'Complete Booking'}
								</Button>
							</form>
						</Card>
					</div>
				</Container>
			</Section>
		</main>
	);
}

