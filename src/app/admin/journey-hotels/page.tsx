'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { 
  Plus, 
  Edit, 
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search
} from 'lucide-react';

export default function AdminJourneyHotelsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [hotels, setHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }
    fetchHotels();
  }, [user, router]);

  const fetchHotels = async () => {
    try {
      const res = await fetch('/api/journey-hotels');
      if (res.ok) {
        const data = await res.json();
        setHotels(data.hotels || []);
      }
    } catch (error) {
      console.error('Error fetching journey hotels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个 Hotel 吗？')) return;
    
    try {
      const res = await fetch(`/api/journey-hotels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHotels();
      }
    } catch (error) {
      console.error('Error deleting hotel:', error);
      alert('删除失败');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/journey-hotels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchHotels();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text>加载中...</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="lg">
        <Container size="xl">
          <div className="flex items-center justify-between mb-6">
            <Heading level={1} className="text-3xl font-bold">Journey Hotels 管理</Heading>
            <Button onClick={() => router.push('/admin/journey-hotels/add')}>
              <Plus className="w-4 h-4 mr-2" />
              添加 Hotel
            </Button>
          </div>

          {/* 搜索栏 */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索 Hotels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Hotels 列表 */}
          {filteredHotels.length === 0 ? (
            <Card className="p-8 text-center">
              <Text className="text-gray-500 mb-4">
                {searchTerm ? '没有找到匹配的 Hotels' : '暂无 Hotels'}
              </Text>
              {!searchTerm && (
                <Button onClick={() => router.push('/admin/journey-hotels/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建第一个 Hotel
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <Card key={hotel.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Heading level={3} className="text-lg font-semibold mb-2">
                        {hotel.name || '未命名 Hotel'}
                      </Heading>
                      {hotel.location && (
                        <Text size="sm" className="text-gray-600">
                          {hotel.location}
                        </Text>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(hotel.id, hotel.status)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={hotel.status === 'active' ? '设为非活跃' : '设为活跃'}
                      >
                        {hotel.status === 'active' ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {hotel.image && (
                    <div className="mb-4">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-48 object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/admin/journey-hotels/edit/${hotel.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(hotel.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
