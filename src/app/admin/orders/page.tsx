'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useOrderManagement } from '@/context/OrderManagementContext';
import { Order, OrderStatus } from '@/types';
import { CheckCircle, Clock, CreditCard, User, Calendar, DollarSign, Eye, Check } from 'lucide-react';

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock,
    description: 'Waiting for user confirmation'
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle,
    description: 'User confirmed product'
  },
  paid: { 
    label: 'Paid', 
    color: 'bg-green-100 text-green-800', 
    icon: CreditCard,
    description: 'Payment received'
  },
  staff_confirmed: { 
    label: 'Staff Confirmed', 
    color: 'bg-purple-100 text-purple-800', 
    icon: Check,
    description: 'Staff manually confirmed'
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-gray-100 text-gray-800', 
    icon: CheckCircle,
    description: 'Order completed'
  },
};

export default function AdminOrdersPage() {
  const { user, logout } = useUser();
  const { orders, updateOrderStatus, loginRecords } = useOrderManagement();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 检查用户权限
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    setSelectedOrder(null);
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const getStatusStats = () => {
    const stats = {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      paid: orders.filter(o => o.status === 'paid').length,
      staff_confirmed: orders.filter(o => o.status === 'staff_confirmed').length,
      completed: orders.filter(o => o.status === 'completed').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  if (!user || user.email !== 'admin@korascale.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">
            Access Denied
          </Heading>
          <Text className="text-gray-600 mb-4">
            You don't have permission to access the admin panel
          </Text>
          <Button onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Heading level={1} className="text-3xl font-bold mb-2">
                  Order Management
                </Heading>
                <Text size="lg" className="text-gray-600">
                  Manage customer orders and track progress
                </Text>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => router.push('/admin')}
                  variant="secondary"
                >
                  Back to Dashboard
                </Button>
                <Button onClick={handleLogout} variant="secondary">
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Status Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(stats).map(([status, count]) => (
              <Card key={status} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-sm font-medium text-gray-600">
                      {statusConfig[status as OrderStatus].label}
                    </Text>
                    <Text className="text-2xl font-bold text-gray-900">
                      {count}
                    </Text>
                  </div>
                  <div className={`p-2 rounded-full ${statusConfig[status as OrderStatus].color}`}>
                    {React.createElement(statusConfig[status as OrderStatus].icon, { className: "w-5 h-5" })}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Filter Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'primary' : 'secondary'}
                onClick={() => setSelectedStatus('all')}
                size="sm"
              >
                All Orders ({orders.length})
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'primary' : 'secondary'}
                  onClick={() => setSelectedStatus(status as OrderStatus)}
                  size="sm"
                >
                  {config.label} ({stats[status as OrderStatus]})
                </Button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Text className="text-gray-500">
                  No orders found for the selected status.
                </Text>
              </Card>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={order.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <Text className="font-semibold text-lg">
                            Order #{order.id.slice(-8)}
                          </Text>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4 inline mr-1" />
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <Text className="text-sm text-gray-600">Customer</Text>
                              <Text className="font-medium">{order.userName}</Text>
                              <Text className="text-sm text-gray-500">{order.userEmail}</Text>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <Text className="text-sm text-gray-600">Check-in/out</Text>
                              <Text className="font-medium">
                                {order.stayDetails.checkIn?.toLocaleDateString()} - {order.stayDetails.checkOut?.toLocaleDateString()}
                              </Text>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <div>
                              <Text className="text-sm text-gray-600">Total Amount</Text>
                              <Text className="font-medium text-lg">${order.totalPrice}</Text>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <Text className="text-sm text-gray-600">Accommodation</Text>
                          <Text className="font-medium">{order.accommodation.title}</Text>
                          <Text className="text-sm text-gray-500">{order.accommodation.location}</Text>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          <Text>Created: {order.createdAt.toLocaleString()}</Text>
                          {order.paymentConfirmedAt && (
                            <Text>Paid: {order.paymentConfirmedAt.toLocaleString()}</Text>
                          )}
                          {order.staffConfirmedAt && (
                            <Text>Staff Confirmed: {order.staffConfirmedAt.toLocaleString()}</Text>
                          )}
                          {order.completedAt && (
                            <Text>Completed: {order.completedAt.toLocaleString()}</Text>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setSelectedOrder(order)}
                          variant="secondary"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        
                        {/* Action Buttons based on status */}
                        {order.status === 'paid' && (
                          <Button
                            onClick={() => handleStatusUpdate(order.id, 'staff_confirmed')}
                            variant="primary"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Staff Confirm
                          </Button>
                        )}
                        
                        {order.status === 'staff_confirmed' && (
                          <Button
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                            variant="primary"
                            size="sm"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Container>
      </Section>
    </div>
  );
}