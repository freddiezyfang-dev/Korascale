'use client';

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useRouter } from 'next/navigation';

export default function BookingReviewPage() {
  const { items, totals, removeJourney, clearCart, removeExperienceFromJourney } = useCart();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const router = useRouter();

  const slugToWishlistExps = useMemo(() => {
    const map: Record<string, { id: string; title: string; unitPrice: number }[]> = {};
    wishlistItems.forEach((w) => {
      if (w.type === 'experience' && w.journeySlug) {
        const priceNum = typeof w.price === 'string' ? parseInt(w.price.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        map[w.journeySlug] = map[w.journeySlug] || [];
        if (!map[w.journeySlug].some((e) => e.id === w.id)) {
          map[w.journeySlug].push({ id: w.id, title: w.title, unitPrice: priceNum });
        }
      }
    });
    return map;
  }, [wishlistItems]);

  return (
    <main className="min-h-screen bg-white">
      <Section background="secondary" padding="xl">
        <Container size="xl">
          <Heading level={1} className="mb-6">Review Your Booking</Heading>
          {items.length === 0 ? (
            <div className="text-center py-20">
              <Text className="mb-6">Your booking is empty</Text>
              <Button onClick={() => router.push('/journeys')}>Browse Journeys</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {items.map((j) => {
                  const mergedExperiences = [...j.experiences, ...(slugToWishlistExps[j.slug] || [])];
                  const isAccommodation = j.slug.startsWith('accommodation-');
                  
                  return (
                    <Card key={j.slug} className="p-6">
                      <div className="flex gap-4">
                        {j.image && (
                          <div className="w-40 h-28 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img src={j.image} alt={j.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Heading level={3} className="text-xl">{j.title}</Heading>
                              {isAccommodation && (
                                <Text size="sm" className="text-gray-500 mt-1">Accommodation Booking</Text>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {isAccommodation ? (
                                <Button variant="outline" onClick={() => router.push(`/booking/accommodation?hotelId=${j.journeyId}`)}>Edit</Button>
                              ) : (
                                <Button variant="outline" onClick={() => router.push(`/booking/${j.slug}`)}>Edit</Button>
                              )}
                              <Button variant="ghost" aria-label="Remove" onClick={() => removeJourney(j.slug)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Text size="sm" className="text-gray-600 mt-1">
                            {j.travelers ? `${j.travelers.adults} adults${j.travelers.children ? `, ${j.travelers.children} children` : ''}` : ''}
                            {j.dates?.start ? ` · ${j.dates.start}${j.dates.end ? ` - ${j.dates.end}` : ''}` : ''}
                          </Text>

                          {!isAccommodation && (
                            <div className="mt-4">
                              <Heading level={4} className="text-lg mb-2">Experiences</Heading>
                              {mergedExperiences.length === 0 ? (
                                <Text size="sm" className="text-gray-500">No extra experiences added</Text>
                              ) : (
                                <ul className="space-y-2">
                                  {mergedExperiences.map((e) => (
                                    <li key={e.id} className="flex justify-between items-center text-sm p-2 border rounded">
                                      <span className="truncate">{e.title}</span>
                                      <div className="flex items-center gap-3">
                                        <span>¥{e.unitPrice}</span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          aria-label="Remove"
                                          onClick={() => {
                                            removeExperienceFromJourney(j.slug, e.id);
                                            removeFromWishlist(e.id);
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="space-y-4">
                <Card className="p-6">
                  <Heading level={3} className="text-xl mb-4">Summary</Heading>
                  <div className="space-y-2">
                    {items.map((j) => (
                      <div key={j.slug} className="flex justify-between text-sm">
                        <span className="truncate">{j.title}</span>
                        <span>¥{totals.journeys[j.slug] || 0}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>¥{totals.subtotal}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => router.push('/checkout')}>Continue</Button>
                  <Button className="w-full mt-2" variant="outline" onClick={clearCart}>Clear</Button>
                </Card>
              </div>
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}


