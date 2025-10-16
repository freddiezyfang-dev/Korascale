'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useOrderManagement } from '@/context/OrderManagementContext';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orders, updateOrderStatus } = useOrderManagement();

  const orderId = searchParams.get('orderId') || '';
  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">Order Not Found</Heading>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </main>
    );
  }

  const handleConfirm = () => {
    // 用户确认产品 => 更新为 confirmed
    updateOrderStatus(order.id, 'confirmed');
    router.push(`/checkout?orderId=${order.id}`);
  };

  return (
    <main className="min-h-screen bg-white">
      <Section background="primary" padding="xl">
        <Container size="lg">
          <div className="mb-8">
            <Heading level={1} className="text-3xl font-bold mb-2">Confirm Your Booking</Heading>
            <Text size="lg" className="text-gray-600">Please review all details carefully before payment</Text>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Journey</Heading>
                <div className="flex items-center gap-4">
                  <img src={order.accommodation.image} alt={order.accommodation.title} className="w-24 h-24 object-cover rounded" />
                  <div>
                    <Text className="font-medium">{order.accommodation.title}</Text>
                    <Text className="text-sm text-gray-600">{order.accommodation.location}</Text>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Traveler</Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Text className="text-gray-600">Name</Text>
                    <Text className="font-medium">{order.userName}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-600">Email</Text>
                    <Text className="font-medium">{order.userEmail}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-600">Check-in</Text>
                    <Text className="font-medium">{order.stayDetails.checkIn?.toLocaleDateString()}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-600">Check-out</Text>
                    <Text className="font-medium">{order.stayDetails.checkOut?.toLocaleDateString()}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-600">Travelers</Text>
                    <Text className="font-medium">{order.stayDetails.guests}</Text>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Summary and actions */}
            <div className="space-y-6">
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Booking Summary</Heading>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <Text>Journey</Text>
                    <Text>¥{order.totalPrice}</Text>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <Text>Total</Text>
                    <Text>¥{order.totalPrice}</Text>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => router.back()}>Back</Button>
                <Button variant="primary" onClick={handleConfirm}>Confirm and Continue</Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}


