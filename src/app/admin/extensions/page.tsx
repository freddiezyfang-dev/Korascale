'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  ToggleLeft,
  ToggleRight,
  Search
} from 'lucide-react';

export default function AdminExtensionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [extensions, setExtensions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }
    fetchExtensions();
  }, [user, router]);

  const fetchExtensions = async () => {
    try {
      const res = await fetch('/api/extensions');
      if (res.ok) {
        const data = await res.json();
        setExtensions(data.extensions || []);
      }
    } catch (error) {
      console.error('Error fetching extensions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个 Extension 吗？')) return;
    
    try {
      const res = await fetch(`/api/extensions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExtensions();
      }
    } catch (error) {
      console.error('Error deleting extension:', error);
      alert('删除失败');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/extensions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchExtensions();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredExtensions = extensions.filter(ext =>
    ext.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Heading level={1} className="text-3xl font-bold">Extensions 管理</Heading>
            <Button onClick={() => router.push('/admin/extensions/add')}>
              <Plus className="w-4 h-4 mr-2" />
              添加 Extension
            </Button>
          </div>

          {/* 搜索栏 */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索 Extensions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Extensions 列表 */}
          {filteredExtensions.length === 0 ? (
            <Card className="p-8 text-center">
              <Text className="text-gray-500 mb-4">
                {searchTerm ? '没有找到匹配的 Extensions' : '暂无 Extensions'}
              </Text>
              {!searchTerm && (
                <Button onClick={() => router.push('/admin/extensions/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建第一个 Extension
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExtensions.map((extension) => (
                <Card key={extension.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Heading level={3} className="text-lg font-semibold mb-2">
                        {extension.title || '未命名 Extension'}
                      </Heading>
                      {extension.days && (
                        <Text size="sm" className="text-gray-600 mb-2">
                          {extension.days}
                        </Text>
                      )}
                      {extension.description && (
                        <Text size="sm" className="text-gray-500 line-clamp-2">
                          {extension.description}
                        </Text>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(extension.id, extension.status)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={extension.status === 'active' ? '设为非活跃' : '设为活跃'}
                      >
                        {extension.status === 'active' ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {extension.image && (
                    <div className="mb-4">
                      <img
                        src={extension.image}
                        alt={extension.title}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/admin/extensions/edit/${extension.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(extension.id)}
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
