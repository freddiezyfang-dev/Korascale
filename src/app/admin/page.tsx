'use client';

import React from 'react';
import Link from 'next/link';
import { Container, Section, Heading, Text, Card } from '@/components/common';
import { Users, ShoppingCart, Hotel, TrendingUp, Eye, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Revenue',
      value: '$45,678',
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'Active Hotels',
      value: '156',
      change: '+3%',
      changeType: 'positive',
      icon: Hotel,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Customers',
      value: '2,890',
      change: '+15%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  const quickActions = [
    {
      title: 'View All Orders',
      description: 'Manage customer orders and bookings',
      href: '/admin/orders',
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Hotel Management',
      description: 'Add, edit, or remove hotels',
      href: '/admin/hotels',
      icon: Hotel,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Customer Management',
      description: 'View and manage customer accounts',
      href: '/admin/customers',
      icon: Users,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'Analytics & Reports',
      description: 'View business analytics and reports',
      href: '/admin/analytics',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          {/* Header */}
          <div className="mb-8">
            <Heading level={1} className="text-3xl font-bold mb-2">
              Admin Dashboard
            </Heading>
            <Text size="lg" className="text-gray-600">
              Manage your travel booking platform
            </Text>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </Text>
                    <Text className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </Text>
                    <Text className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} from last month
                    </Text>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <Heading level={2} className="text-xl font-semibold mb-4">
              Quick Actions
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${action.color}`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <Text className="font-semibold text-gray-900 mb-1">
                          {action.title}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {action.description}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Orders Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level={2} className="text-xl font-semibold">
                Recent Orders
              </Heading>
              <Link 
                href="/admin/orders"
                className="text-primary-600 hover:text-primary-500 flex items-center gap-1"
              >
                View All
                <Eye className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {[
                { id: 'ORD-2024-001', customer: 'John Smith', hotel: 'Chongqing Intercity Hotel', amount: '$942', status: 'Completed' },
                { id: 'ORD-2024-002', customer: 'Sarah Johnson', hotel: 'Chengdu Kuanzhai Alley Hotel', amount: '$360', status: 'Confirmed' },
                { id: 'ORD-2024-003', customer: 'Mike Chen', hotel: 'Chongqing Pagoda Hotel', amount: '$720', status: 'Pending' }
              ].map((order, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Text className="font-medium text-gray-900">{order.id}</Text>
                    <Text className="text-sm text-gray-600">{order.customer} - {order.hotel}</Text>
                  </div>
                  <div className="text-right">
                    <Text className="font-semibold text-gray-900">{order.amount}</Text>
                    <Text className={`text-sm ${
                      order.status === 'Completed' ? 'text-green-600' :
                      order.status === 'Confirmed' ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {order.status}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </Section>
    </div>
  );
}
