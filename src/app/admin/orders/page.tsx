'use client';

import React, { useState, useEffect } from 'react';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { Search, Filter, Download, Eye, Calendar, User, MapPin, CreditCard } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomType: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

// 模拟订单数据
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    hotelName: 'Chongqing Jiefangbei Walking Street Intercity Hotel',
    location: 'Jiefangbei Walking Street, Chongqing',
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    adults: 2,
    children: 1,
    roomType: 'Intercity Deluxe King Room',
    totalPrice: 942,
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    paymentStatus: 'paid'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    hotelName: 'Chengdu Kuanzhai Alley Intercity Hotel',
    location: 'Kuanzhai Alley, Chengdu',
    checkIn: '2024-02-20',
    checkOut: '2024-02-22',
    adults: 1,
    children: 0,
    roomType: 'Deluxe King Room',
    totalPrice: 360,
    status: 'confirmed',
    createdAt: '2024-01-16T14:20:00Z',
    paymentStatus: 'paid'
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customerName: 'Mike Chen',
    customerEmail: 'mike.chen@email.com',
    hotelName: 'Chongqing Daji Pagoda Junting Design Hotel',
    location: 'Jiefangbei Hongyadong, Chongqing',
    checkIn: '2024-02-25',
    checkOut: '2024-02-28',
    adults: 2,
    children: 0,
    roomType: 'Cloud River View King Room',
    totalPrice: 720,
    status: 'pending',
    createdAt: '2024-01-17T09:15:00Z',
    paymentStatus: 'pending'
  }
];

export default function AdminOrdersPage() {
  const { orders: contextOrders } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 合并模拟数据和真实数据
  useEffect(() => {
    const allOrders = [...mockOrders, ...contextOrders];
    setOrders(allOrders);
    setFilteredOrders(allOrders);
  }, [contextOrders]);

  // 搜索和过滤
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportOrders = () => {
    const csvContent = [
      ['Order Number', 'Customer Name', 'Email', 'Hotel', 'Check-in', 'Check-out', 'Total Price', 'Status', 'Payment Status'],
      ...filteredOrders.map(order => [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.hotelName,
        order.checkIn,
        order.checkOut,
        `$${order.totalPrice}`,
        order.status,
        order.paymentStatus
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          {/* Header */}
          <div className="mb-8">
            <Heading level={1} className="text-3xl font-bold mb-2">
              Order Management
            </Heading>
            <Text size="lg" className="text-gray-600">
              View and manage customer orders
            </Text>
          </div>

          {/* Filters and Search */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders by number, customer, or hotel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Export Button */}
              <Button
                onClick={exportOrders}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Orders Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hotel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Text className="font-medium text-gray-900">
                            {order.orderNumber}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </Text>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Text className="font-medium text-gray-900">
                            {order.customerName}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {order.customerEmail}
                          </Text>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <Text className="font-medium text-gray-900 truncate">
                            {order.hotelName}
                          </Text>
                          <Text className="text-sm text-gray-500 truncate">
                            {order.location}
                          </Text>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Text className="text-sm text-gray-900">
                            {formatDate(order.checkIn)} - {formatDate(order.checkOut)}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {order.adults} adults, {order.children} children
                          </Text>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Text className="font-medium text-gray-900">
                          ${order.totalPrice}
                        </Text>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedOrder(null)} />
              <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Heading level={2} className="text-xl font-semibold">
                      Order Details
                    </Heading>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Text className="text-sm font-medium text-gray-500">Order Number</Text>
                        <Text className="text-lg font-semibold">{selectedOrder.orderNumber}</Text>
                      </div>
                      <div>
                        <Text className="text-sm font-medium text-gray-500">Created Date</Text>
                        <Text className="text-lg">{formatDate(selectedOrder.createdAt)}</Text>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <Heading level={3} className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Customer Information
                      </Heading>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Name</Text>
                            <Text className="text-lg">{selectedOrder.customerName}</Text>
                          </div>
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Email</Text>
                            <Text className="text-lg">{selectedOrder.customerEmail}</Text>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div>
                      <Heading level={3} className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Hotel Information
                      </Heading>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Hotel Name</Text>
                            <Text className="text-lg">{selectedOrder.hotelName}</Text>
                          </div>
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Location</Text>
                            <Text className="text-lg">{selectedOrder.location}</Text>
                          </div>
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Room Type</Text>
                            <Text className="text-lg">{selectedOrder.roomType}</Text>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div>
                      <Heading level={3} className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Booking Details
                      </Heading>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Check-in Date</Text>
                            <Text className="text-lg">{formatDate(selectedOrder.checkIn)}</Text>
                          </div>
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Check-out Date</Text>
                            <Text className="text-lg">{formatDate(selectedOrder.checkOut)}</Text>
                          </div>
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Adults</Text>
                            <Text className="text-lg">{selectedOrder.adults}</Text>
                          </div>
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Children</Text>
                            <Text className="text-lg">{selectedOrder.children}</Text>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div>
                      <Heading level={3} className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment Information
                      </Heading>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <Text className="text-sm font-medium text-gray-500">Total Amount</Text>
                            <Text className="text-2xl font-bold text-green-600">${selectedOrder.totalPrice}</Text>
                          </div>
                          <div className="text-right">
                            <Text className="text-sm font-medium text-gray-500">Payment Status</Text>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                              {selectedOrder.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
