'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Experience, ExperienceStatus, ExperienceType, ExperienceDifficulty } from '@/types/experience';

interface ExperienceManagementContextType {
  experiences: Experience[];
  updateExperienceStatus: (experienceId: string, status: ExperienceStatus) => void;
  updateExperience: (experienceId: string, updates: Partial<Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  addExperience: (experience: Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteExperience: (experienceId: string) => void;
  getExperiencesByStatus: (status: ExperienceStatus) => Experience[];
  getExperiencesByType: (type: ExperienceType) => Experience[];
  getExperiencesByRegion: (region: string) => Experience[];
  getFeaturedExperiences: () => Experience[];
  isLoading: boolean;
}

const ExperienceManagementContext = createContext<ExperienceManagementContextType | undefined>(undefined);

export const useExperienceManagement = () => {
  const context = useContext(ExperienceManagementContext);
  if (context === undefined) {
    throw new Error('useExperienceManagement must be used within an ExperienceManagementProvider');
  }
  return context;
};

interface ExperienceManagementProviderProps {
  children: ReactNode;
}

// 默认体验数据
const defaultExperiences: Experience[] = [
  {
    id: 'exp-1',
    title: 'Sichuan Cooking Class with Local Market Visit',
    description: 'Learn authentic Sichuan cooking techniques from local chefs and visit traditional markets to source fresh ingredients. This hands-on experience will teach you the secrets of Sichuan cuisine, from selecting the perfect spices to mastering the art of wok cooking.',
    shortDescription: 'Learn authentic Sichuan cooking techniques from local chefs',
    image: '/images/journey-cards/chengdu-daytour/cooking-class.jpg',
    images: [
      '/images/journey-cards/chengdu-daytour/cooking-class.jpg',
      '/images/journey-cards/chengdu-daytour/panda-base.jpeg'
    ],
    price: 299,
    originalPrice: 399,
    duration: '3 Hours',
    type: 'cooking',
    difficulty: 'Easy',
    location: 'Chengdu, Sichuan',
    city: 'Chengdu',
    region: 'Sichuan',
    maxParticipants: 8,
    minParticipants: 2,
    included: [
      'Professional cooking instructor',
      'All ingredients and equipment',
      'Market visit and ingredient selection',
      'Recipe cards to take home',
      'Lunch with prepared dishes'
    ],
    excluded: [
      'Transportation to cooking school',
      'Personal shopping at market',
      'Alcoholic beverages'
    ],
    requirements: [
      'Comfortable clothes that can get dirty',
      'Closed-toe shoes',
      'Appetite for spicy food'
    ],
    highlights: [
      'Visit local spice market',
      'Learn traditional wok techniques',
      'Prepare 3-4 authentic dishes',
      'Taste your creations'
    ],
    itinerary: [
      {
        step: 1,
        title: 'Market Visit',
        description: 'Explore local spice market and learn about Sichuan ingredients',
        duration: '45 minutes',
        image: '/images/journey-cards/chengdu-daytour/cooking-class.jpg'
      },
      {
        step: 2,
        title: 'Cooking Preparation',
        description: 'Set up cooking station and prepare ingredients',
        duration: '30 minutes'
      },
      {
        step: 3,
        title: 'Hands-on Cooking',
        description: 'Learn and practice Sichuan cooking techniques',
        duration: '90 minutes'
      },
      {
        step: 4,
        title: 'Tasting and Sharing',
        description: 'Enjoy your prepared dishes and share cooking tips',
        duration: '45 minutes'
      }
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.8,
    reviewCount: 89,
    status: 'active',
    featured: true,
    tags: ['cooking', 'food', 'culture', 'hands-on', 'sichuan'],
    slug: 'sichuan-cooking-class-market-visit',
    pageTitle: 'Sichuan Cooking Class with Local Market Visit',
    metaDescription: 'Learn authentic Sichuan cooking techniques from local chefs. Visit traditional markets, master wok cooking, and prepare 3-4 authentic dishes in this hands-on culinary experience.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'exp-2',
    title: 'Traditional Tea Ceremony Experience',
    description: 'Experience the ancient art of Chinese tea ceremony in a traditional teahouse setting. Learn about different types of Chinese tea, proper brewing techniques, and the cultural significance of tea in Chinese society.',
    shortDescription: 'Experience the ancient art of Chinese tea ceremony',
    image: '/images/journey-cards/chengdu-daytour/face-changing-opera.jpg',
    images: [
      '/images/journey-cards/chengdu-daytour/face-changing-opera.jpg'
    ],
    price: 199,
    duration: '2 Hours',
    type: 'cultural',
    difficulty: 'Easy',
    location: 'Chengdu, Sichuan',
    city: 'Chengdu',
    region: 'Sichuan',
    maxParticipants: 6,
    minParticipants: 1,
    included: [
      'Professional tea master',
      'Traditional teahouse setting',
      'Multiple tea tastings',
      'Tea ceremony demonstration',
      'Tea knowledge sharing'
    ],
    excluded: [
      'Transportation to teahouse',
      'Personal tea purchases'
    ],
    requirements: [
      'Comfortable sitting position',
      'Open mind for cultural learning'
    ],
    highlights: [
      'Learn proper tea brewing techniques',
      'Taste 5 different Chinese teas',
      'Understand tea culture and history',
      'Peaceful traditional setting'
    ],
    itinerary: [
      {
        step: 1,
        title: 'Tea Introduction',
        description: 'Learn about different types of Chinese tea and their properties',
        duration: '30 minutes'
      },
      {
        step: 2,
        title: 'Ceremony Demonstration',
        description: 'Watch traditional tea ceremony performed by master',
        duration: '45 minutes'
      },
      {
        step: 3,
        title: 'Hands-on Practice',
        description: 'Practice tea brewing techniques yourself',
        duration: '45 minutes'
      }
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.6,
    reviewCount: 67,
    status: 'active',
    featured: false,
    tags: ['tea', 'culture', 'traditional', 'meditation', 'chinese'],
    slug: 'traditional-tea-ceremony-experience',
    pageTitle: 'Traditional Tea Ceremony Experience',
    metaDescription: 'Experience the ancient art of Chinese tea ceremony in a traditional teahouse. Learn brewing techniques, taste different teas, and understand Chinese tea culture.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'exp-3',
    title: 'Sichuan Opera Face-Changing Workshop',
    description: 'Learn the secrets of Sichuan opera face-changing technique from professional performers. This unique cultural experience will teach you about this ancient art form and let you try the face-changing technique yourself.',
    shortDescription: 'Learn the secrets of Sichuan opera face-changing technique',
    image: '/images/journey-cards/chengdu-daytour/face-changing-opera.jpg',
    images: [
      '/images/journey-cards/chengdu-daytour/face-changing-opera.jpg'
    ],
    price: 399,
    duration: '4 Hours',
    type: 'cultural',
    difficulty: 'Medium',
    location: 'Chengdu, Sichuan',
    city: 'Chengdu',
    region: 'Sichuan',
    maxParticipants: 4,
    minParticipants: 2,
    included: [
      'Professional opera performer instructor',
      'Traditional opera costumes',
      'Face-changing masks and props',
      'Performance demonstration',
      'Photo opportunities in costume'
    ],
    excluded: [
      'Transportation to opera school',
      'Personal costume purchases'
    ],
    requirements: [
      'Comfortable clothes for movement',
      'No makeup (will be provided)',
      'Basic physical flexibility'
    ],
    highlights: [
      'Learn face-changing techniques',
      'Wear traditional opera costumes',
      'Watch professional performance',
      'Try face-changing yourself'
    ],
    itinerary: [
      {
        step: 1,
        title: 'Introduction to Sichuan Opera',
        description: 'Learn about the history and significance of Sichuan opera',
        duration: '45 minutes'
      },
      {
        step: 2,
        title: 'Costume and Makeup',
        description: 'Get dressed in traditional opera costumes and makeup',
        duration: '60 minutes'
      },
      {
        step: 3,
        title: 'Face-Changing Techniques',
        description: 'Learn the basic techniques of face-changing',
        duration: '90 minutes'
      },
      {
        step: 4,
        title: 'Performance Practice',
        description: 'Practice your face-changing skills and perform',
        duration: '45 minutes'
      }
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.9,
    reviewCount: 45,
    status: 'active',
    featured: true,
    tags: ['opera', 'culture', 'performance', 'traditional', 'face-changing'],
    slug: 'sichuan-opera-face-changing-workshop',
    pageTitle: 'Sichuan Opera Face-Changing Workshop',
    metaDescription: 'Learn the secrets of Sichuan opera face-changing technique from professional performers. Wear traditional costumes and master this ancient art form.',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const ExperienceManagementProvider: React.FC<ExperienceManagementProviderProps> = ({ children }) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载体验数据
  useEffect(() => {
    const loadExperiences = () => {
      try {
        const storedExperiences = localStorage.getItem('experiences');
        
        if (storedExperiences) {
          const parsedExperiences = JSON.parse(storedExperiences).map((exp: any) => ({
            ...exp,
            createdAt: new Date(exp.createdAt),
            updatedAt: new Date(exp.updatedAt),
          }));
          setExperiences(parsedExperiences);
        } else {
          setExperiences(defaultExperiences);
          saveExperiences(defaultExperiences);
        }
      } catch (error) {
        console.error('Error loading experiences from storage:', error);
        setExperiences(defaultExperiences);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiences();
  }, []);

  // 保存体验数据到 localStorage
  const saveExperiences = (experiencesData: Experience[]) => {
    try {
      localStorage.setItem('experiences', JSON.stringify(experiencesData));
    } catch (error) {
      console.error('Error saving experiences to storage:', error);
    }
  };

  const updateExperienceStatus = (experienceId: string, status: ExperienceStatus) => {
    const updatedExperiences = experiences.map(exp => {
      if (exp.id === experienceId) {
        return {
          ...exp,
          status,
          updatedAt: new Date(),
        };
      }
      return exp;
    });
    
    setExperiences(updatedExperiences);
    saveExperiences(updatedExperiences);
    
    console.log(`Experience ${experienceId} status updated to ${status}`);
  };

  const updateExperience = (experienceId: string, updates: Partial<Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const updatedExperiences = experiences.map(exp => {
      if (exp.id === experienceId) {
        return {
          ...exp,
          ...updates,
          updatedAt: new Date(),
        };
      }
      return exp;
    });
    
    setExperiences(updatedExperiences);
    saveExperiences(updatedExperiences);
    
    console.log(`Experience ${experienceId} updated successfully`);
  };

  const addExperience = (experience: Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExperience: Experience = {
      ...experience,
      id: `exp-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedExperiences = [...experiences, newExperience];
    setExperiences(updatedExperiences);
    saveExperiences(updatedExperiences);
    
    console.log(`New experience added: ${newExperience.id}`);
  };

  const deleteExperience = (experienceId: string) => {
    const updatedExperiences = experiences.filter(exp => exp.id !== experienceId);
    setExperiences(updatedExperiences);
    saveExperiences(updatedExperiences);
    
    console.log(`Experience ${experienceId} deleted`);
  };

  const getExperiencesByStatus = (status: ExperienceStatus) => {
    return experiences.filter(exp => exp.status === status);
  };

  const getExperiencesByType = (type: ExperienceType) => {
    return experiences.filter(exp => exp.type === type);
  };

  const getExperiencesByRegion = (region: string) => {
    return experiences.filter(exp => exp.region.toLowerCase() === region.toLowerCase());
  };

  const getFeaturedExperiences = () => {
    return experiences.filter(exp => exp.featured && exp.status === 'active');
  };

  const value: ExperienceManagementContextType = {
    experiences,
    updateExperienceStatus,
    updateExperience,
    addExperience,
    deleteExperience,
    getExperiencesByStatus,
    getExperiencesByType,
    getExperiencesByRegion,
    getFeaturedExperiences,
    isLoading,
  };

  return (
    <ExperienceManagementContext.Provider value={value}>
      {children}
    </ExperienceManagementContext.Provider>
  );
};












