'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card } from '@/components/common';
import { Users, ShoppingCart, Hotel, TrendingUp, Eye, Settings, LogOut } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function AdminDashboard() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [recentUsers, setRecentUsers] = useState([
    { id: '1', name: 'John Smith', email: 'john@example.com', lastLogin: '2024-01-15', status: 'Active' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', lastLogin: '2024-01-14', status: 'Active' },
    { id: '3', name: 'Mike Chen', email: 'mike@example.com', lastLogin: '2024-01-13', status: 'Inactive' },
    { id: '4', name: 'Admin User', email: 'admin@korascale.com', lastLogin: '2024-01-15', status: 'Active' },
  ]);

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
      value: recentUsers.length.toString(),
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

  if (!user || user.email !== 'admin@korascale.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">
            访问被拒绝
          </Heading>
          <Text className="text-gray-600 mb-4">
            您没有权限访问管理后台
          </Text>
          <Link href="/" className="text-primary-600 hover:text-primary-500">
            返回首页
          </Link>
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
                  管理后台
                </Heading>
                <Text size="lg" className="text-gray-600">
                  欢迎回来，{user.name}！管理您的旅游预订平台
                </Text>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </div>
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

          {/* Recent Users */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <Heading level={2} className="text-xl font-semibold">
                最近用户
              </Heading>
              <Link 
                href="/admin/customers"
                className="text-primary-600 hover:text-primary-500 flex items-center gap-1"
              >
                查看全部
                <Eye className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Text className="font-medium text-gray-900">{user.name}</Text>
                    <Text className="text-sm text-gray-600">{user.email}</Text>
                    <Text className="text-xs text-gray-500">最后登录: {user.lastLogin}</Text>
                  </div>
                  <div className="text-right">
                    <Text className={`text-sm px-2 py-1 rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'Active' ? '活跃' : '非活跃'}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Orders Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level={2} className="text-xl font-semibold">
                最近订单
              </Heading>
              <Link 
                href="/admin/orders"
                className="text-primary-600 hover:text-primary-500 flex items-center gap-1"
              >
                查看全部
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
                      {order.status === 'Completed' ? '已完成' : 
                       order.status === 'Confirmed' ? '已确认' : '待处理'}
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
