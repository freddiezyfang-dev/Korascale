'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';

interface JourneyData {
  id: string;
  title: string;
  slug: string;
  image?: string;
  heroImage?: string;
  price?: number;
  duration?: string;
  city?: string;
  location?: string;
}

export default function BookingReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const journeyId = params.journeyId as string;
  const dateParam = searchParams.get('date') || '';
  const priceParam = searchParams.get('price') || '';

  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [firstTimeChina, setFirstTimeChina] = useState<string>('');
  const [traveledDevelopingRegions, setTraveledDevelopingRegions] = useState<string>('');
  const [whatMattersMost, setWhatMattersMost] = useState<string>('');
  const [departureCityInput, setDepartureCityInput] = useState('');
  const [arrivalCityInput, setArrivalCityInput] = useState('');

  const pricePerPerson = useMemo(() => {
    const p = parseFloat(priceParam);
    return Number.isFinite(p) ? p : 0;
  }, [priceParam]);

  const finalPrice = useMemo(() => {
    return (adults + children) * pricePerPerson;
  }, [pricePerPerson, adults, children]);

  const formattedDate = useMemo(() => {
    if (!dateParam) return '';
    try {
      const [y, m, d] = dateParam.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateParam;
    }
  }, [dateParam]);

  const durationDays = useMemo(() => {
    if (!journey?.duration) return 1;
    const match = journey.duration.match(/\d+/);
    const n = match ? parseInt(match[0], 10) : 1;
    return Math.max(1, n);
  }, [journey?.duration]);

  const dateRangeDisplay = useMemo(() => {
    if (!dateParam) return formattedDate || '—';
    try {
      const [y, m, d] = dateParam.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const end = new Date(start);
      end.setDate(end.getDate() + durationDays - 1);
      const startStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return durationDays > 1 ? `${startStr} – ${endStr}` : startStr;
    } catch {
      return formattedDate || dateParam;
    }
  }, [dateParam, durationDays, formattedDate]);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      router.replace('/auth/login');
      return;
    }
    const slug = decodeURIComponent(journeyId);
    fetch(`/api/journeys/slug/${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.journey) {
          setJourney(data.journey);
          setDepartureCityInput(data.journey.city ?? '');
          setArrivalCityInput(data.journey.location ?? '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [journeyId, user?.isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journey || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          journeyId: journey.id,
          journeySlug: journey.slug,
          journeyTitle: journey.title,
          selectedDate: dateParam,
          adults,
          children,
          finalPrice: Math.round(finalPrice * 100) / 100,
          specialRequests: specialRequests.trim() || undefined,
          firstTimeChina: firstTimeChina || undefined,
          traveledDevelopingRegions: traveledDevelopingRegions || undefined,
          whatMattersMost: whatMattersMost || undefined,
          departureCity: departureCityInput.trim() || undefined,
          arrivalCity: arrivalCityInput.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Submit failed');
      router.push('/booking/success');
    } catch {
      setSubmitting(false);
    }
  };

  if (!user?.isLoggedIn) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-600">Loading...</Text>
      </div>
    );
  }
  if (!journey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={2} className="mb-4">Journey not found</Heading>
          <Link href="/journeys"><Button>Browse Journeys</Button></Link>
        </div>
      </div>
    );
  }

  const heroImage = journey.heroImage || journey.image || '';

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#FAF9F6]">
      <Section background="secondary" padding="xl">
        <Container size="lg">
          <Heading level={1} className="mb-4 leading-tight text-center" style={{ fontFamily: 'Playfair Display, serif', lineHeight: 1.25 }}>
            Review Your Booking
          </Heading>
          <p className="mb-8 text-[#1e3b32] text-base leading-relaxed max-w-2xl mx-auto text-center">
            This is a booking request. Our travel designers will review your request and contact you within 24 hours.
          </p>

          <div className="max-w-3xl mx-auto min-w-0 space-y-6">
            {/* 主卡片：无 transform，固定最大宽度居中对齐 */}
            <Card className="itinerary-card bg-white text-gray-900 rounded-lg p-8 shadow-sm border border-gray-100 flex flex-col gap-8 max-w-3xl mx-auto">
              {/* Journey 标题 + 标题图 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-2 leading-normal">
                    JOURNEY
                  </span>
                  <h2 className="text-2xl md:text-3xl text-gray-900 mt-1 mb-2 leading-snug" style={{ fontFamily: 'Montaga, serif', fontWeight: 400, lineHeight: 1.35 }}>
                    {journey.title}
                  </h2>
                  {journey.duration && (
                    <Text size="sm" className="text-gray-500 leading-normal">{journey.duration}</Text>
                  )}
                </div>
                {heroImage && (
                  <div className="w-full md:w-[45%] flex-shrink-0 aspect-[16/9] rounded-sm overflow-hidden bg-gray-200">
                    <img src={heroImage} alt={journey.title} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* 选定日期区间 */}
              <div className="border-t border-gray-100 pt-6">
                <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-2 leading-normal">
                  SELECTED DATE RANGE
                </span>
                <Text className="text-gray-900 font-medium text-lg leading-relaxed">{dateRangeDisplay}</Text>
              </div>

              {/* 航点：交互式输入框 */}
              <div className="border-t border-gray-100 pt-6">
                <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-3 leading-normal">
                  DEPARTURE CITY / ARRIVAL CITY
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="departure-city" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Departure City
                    </label>
                    <input
                      id="departure-city"
                      type="text"
                      value={departureCityInput}
                      onChange={(e) => setDepartureCityInput(e.target.value)}
                      placeholder={journey.city || 'e.g. Beijing'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3b32] focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="arrival-city" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Arrival City
                    </label>
                    <input
                      id="arrival-city"
                      type="text"
                      value={arrivalCityInput}
                      onChange={(e) => setArrivalCityInput(e.target.value)}
                      placeholder={journey.location || 'e.g. Shanghai'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3b32] focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Guests 与 Final Price：双行人数 + 独立价格区，彻底避免重叠 */}
              <div className="flex flex-col md:flex-row md:items-start gap-8 border-t border-gray-100 pt-6">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-4 leading-normal">
                    GUESTS
                  </span>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-800 font-medium w-20 shrink-0">Adults</span>
                      <button
                        type="button"
                        onClick={() => setAdults((a) => Math.max(1, a - 1))}
                        className="w-9 h-9 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium tabular-nums">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults((a) => a + 1)}
                        className="w-9 h-9 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-800 font-medium w-20 shrink-0">Children</span>
                      <button
                        type="button"
                        onClick={() => setChildren((c) => Math.max(0, c - 1))}
                        className="w-9 h-9 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium tabular-nums">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren((c) => c + 1)}
                        className="w-9 h-9 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="min-w-0 md:flex-shrink-0 md:w-52 pt-2">
                  <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-2 leading-normal">
                    FINAL PRICE
                  </span>
                  <p className="block text-2xl font-semibold text-gray-900 leading-tight mt-1 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                    ${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 leading-snug">
                    Note: For travelers under 18 (Children), please consult our travel experts for potential age-specific arrangements.
                  </p>
                </div>
              </div>

              {/* 筛选问题：HELP US TAILOR YOUR EXPERIENCE */}
              <div className="border-t border-gray-100 pt-6">
                <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-4 leading-normal">
                  HELP US TAILOR YOUR EXPERIENCE
                </span>
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-800 font-medium mb-2 leading-normal">Is this your first time in China?</p>
                    <div className="flex flex-wrap gap-4">
                      {['Yes', 'No'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="firstTimeChina"
                            value={opt}
                            checked={firstTimeChina === opt}
                            onChange={() => setFirstTimeChina(opt)}
                            className="rounded-full border-gray-300 text-[#1e3b32] focus:ring-[#1e3b32]"
                          />
                          <span className="text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium mb-2 leading-normal">Have you traveled in developing regions before?</p>
                    <div className="flex flex-wrap gap-4">
                      {['Yes', 'No'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="traveledDevelopingRegions"
                            value={opt}
                            checked={traveledDevelopingRegions === opt}
                            onChange={() => setTraveledDevelopingRegions(opt)}
                            className="rounded-full border-gray-300 text-[#1e3b32] focus:ring-[#1e3b32]"
                          />
                          <span className="text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium mb-2 leading-normal">What matters most to you?</p>
                    <div className="flex flex-wrap gap-4">
                      {['Comfort', 'Culture', 'Adventure'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="whatMattersMost"
                            value={opt}
                            checked={whatMattersMost === opt}
                            onChange={() => setWhatMattersMost(opt)}
                            className="rounded-full border-gray-300 text-[#1e3b32] focus:ring-[#1e3b32]"
                          />
                          <span className="text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-gray-500 font-medium text-xs tracking-widest uppercase mb-2 leading-normal">
                  Special Requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Dietary needs, accessibility, room preferences, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-8 mt-10">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#1e3b32] text-white text-sm tracking-widest uppercase hover:bg-[#1a342c] disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'SEND BOOKING REQUEST'}
                </Button>
              </form>
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}
