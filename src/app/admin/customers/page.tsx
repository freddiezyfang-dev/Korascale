'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useOrderManagement } from '@/context/OrderManagementContext';
import { UserLoginRecord } from '@/types';
import { 
  Users, 
  Mail, 
  Calendar, 
  MapPin, 
  Eye, 
  Search,
  Filter,
  Grid,
  List,
  UserCheck,
  UserX,
  Clock,
  LogOut
} from 'lucide-react';

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  lastLogin: Date;
  loginCount: number;
  isOnline: boolean;
  registrationDate: Date;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
}

export default function AdminCustomersPage() {
  const { user, logout } = useUser();
  const { loginRecords, orders } = useOrderManagement();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);

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

  // 处理用户数据
  const processCustomerData = (): CustomerInfo[] => {
    const customerMap = new Map<string, CustomerInfo>();
    
    // 从登录记录中提取用户信息
    loginRecords.forEach(record => {
      if (!customerMap.has(record.userEmail)) {
        const userOrders = orders.filter(order => order.userEmail === record.userEmail);
        const totalSpent = userOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        
        customerMap.set(record.userEmail, {
          id: record.userId,
          name: record.userEmail.split('@')[0],
          email: record.userEmail,
          lastLogin: record.loginAt,
          loginCount: 1,
          isOnline: !record.logoutAt,
          registrationDate: record.loginAt, // 使用首次登录时间作为注册时间
          totalOrders: userOrders.length,
          totalSpent,
          status: 'active'
        });
      } else {
        // 更新现有用户信息
        const existing = customerMap.get(record.userEmail)!;
        if (record.loginAt > existing.lastLogin) {
          existing.lastLogin = record.loginAt;
          existing.isOnline = !record.logoutAt;
        }
        existing.loginCount++;
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => 
      new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
    );
  };

  const customers = processCustomerData();

  // 过滤客户
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 统计数据
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.isOnline).length,
    inactive: customers.filter(c => !c.isOnline).length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    totalOrders: customers.reduce((sum, c) => sum + c.totalOrders, 0),
  };

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
                  Customer Management
                </Heading>
                <Text size="lg" className="text-gray-600">
                  Manage customer accounts and view their activity
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

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Total Customers</Text>
                  <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Online Now</Text>
                  <Text className="text-2xl font-bold text-green-600">{stats.active}</Text>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Total Orders</Text>
                  <Text className="text-2xl font-bold text-gray-900">{stats.totalOrders}</Text>
                </div>
                <Calendar className="w-6 h-6 text-gray-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Total Revenue</Text>
                  <Text className="text-2xl font-bold text-green-600">${stats.totalSpent.toLocaleString()}</Text>
                </div>
                <MapPin className="w-6 h-6 text-gray-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Offline</Text>
                  <Text className="text-2xl font-bold text-gray-600">{stats.inactive}</Text>
                </div>
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              </div>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search customers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'secondary'}
                  onClick={() => setStatusFilter('active')}
                  size="sm"
                >
                  Online ({stats.active})
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'primary' : 'secondary'}
                  onClick={() => setStatusFilter('inactive')}
                  size="sm"
                >
                  Offline ({stats.inactive})
                </Button>
              </div>

              {/* View Mode */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                  onClick={() => setViewMode('grid')}
                  size="sm"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'secondary'}
                  onClick={() => setViewMode('list')}
                  size="sm"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Customers List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCustomers.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <Text className="text-gray-500">
                  No customers found matching your criteria.
                </Text>
              </Card>
            ) : (
              filteredCustomers.map((customer) => (
                <Card key={customer.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Heading level={3} className="text-lg font-semibold">
                            {customer.name}
                          </Heading>
                          <div className={`w-3 h-3 rounded-full ${customer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Mail className="w-4 h-4" />
                          <Text>{customer.email}</Text>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <Text className="text-gray-600">Last Login:</Text>
                        <Text className="font-medium">
                          {customer.lastLogin.toLocaleDateString()} {customer.lastLogin.toLocaleTimeString()}
                        </Text>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <Text className="text-gray-600">Login Count:</Text>
                        <Text className="font-medium">{customer.loginCount}</Text>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <Text className="text-gray-600">Total Orders:</Text>
                        <Text className="font-medium">{customer.totalOrders}</Text>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <Text className="text-gray-600">Total Spent:</Text>
                        <Text className="font-medium text-green-600">${customer.totalSpent.toLocaleString()}</Text>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <Text className="text-gray-600">Registration:</Text>
                        <Text className="font-medium">
                          {customer.registrationDate.toLocaleDateString()}
                        </Text>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Button
                        onClick={() => setSelectedCustomer(customer)}
                        variant="secondary"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {customer.isOnline ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <UserCheck className="w-4 h-4" />
                            Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 text-sm">
                            <UserX className="w-4 h-4" />
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Container>
      </Section>
    </div>
  );
}
