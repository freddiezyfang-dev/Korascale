'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { Experience, ExperienceStatus, ExperienceType } from '@/types/experience';
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
  Clock,
  Users,
  DollarSign,
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
    description: 'Experience is available for booking'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Experience is not available for booking'
  },
  draft: { 
    label: 'Draft', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Experience is being prepared'
  },
};

const typeConfig = {
  cooking: { label: 'Cooking', color: 'bg-orange-100 text-orange-800' },
  cultural: { label: 'Cultural', color: 'bg-purple-100 text-purple-800' },
  adventure: { label: 'Adventure', color: 'bg-green-100 text-green-800' },
  nature: { label: 'Nature', color: 'bg-emerald-100 text-emerald-800' },
  spiritual: { label: 'Spiritual', color: 'bg-indigo-100 text-indigo-800' },
  entertainment: { label: 'Entertainment', color: 'bg-pink-100 text-pink-800' },
  educational: { label: 'Educational', color: 'bg-blue-100 text-blue-800' },
};

const difficultyConfig = {
  'Easy': { label: 'Easy', color: 'bg-green-100 text-green-800' },
  'Medium': { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  'Hard': { label: 'Hard', color: 'bg-red-100 text-red-800' },
};

export default function AdminExperiencesPage() {
  const { user, logout } = useUser();
  const { 
    experiences, 
    updateExperienceStatus, 
    deleteExperience,
    getExperiencesByStatus, 
    getExperiencesByType, 
    getExperiencesByRegion,
    isLoading 
  } = useExperienceManagement();
  const { journeys } = useJourneyManagement();
  const router = useRouter();
  
  const [selectedStatus, setSelectedStatus] = useState<ExperienceStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ExperienceType | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const handleStatusToggle = (experienceId: string, currentStatus: ExperienceStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateExperienceStatus(experienceId, newStatus);
  };

  const handleDeleteExperience = (experienceId: string) => {
    if (confirm('确定要删除这个体验吗？此操作无法撤销。')) {
      deleteExperience(experienceId);
    }
  };

  // 获取体验所属的旅程
  const getJourneysForExperience = (experienceId: string) => {
    return journeys.filter(journey => 
      journey.experiences?.includes(experienceId) || 
      journey.availableExperiences?.includes(experienceId)
    );
  };

  // 获取所有类型和地区列表
  const types = Array.from(new Set(experiences.map(exp => exp.type)));
  const regions = Array.from(new Set(experiences.map(exp => exp.region)));

  // 过滤体验
  const filteredExperiences = experiences.filter(exp => {
    const matchesStatus = selectedStatus === 'all' || exp.status === selectedStatus;
    const matchesType = selectedType === 'all' || exp.type === selectedType;
    const matchesRegion = selectedRegion === 'all' || exp.region === selectedRegion;
    const matchesSearch = searchTerm === '' || 
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesType && matchesRegion && matchesSearch;
  });

  // 统计数据
  const stats = {
    total: experiences.length,
    active: getExperiencesByStatus('active').length,
    inactive: getExperiencesByStatus('inactive').length,
    draft: getExperiencesByStatus('draft').length,
    featured: experiences.filter(e => e.featured && e.status === 'active').length,
    cooking: getExperiencesByType('cooking').length,
    cultural: getExperiencesByType('cultural').length,
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
          <Text className="text-gray-600">Loading experiences...</Text>
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
                  Experience Management
                </Heading>
                <Text size="lg" className="text-gray-600">
                  Manage experience listings and availability
                </Text>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => router.push('/admin/experiences/add')}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New Experience
                </Button>
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
                  <Text className="text-sm font-medium text-gray-600">Total Experiences</Text>
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
                  <Text className="text-sm font-medium text-gray-600">Cooking</Text>
                  <Text className="text-2xl font-bold text-orange-600">{stats.cooking}</Text>
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
                    placeholder="Search experiences by title, description, city, or tags..."
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

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ExperienceType | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{typeConfig[type]?.label || type}</option>
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

          {/* Experiences List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredExperiences.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <Text className="text-gray-500">
                  No experiences found matching your criteria.
                </Text>
              </Card>
            ) : (
              filteredExperiences.map((experience) => {
                const statusInfo = statusConfig[experience.status];
                const typeInfo = typeConfig[experience.type];
                const difficultyInfo = difficultyConfig[experience.difficulty];
                
                return (
                  <Card key={experience.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={experience.image}
                        alt={experience.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {experience.featured && (
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
                            {experience.title}
                          </Heading>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <Text>{experience.city}, {experience.region}</Text>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <Text className="text-sm font-medium">{experience.rating}</Text>
                          <Text className="text-sm text-gray-500">({experience.reviewCount})</Text>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyInfo.color}`}>
                          {difficultyInfo.label}
                        </span>
                      </div>
                      
                      <Text className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {experience.shortDescription}
                      </Text>

                      {/* Journey Tags */}
                      {getJourneysForExperience(experience.id).length > 0 && (
                        <div className="mb-4">
                          <Text className="text-xs text-gray-500 mb-2">Used in Journeys:</Text>
                          <div className="flex flex-wrap gap-1">
                            {getJourneysForExperience(experience.id).map((journey) => (
                              <span
                                key={journey.id}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                              >
                                {journey.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <Text>{experience.duration}</Text>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <Text>{experience.minParticipants}-{experience.maxParticipants}</Text>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <Text className="font-semibold">¥{experience.price}</Text>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/admin/experiences/edit/${experience.id}`)}
                            variant="primary"
                            size="sm"
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteExperience(experience.id)}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => handleStatusToggle(experience.id, experience.status)}
                          variant={experience.status === 'active' ? 'secondary' : 'primary'}
                          size="sm"
                          className="w-full"
                        >
                          {experience.status === 'active' ? (
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
