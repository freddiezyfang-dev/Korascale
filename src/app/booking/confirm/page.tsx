'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useOrderManagement } from '@/context/OrderManagementContext';
import { X } from 'lucide-react';
import { getRenderableImageUrl } from '@/lib/imageUtils';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const { orders } = useOrderManagement();

  // 从浏览器地址栏解析 orderId，避免在 SSR 阶段使用 useSearchParams
  const [orderId, setOrderId] = useState<string>('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    setOrderId(sp.get('orderId') || '');
  }, []);
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

  return (
    <main className="min-h-screen bg-white">
      <Section background="primary" padding="xl">
        <Container size="lg">
          <div className="mb-8">
            <Heading level={1} className="text-3xl font-bold mb-2">Confirm Your Booking</Heading>
            <Text size="lg" className="text-gray-600">
              This legacy booking flow is no longer active. Browse journeys or contact our team to plan your trip.
            </Text>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Journey Overview */}
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Journey Overview</Heading>
                <div className="flex items-center gap-4">
                  <img src={getRenderableImageUrl(order.accommodation.image)} alt={order.accommodation.title} className="w-24 h-24 object-cover rounded" />
                  <div>
                    <Text className="font-medium">{order.accommodation.title}</Text>
                    <Text className="text-sm text-gray-600">{order.accommodation.location}</Text>
                  </div>
                </div>
              </Card>

              {/* Selected Journey Modules */}
              {order.selectedModules && order.selectedModules.length > 0 && (
                <Card className="p-6">
                  <Heading level={2} className="text-lg font-semibold mb-4">Journey Modules</Heading>
                  <div className="space-y-4">
                    {order.selectedModules.map((module, index) => (
                      <div key={module.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Text className="font-medium">{module.title}</Text>
                          <Text className="text-sm text-gray-600">¥{module.price} × {(order.stayDetails.guests ?? (order.stayDetails.adults + order.stayDetails.children))}</Text>
                        </div>
                        <Text className="text-sm text-gray-600 mb-2">{module.description}</Text>
                        <Text className="text-xs text-gray-500">Duration: {module.duration}</Text>
                        {module.included && module.included.length > 0 && (
                          <div className="mt-2">
                            <Text className="text-xs font-medium text-gray-700 mb-1">Included:</Text>
                            <ul className="text-xs text-gray-600 list-disc list-inside">
                              {module.included.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Selected Experiences */}
              {order.selectedExperiences && order.selectedExperiences.length > 0 && (
                <Card className="p-6">
                  <Heading level={2} className="text-lg font-semibold mb-4">Additional Experiences</Heading>
                  <div className="space-y-4">
                    {order.selectedExperiences.map((experience, index) => (
                      <div key={experience.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Text className="font-medium">{experience.title}</Text>
                          <Text className="text-sm text-gray-600">¥{experience.price} × {(order.stayDetails.guests ?? (order.stayDetails.adults + order.stayDetails.children))}</Text>
                        </div>
                        <Text className="text-sm text-gray-600 mb-2">{experience.description}</Text>
                        <Text className="text-xs text-gray-500">Duration: {experience.duration}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Selected Accommodation */}
              {order.selectedAccommodation && (
                <Card className="p-6">
                  <Heading level={2} className="text-lg font-semibold mb-4">Accommodation</Heading>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Text className="font-medium">{order.selectedAccommodation.title}</Text>
                      <Text className="text-sm text-gray-600">¥{order.selectedAccommodation.price}</Text>
                    </div>
                    <Text className="text-sm text-gray-600 mb-2">{order.selectedAccommodation.description}</Text>
                    <Text className="text-xs text-gray-500">Duration: {order.selectedAccommodation.duration}</Text>
                  </div>
                </Card>
              )}

              {/* Traveler Information */}
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Traveler Information</Heading>
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
                    <Text className="text-gray-600">Phone</Text>
                    <Text className="font-medium">{order.guestInfo.phone || 'Not provided'}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-600">Nationality</Text>
                    <Text className="font-medium">{order.guestInfo.nationality || 'Not provided'}</Text>
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
                    <Text className="font-medium">{order.stayDetails.guests ?? (order.stayDetails.adults + order.stayDetails.children)}</Text>
                  </div>
                  {order.guestInfo.specialRequests && (
                    <div className="md:col-span-2">
                      <Text className="text-gray-600">Special Requests</Text>
                      <Text className="font-medium">{order.guestInfo.specialRequests}</Text>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right: Summary and actions */}
            <div className="space-y-6">
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Booking Summary</Heading>
                <div className="space-y-3 text-sm">
                  {/* Journey Modules */}
                  {order.selectedModules && order.selectedModules.length > 0 && (
                    <div>
                      <Text className="font-medium text-gray-700 mb-2">Journey Modules</Text>
                      {order.selectedModules.map((module, index) => (
                        <div key={module.id || index} className="flex justify-between text-gray-600 mb-1">
                          <Text className="truncate">{module.title}</Text>
                          <Text>¥{module.price * (order.stayDetails.guests ?? (order.stayDetails.adults + order.stayDetails.children))}</Text>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Additional Experiences */}
                  {order.selectedExperiences && order.selectedExperiences.length > 0 && (
                    <div>
                      <Text className="font-medium text-gray-700 mb-2">Additional Experiences</Text>
                      {order.selectedExperiences.map((experience, index) => (
                        <div key={experience.id || index} className="flex justify-between text-gray-600 mb-1">
                          <Text className="truncate">{experience.title}</Text>
                          <Text>¥{experience.price * (order.stayDetails.guests ?? (order.stayDetails.adults + order.stayDetails.children))}</Text>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accommodation */}
                  {order.selectedAccommodation && (
                    <div>
                      <Text className="font-medium text-gray-700 mb-2">Accommodation</Text>
                      <div className="flex justify-between text-gray-600 mb-1">
                        <Text className="truncate">{order.selectedAccommodation.title}</Text>
                        <Text>¥{order.selectedAccommodation.price}</Text>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <Text>Total</Text>
                      <Text>¥{order.totalPrice}</Text>
                    </div>
                    <Text className="text-xs text-gray-500 mt-1">
                      {(() => { const g = order.stayDetails.guests ?? (order.stayDetails.adults + order.stayDetails.children); return `For ${g} traveler${g > 1 ? 's' : ''}`; })()}
                    </Text>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  onClick={() => router.push('/journeys')}
                  className="w-full"
                >
                  Browse Journeys
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => router.push('/contact')}
                  className="w-full"
                >
                  Contact Us
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                >
                  Back to Edit
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}


