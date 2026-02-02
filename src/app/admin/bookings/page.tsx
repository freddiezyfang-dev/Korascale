'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { Calendar, User, Mail, MapPin, DollarSign, CheckCircle, Clock } from 'lucide-react';

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
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || []);
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
                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50/50">
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
                            onClick={() => markProcessed(b.id)}
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
    </div>
  );
}
