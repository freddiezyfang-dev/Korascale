'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Hotel, HotelStatus } from '@/types';
import { 
  Hotel as HotelIcon, 
  MapPin, 
  Star, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';

const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Hotel is available for booking'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Hotel is not available for booking'
  },
};

const starRatingConfig = {
  luxury: { label: 'Luxury', color: 'bg-purple-100 text-purple-800' },
  upscale: { label: 'Upscale', color: 'bg-blue-100 text-blue-800' },
  comfortable: { label: 'Comfortable', color: 'bg-green-100 text-green-800' },
};

export default function AdminHotelsPage() {
  const { user, logout } = useUser();
  const { hotels, updateHotelStatus, getHotelsByStatus, getHotelsByCity, isLoading } = useHotelManagement();
  const router = useRouter();
  
  const [selectedStatus, setSelectedStatus] = useState<HotelStatus | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

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

  const handleStatusToggle = (hotelId: string, currentStatus: HotelStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateHotelStatus(hotelId, newStatus);
  };

  // 获取所有城市列表
  const cities = Array.from(new Set(hotels.map(hotel => hotel.city)));

  // 过滤酒店
  const filteredHotels = hotels.filter(hotel => {
    const matchesStatus = selectedStatus === 'all' || hotel.status === selectedStatus;
    const matchesCity = selectedCity === 'all' || hotel.city === selectedCity;
    const matchesSearch = searchTerm === '' || 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCity && matchesSearch;
  });

  // 统计数据
  const stats = {
    total: hotels.length,
    active: getHotelsByStatus('active').length,
    inactive: getHotelsByStatus('inactive').length,
    chongqing: getHotelsByCity('Chongqing').length,
    chengdu: getHotelsByCity('Chengdu').length,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-gray-600">Loading hotels...</Text>
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
                  Hotel Management
                </Heading>
                <Text size="lg" className="text-gray-600">
                  Manage hotel listings and availability
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
                  <Text className="text-sm font-medium text-gray-600">Total Hotels</Text>
                  <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
                </div>
                <HotelIcon className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Active</Text>
                  <Text className="text-2xl font-bold text-green-600">{stats.active}</Text>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Inactive</Text>
                  <Text className="text-2xl font-bold text-red-600">{stats.inactive}</Text>
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Chongqing</Text>
                  <Text className="text-2xl font-bold text-gray-900">{stats.chongqing}</Text>
                </div>
                <MapPin className="w-6 h-6 text-gray-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Chengdu</Text>
                  <Text className="text-2xl font-bold text-gray-900">{stats.chengdu}</Text>
                </div>
                <MapPin className="w-6 h-6 text-gray-500" />
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
                    placeholder="Search hotels by name, city, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedStatus('all')}
                  size="sm"
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={selectedStatus === 'active' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedStatus('active')}
                  size="sm"
                >
                  Active ({stats.active})
                </Button>
                <Button
                  variant={selectedStatus === 'inactive' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedStatus('inactive')}
                  size="sm"
                >
                  Inactive ({stats.inactive})
                </Button>
              </div>

              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

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

          {/* Hotels List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredHotels.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <Text className="text-gray-500">
                  No hotels found matching your criteria.
                </Text>
              </Card>
            ) : (
              filteredHotels.map((hotel) => {
                const statusInfo = statusConfig[hotel.status];
                const starInfo = starRatingConfig[hotel.starRating as keyof typeof starRatingConfig];
                
                return (
                  <Card key={hotel.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={hotel.images[0]}
                        alt={hotel.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Heading level={3} className="text-lg font-semibold mb-1 line-clamp-2">
                            {hotel.name}
                          </Heading>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <Text>{hotel.city}, {hotel.location}</Text>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <Text className="text-sm font-medium">{hotel.rating}</Text>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${starInfo.color}`}>
                          {starInfo.label}
                        </span>
                      </div>
                      
                      <Text className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {hotel.description}
                      </Text>
                      
                      <div className="flex items-center justify-between">
                        <Button
                          onClick={() => setSelectedHotel(hotel)}
                          variant="secondary"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        
                        <Button
                          onClick={() => handleStatusToggle(hotel.id, hotel.status)}
                          variant={hotel.status === 'active' ? 'secondary' : 'primary'}
                          size="sm"
                        >
                          {hotel.status === 'active' ? (
                            <>
                              <ToggleRight className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
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
