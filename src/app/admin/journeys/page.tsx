'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { Journey, JourneyStatus } from '@/types';
import { migrateExistingPage, validateMigratedPage } from '@/lib/pageMigration';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { checkDataStatus, createEmergencyBackup, restoreFromEmergencyBackup } from '@/utils/dataRecovery';
import { 
  MapPin, 
  Star, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Heart,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Wand2
} from 'lucide-react';

const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Journey is available for booking'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Journey is not available for booking'
  },
  draft: { 
    label: 'Draft', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Journey is being prepared'
  },
  // 兼容后端返回的 published 状态（等同已发布）
  published: {
    label: 'Published',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Journey is published'
  }
};

const categoryConfig = {
  'Food': { label: 'Food', color: 'bg-orange-100 text-orange-800' },
  'Culture & History': { label: 'Culture & History', color: 'bg-purple-100 text-purple-800' },
  'Adventure': { label: 'Adventure', color: 'bg-green-100 text-green-800' },
  'City': { label: 'City', color: 'bg-blue-100 text-blue-800' },
  'Nature': { label: 'Nature', color: 'bg-emerald-100 text-emerald-800' },
  'Spiritual': { label: 'Spiritual', color: 'bg-indigo-100 text-indigo-800' },
};

const difficultyConfig = {
  'Easy': { label: 'Easy', color: 'bg-green-100 text-green-800' },
  'Medium': { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  'Hard': { label: 'Hard', color: 'bg-red-100 text-red-800' },
};

export default function AdminJourneysPage() {
  const { user, logout } = useUser();
  const { 
    journeys, 
    updateJourneyStatus, 
    updateJourney,
    deleteJourney,
    getJourneysByStatus, 
    getJourneysByCategory, 
    getJourneysByRegion,
    isLoading,
    reloadJourneys,
    clearStorageAndReload,
    createBackup,
    restoreFromBackup
  } = useJourneyManagement();
  const router = useRouter();
  const { 
    isModalOpen, 
    isDeleting, 
    deleteOptions, 
    confirmDelete, 
    handleConfirm, 
    handleClose 
  } = useDeleteConfirmation();
  
  const [selectedStatus, setSelectedStatus] = useState<JourneyStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dataStatus, setDataStatus] = useState<any>(null);

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

  // 检查数据状态
  useEffect(() => {
    const status = checkDataStatus();
    setDataStatus(status);
    console.log('Data Status Check:', status);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleStatusToggle = (journeyId: string, currentStatus: JourneyStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateJourneyStatus(journeyId, newStatus);
  };

  const handleDeleteJourney = (journey: Journey) => {
    confirmDelete({
      title: 'Delete Journey',
      description: 'This will permanently remove the journey and all associated data.',
      itemName: journey.title,
      itemType: 'journey',
      onConfirm: () => deleteJourney(journey.id)
    });
  };

  const handleMigrateJourney = (journey: Journey) => {
    const migratedData = migrateExistingPage(journey);
    updateJourney(journey.id, migratedData);
    alert('页面已成功迁移到新模板系统！');
  };

  // 获取所有分类和地区列表
  const categories = Array.from(new Set(journeys.map(journey => journey.category)));
  const regions = Array.from(new Set(journeys.map(journey => journey.region)));

  // 过滤旅行卡片
  const filteredJourneys = journeys.filter(journey => {
    const matchesStatus = selectedStatus === 'all' || journey.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || journey.category === selectedCategory;
    const matchesRegion = selectedRegion === 'all' || journey.region === selectedRegion;
    const matchesSearch = searchTerm === '' || 
      journey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesCategory && matchesRegion && matchesSearch;
  });

  // 统计数据
  const stats = {
    total: journeys.length,
    active: getJourneysByStatus('active').length,
    inactive: getJourneysByStatus('inactive').length,
    draft: getJourneysByStatus('draft').length,
    featured: journeys.filter(j => j.featured && j.status === 'active').length,
    food: getJourneysByCategory('Food').length,
    adventure: getJourneysByCategory('Adventure').length,
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
          <Text className="text-gray-600">Loading journeys...</Text>
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
                  Journey Management
                </Heading>
                <Text size="lg" className="text-gray-600">
                  Manage journey listings and availability
                </Text>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => router.push('/admin/journeys/add')}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New Journey
                </Button>
                
                {/* Emergency Data Recovery Tool */}
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 mb-2">
                    <strong>数据状态检查:</strong> {dataStatus ? (
                      <>
                        localStorage: {dataStatus.localStorageCount} journeys, 
                        备份: {dataStatus.backupCount} journeys, 
                        数据完整: {dataStatus.isDataIntact ? '是' : '否'}
                      </>
                    ) : '检查中...'}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        const restored = restoreFromEmergencyBackup();
                        if (restored) {
                          alert(`从紧急备份恢复了 ${restored.length} 个journey！`);
                          window.location.reload();
                        } else {
                          alert('没有找到紧急备份数据。');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-blue-50 hover:bg-blue-200"
                    >
                      恢复紧急备份
                    </Button>
                    <Button 
                      onClick={() => {
                        if (restoreFromBackup()) {
                          alert('从备份恢复成功！');
                          window.location.reload();
                        } else {
                          alert('没有找到备份数据。');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-yellow-50 hover:bg-yellow-200"
                    >
                      恢复备份
                    </Button>
                    <Button 
                      onClick={() => {
                        if (confirm('这将用默认数据替换所有当前数据。继续吗？')) {
                          clearStorageAndReload();
                          alert('默认journey已恢复！');
                          window.location.reload();
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-red-50 hover:bg-red-200"
                    >
                      恢复默认
                    </Button>
                    <Button 
                      onClick={() => {
                        if (createBackup()) {
                          alert('备份创建成功！');
                        } else {
                          alert('备份创建失败。');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-green-50 hover:bg-green-200"
                    >
                      创建备份
                    </Button>
                    <Button 
                      onClick={async () => {
                        // 清除localStorage缓存
                        localStorage.removeItem('journeys');
                        // 强制从数据库重新加载
                        await reloadJourneys();
                        alert('已清除缓存并从数据库重新加载数据！');
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-purple-50 hover:bg-purple-200"
                    >
                      强制刷新数据
                    </Button>
                  </div>
                </div>
                
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Total Journeys</Text>
                  <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
                </div>
                <MapPin className="w-8 h-8 text-blue-500" />
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
                  <Text className="text-sm font-medium text-gray-600">Draft</Text>
                  <Text className="text-2xl font-bold text-yellow-600">{stats.draft}</Text>
                </div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Featured</Text>
                  <Text className="text-2xl font-bold text-purple-600">{stats.featured}</Text>
                </div>
                <Heart className="w-6 h-6 text-purple-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600">Food Tours</Text>
                  <Text className="text-2xl font-bold text-orange-600">{stats.food}</Text>
                </div>
                <DollarSign className="w-6 h-6 text-orange-500" />
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
                    placeholder="Search journeys by title, description, city, or tags..."
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
                <Button
                  variant={selectedStatus === 'draft' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedStatus('draft')}
                  size="sm"
                >
                  Draft ({stats.draft})
                </Button>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Region Filter */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
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

          {/* Journeys List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredJourneys.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <Text className="text-gray-500">
                  No journeys found matching your criteria.
                </Text>
              </Card>
            ) : (
              filteredJourneys.map((journey) => {
                const statusInfo = statusConfig[journey.status] || statusConfig.draft;
                const categoryInfo = categoryConfig[journey.category] || { label: journey.category || 'Other', color: 'bg-gray-100 text-gray-700' };
                const difficultyInfo = difficultyConfig[journey.difficulty] || { label: journey.difficulty || 'Easy', color: 'bg-gray-100 text-gray-700' };
                
                return (
                  <Card key={journey.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={journey.image}
                        alt={journey.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {statusInfo?.label || 'Draft'}
                        </span>
                        {journey.featured && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Heading level={3} className="text-lg font-semibold mb-1 line-clamp-2">
                            {journey.title}
                          </Heading>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <Text>{journey.city}, {journey.region}</Text>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <Text className="text-sm font-medium">{journey.rating}</Text>
                          <Text className="text-sm text-gray-500">({journey.reviewCount})</Text>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${categoryInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                          {categoryInfo?.label || 'Other'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                          {difficultyInfo?.label || 'Easy'}
                        </span>
                      </div>
                      
                      <Text className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {journey.shortDescription}
                      </Text>

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <Text>{journey.duration}</Text>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <Text>{journey.minParticipants}-{journey.maxParticipants}</Text>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <Text className="font-semibold">${journey.price}</Text>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/admin/journeys/edit/${journey.id}`)}
                            variant="primary"
                            size="sm"
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteJourney(journey)}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                        
                        {journey.slug ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => window.open(`/journeys/${journey.slug}`, '_blank')}
                              variant="secondary"
                              size="sm"
                              className="flex-1"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Page
                            </Button>
                            <Button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/journeys/${journey.slug}`)}
                              variant="secondary"
                              size="sm"
                              className="flex-1"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Copy URL
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleMigrateJourney(journey)}
                            variant="primary"
                            size="sm"
                            className="w-full"
                          >
                            <Wand2 className="w-4 h-4 mr-1" />
                            Migrate to New Template
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleStatusToggle(journey.id, journey.status)}
                          variant={journey.status === 'active' ? 'secondary' : 'primary'}
                          size="sm"
                          className="w-full"
                        >
                          {journey.status === 'active' ? (
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

      {/* Delete Confirmation Modal */}
      {deleteOptions && (
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={deleteOptions.title}
          description={deleteOptions.description}
          itemName={deleteOptions.itemName}
          itemType={deleteOptions.itemType}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
