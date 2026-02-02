'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { Calendar, User, Mail, MapPin, DollarSign, CheckCircle, Clock, X, Phone, Globe, Heart, MessageSquare } from 'lucide-react';

interface BookingRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  journey_id: string;
  journey_slug: string;
  journey_title: string | null;
  selected_date: string;
  adults: number;
  children: number;
  final_price: string;
  special_requests: string | null;
  first_time_china?: string | null;
  traveled_developing_regions?: string | null;
  what_matters_most?: string | null;
  departure_city?: string | null;
  status: string;
  submitted_at: string;
  processed_at: string | null;
  created_at: string;
}

export default function AdminBookingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }
    fetch('/api/bookings')
      .then((res) => {
        if (!res.ok) {
          console.error('[Admin Bookings] API error:', res.status, res.statusText);
          return res.json().then(err => {
            throw new Error(err.error || `API error: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log('[Admin Bookings] Received data:', data);
        setBookings(data.bookings || []);
      })
      .catch((error) => {
        console.error('[Admin Bookings] Fetch error:', error);
        alert(`Failed to load bookings: ${error.message}`);
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  const markProcessed = (id: string) => {
    setUpdatingId(id);
    fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PROCESSED' }),
    })
      .then((res) => res.json())
      .then(() => {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: 'PROCESSED', processed_at: new Date().toISOString() }
              : b
          )
        );
      })
      .finally(() => setUpdatingId(null));
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return d;
    }
  };

  if (!user || user.email !== 'admin@korascale.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">Access Denied</Heading>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
                ← Back to Admin
              </Link>
              <Heading level={1} className="text-3xl font-bold">Bookings</Heading>
              <Text className="text-gray-600 mt-1">客户预订列表，支持标记为已处理</Text>
            </div>
          </div>

          {loading ? (
            <Text className="text-gray-500">Loading...</Text>
          ) : bookings.length === 0 ? (
            <Card className="p-8 text-center">
              <Text className="text-gray-500">No bookings yet.</Text>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Journey</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date / Guests</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Submitted</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr 
                      key={b.id} 
                      className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedBooking(b)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{b.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {b.customer_email}
                          </div>
                          {b.customer_phone && (
                            <div className="text-sm text-gray-500">{b.customer_phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900">{b.journey_title || b.journey_slug}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div>{b.selected_date}</div>
                        <div className="text-gray-500">{b.adults} adults, {b.children} children</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          {Number(b.final_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(b.submitted_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {b.status === 'PROCESSED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            已处理
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {b.status !== 'PROCESSED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              markProcessed(b.id);
                            }}
                          >
                            {updatingId === b.id ? 'Updating...' : 'Mark as 已处理'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </Section>

      {/* Booking 详情弹窗 */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <Heading level={2} className="text-2xl font-bold">Booking Details</Heading>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-6">
              {/* 客户个人信息 */}
              <div>
                <Heading level={3} className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Name</Text>
                    <Text className="font-medium">{selectedBooking.customer_name}</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </Text>
                    <Text className="font-medium">{selectedBooking.customer_email}</Text>
                  </div>
                  {selectedBooking.customer_phone && (
                    <div>
                      <Text className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </Text>
                      <Text className="font-medium">{selectedBooking.customer_phone}</Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Journey 信息 */}
              <div>
                <Heading level={3} className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Journey Details
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Journey Title</Text>
                    <Text className="font-medium">{selectedBooking.journey_title || selectedBooking.journey_slug}</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Journey ID</Text>
                    <Text className="font-mono text-sm">{selectedBooking.journey_id}</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Slug</Text>
                    <Text className="font-mono text-sm">{selectedBooking.journey_slug}</Text>
                  </div>
                  {selectedBooking.departure_city && (
                    <div>
                      <Text className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        Departure City
                      </Text>
                      <Text className="font-medium">{selectedBooking.departure_city}</Text>
                    </div>
                  )}
                </div>
              </div>

              {/* 日期和客人 */}
              <div>
                <Heading level={3} className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Travel Details
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Selected Date</Text>
                    <Text className="font-medium">{selectedBooking.selected_date}</Text>
                  </div>
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Guests</Text>
                    <Text className="font-medium">
                      {selectedBooking.adults} Adults, {selectedBooking.children} Children
                    </Text>
                  </div>
                  <div>
                    <Text className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Final Price
                    </Text>
                    <Text className="text-xl font-bold text-[#1e3b32]">
                      ${Number(selectedBooking.final_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Status</Text>
                    {selectedBooking.status === 'PROCESSED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        已处理
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedBooking.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 筛选问题 */}
              {(selectedBooking.first_time_china || selectedBooking.traveled_developing_regions || selectedBooking.what_matters_most) && (
                <div>
                  <Heading level={3} className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Qualification Questions
                  </Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBooking.first_time_china && (
                      <div>
                        <Text className="text-sm text-gray-500 mb-1">First time in China?</Text>
                        <Text className="font-medium">{selectedBooking.first_time_china}</Text>
                      </div>
                    )}
                    {selectedBooking.traveled_developing_regions && (
                      <div>
                        <Text className="text-sm text-gray-500 mb-1">Traveled in developing regions?</Text>
                        <Text className="font-medium">{selectedBooking.traveled_developing_regions}</Text>
                      </div>
                    )}
                    {selectedBooking.what_matters_most && (
                      <div>
                        <Text className="text-sm text-gray-500 mb-1">What matters most?</Text>
                        <Text className="font-medium">{selectedBooking.what_matters_most}</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <Heading level={3} className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Special Requests
                  </Heading>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Text className="whitespace-pre-wrap">{selectedBooking.special_requests}</Text>
                  </div>
                </div>
              )}

              {/* 时间戳 */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <Text className="text-xs">Submitted At</Text>
                    <Text>{formatDate(selectedBooking.submitted_at)}</Text>
                  </div>
                  {selectedBooking.processed_at && (
                    <div>
                      <Text className="text-xs">Processed At</Text>
                      <Text>{formatDate(selectedBooking.processed_at)}</Text>
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedBooking.status !== 'PROCESSED' && (
                  <Button
                    variant="primary"
                    disabled={updatingId === selectedBooking.id}
                    onClick={() => {
                      markProcessed(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                    className="flex-1"
                  >
                    {updatingId === selectedBooking.id ? 'Updating...' : 'Mark as 已处理'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
