'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Journey, JourneyStatus } from '@/types';

interface JourneyManagementContextType {
  journeys: Journey[];
  updateJourneyStatus: (journeyId: string, status: JourneyStatus) => void;
  updateJourney: (journeyId: string, updates: Partial<Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  addJourney: (journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteJourney: (journeyId: string) => void;
  getJourneysByStatus: (status: JourneyStatus) => Journey[];
  getJourneysByCategory: (category: string) => Journey[];
  getJourneysByRegion: (region: string) => Journey[];
  getFeaturedJourneys: () => Journey[];
  isLoading: boolean;
}

const JourneyManagementContext = createContext<JourneyManagementContextType | undefined>(undefined);

export const useJourneyManagement = () => {
  const context = useContext(JourneyManagementContext);
  if (context === undefined) {
    throw new Error('useJourneyManagement must be used within a JourneyManagementProvider');
  }
  return context;
};

interface JourneyManagementProviderProps {
  children: ReactNode;
}

// 默认旅行卡片数据
const defaultJourneys: Journey[] = [
  {
    id: 'journey-1',
    title: 'Chengdu Deep Dive',
    description: 'Designed for food and culture enthusiasts. Visit the Panda Base in the morning, then head to the Sichuan Cuisine Museum for a hands-on experience with snack making and tasting. In the afternoon, enjoy a face-changing performance of Sichuan Opera. The day concludes with a classic Chengdu hot pot dinner, offering a deep dive into Sichuan\'s culinary and artistic heritage.',
    shortDescription: 'A comprehensive food and culture experience in Chengdu',
    image: '/images/journey-cards/chengdu-deep-dive.jpeg',
    images: [
      '/images/journey-cards/chengdu-deep-dive.jpeg',
      '/images/journey-cards/chengdu-daytour/panda-base.jpeg',
      '/images/journey-cards/chengdu-daytour/cooking-class.jpg'
    ],
    duration: '1 Day',
    price: 299,
    originalPrice: 399,
    category: 'Food',
    region: 'Sichuan',
    city: 'Chengdu',
    location: 'Chengdu, Sichuan',
    difficulty: 'Easy',
    maxParticipants: 12,
    minParticipants: 2,
    included: [
      'Professional English-speaking guide',
      'All entrance fees',
      'Transportation',
      'Lunch and dinner',
      'Panda Base visit',
      'Sichuan Opera performance'
    ],
    excluded: [
      'Personal expenses',
      'Tips for guide and driver',
      'Hotel accommodation'
    ],
    highlights: [
      'Visit Chengdu Panda Base',
      'Hands-on cooking experience',
      'Sichuan Opera face-changing show',
      'Authentic hot pot dinner'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Chengdu Food & Culture Experience',
        description: 'Full day exploration of Chengdu\'s culinary and cultural heritage',
        activities: [
          'Morning: Chengdu Panda Base visit',
          'Afternoon: Sichuan Cuisine Museum with cooking class',
          'Evening: Sichuan Opera performance and hot pot dinner'
        ],
        meals: ['Lunch at local restaurant', 'Hot pot dinner'],
        accommodation: 'Not included',
        image: '/images/journey-cards/chengdu-daytour/panda-base.jpeg'
      }
    ],
    modules: [],
    experiences: ['exp-1', 'exp-2'],
    accommodations: ['hotel-1', 'hotel-2'],
    availableExperiences: ['exp-1', 'exp-2', 'exp-3'],
    availableAccommodations: ['hotel-1', 'hotel-2', 'hotel-3'],
    requirements: [
      'Comfortable walking shoes',
      'Camera for photos',
      'Appetite for spicy food'
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.8,
    reviewCount: 156,
    status: 'active',
    featured: true,
    tags: ['food', 'culture', 'pandas', 'sichuan', 'one-day'],
    // 页面生成相关字段
    slug: 'chengdu-city-one-day-deep-dive-dynamic',
    pageTitle: 'Chengdu City One Day Deep Dive',
    metaDescription: 'Experience the best of Chengdu in one day: pandas, Sichuan cuisine, and traditional opera. A perfect blend of nature, flavor, and art.',
    heroImage: '/images/journey-cards/chengdu-daytour/hero-bannner.jpeg',
    heroStats: {
      days: 1,
      destinations: 4,
      maxGuests: 16
    },
    navigation: [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      { name: 'Stays', href: '#stays' },
      { name: 'Details', href: '#details' }
    ],
    overview: {
      breadcrumb: ['Home', 'Journey', 'Group Journey', 'Chengdu One Day Deep Dive'],
      description: 'This one-day tour is specially designed for travelers who wish to deeply experience Chengdu\'s culinary charm and traditional culture. The tour combines adorable giant pandas, interactive food experiences, and captivating Sichuan opera, offering a perfect blend of nature, flavor, and art—all in a single fulfilling day.',
      highlights: [
        {
          icon: '🐼',
          title: 'Meet the Giant Pandas',
          description: 'Get up close with China\'s national treasure at the Chengdu Research Base of Giant Panda Breeding.'
        },
        {
          icon: '🥢',
          title: 'Interactive Food Experience',
          description: 'Visit the Sichuan Cuisine Museum, where you can learn about and even try making classic local snacks.'
        },
        {
          icon: '🎭',
          title: 'Traditional Sichuan Opera',
          description: 'Enjoy an authentic performance featuring face-changing, fire-spitting, and folk music.'
        },
        {
          icon: '🍲',
          title: 'Authentic Hot Pot Dinner',
          description: 'Savor a classic Chengdu hot pot meal—a must-try culinary experience.'
        },
        {
          icon: '👨‍🍳',
          title: 'Hands-On Cultural Activities',
          description: 'Engage in workshops such as snack preparation and spice blending for a deeper understanding of Sichuan food culture.'
        }
      ],
      sideImage: '/images/journey-cards/chengdu-daytour/itinerary-image.png'
    },
    inclusions: [
      {
        icon: 'Car',
        title: 'Transportation',
        description: 'Transportation throughout in private bus. The departure time and meeting point will be arranged by our staff based on your hotel location and schedule.'
      },
      {
        icon: 'Bed',
        title: 'Accommodation',
        description: 'Accommodation is not included in this trip.'
      },
      {
        icon: 'User',
        title: 'Guide',
        description: 'Multilingual local guides are available to serve you.'
      },
      {
        icon: 'Utensils',
        title: 'Meals',
        description: 'Authentic Sichuan cuisine experiences included.'
      }
    ],
    relatedTrips: [
      {
        title: 'Leshan Giant Buddha Day Trip from Chengdu',
        duration: '1 Day',
        price: 'From ¥599',
        image: '/images/journey-cards/leshan-giant-buddha.jpg',
        slug: 'leshan-giant-buddha'
      },
      {
        title: 'Full-Day Tour to the Ancient Dujiangyan Irrigation System',
        duration: '1 Day',
        price: 'From ¥699',
        image: '/images/journey-cards/ancient-dujiangyan-irrigation.jpg',
        slug: 'dujiangyan-irrigation'
      },
      {
        title: 'Jiuzhaigou Valley Multi-Color Lake Adventure',
        duration: '3 Days',
        price: 'From ¥2,999',
        image: '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg',
        slug: 'jiuzhaigou-valley'
      },
      {
        title: 'The Cyberpunk City: Chongqing Day Tour',
        duration: '1 Day',
        price: 'From ¥799',
        image: '/images/journey-cards/chongqing-cyber-city.jpg',
        slug: 'chongqing-city-highlights'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'journey-2',
    title: 'Leshan Giant Buddha Day Trip from Chengdu',
    description: 'Visit the world\'s largest stone Buddha statue, a UNESCO World Heritage Site. Marvel at this 71-meter tall statue carved into the cliff face over 1,200 years ago. Experience the spiritual significance and architectural marvel of ancient Chinese craftsmanship.',
    shortDescription: 'Visit the world\'s largest stone Buddha statue',
    image: '/images/journey-cards/leshan-giant-buddha.jpg',
    images: [
      '/images/journey-cards/leshan-giant-buddha.jpg'
    ],
    duration: '1 Day',
    price: 199,
    category: 'Culture & History',
    region: 'Sichuan',
    city: 'Leshan',
    location: 'Leshan, Sichuan',
    difficulty: 'Easy',
    maxParticipants: 15,
    minParticipants: 2,
    included: [
      'Professional English-speaking guide',
      'All entrance fees',
      'Round-trip transportation from Chengdu',
      'Lunch'
    ],
    excluded: [
      'Personal expenses',
      'Tips for guide and driver',
      'Hotel accommodation'
    ],
    highlights: [
      'UNESCO World Heritage Site',
      '71-meter tall Buddha statue',
      'Ancient Chinese craftsmanship',
      'Spiritual significance'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Leshan Giant Buddha Visit',
        description: 'Full day trip to see the magnificent Giant Buddha',
        activities: [
          'Morning: Depart from Chengdu',
          'Afternoon: Visit Giant Buddha and surrounding temples',
          'Evening: Return to Chengdu'
        ],
        meals: ['Lunch at local restaurant'],
        accommodation: 'Not included'
      }
    ],
    modules: [],
    experiences: ['exp-1', 'exp-2'],
    accommodations: ['hotel-1', 'hotel-2'],
    availableExperiences: ['exp-1', 'exp-2', 'exp-3'],
    availableAccommodations: ['hotel-1', 'hotel-2', 'hotel-3'],
    requirements: [
      'Comfortable walking shoes',
      'Camera for photos',
      'Respectful attitude at religious sites'
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.6,
    reviewCount: 89,
    status: 'active',
    featured: false,
    tags: ['buddha', 'unesco', 'history', 'culture', 'one-day'],
    // 页面生成相关字段
    slug: 'leshan-giant-buddha',
    pageTitle: 'Leshan Giant Buddha Day Trip from Chengdu',
    metaDescription: 'Visit the world\'s largest stone Buddha statue, a UNESCO World Heritage Site. Marvel at this 71-meter tall statue carved into the cliff face over 1,200 years ago.',
    heroImage: '/images/journey-cards/leshan-giant-buddha.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'journey-3',
    title: 'Jiuzhaigou Valley Multi-Color Lake Adventure',
    description: 'Discover the stunning natural beauty of Jiuzhaigou\'s crystal-clear lakes, waterfalls, and colorful forests. This UNESCO World Heritage Site offers breathtaking landscapes and unique Tibetan culture experiences.',
    shortDescription: 'Explore the stunning natural beauty of Jiuzhaigou',
    image: '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg',
    images: [
      '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg',
      '/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg'
    ],
    duration: '3 Days',
    price: 599,
    originalPrice: 799,
    category: 'Adventure',
    region: 'Sichuan',
    city: 'Jiuzhaigou',
    location: 'Jiuzhaigou, Sichuan',
    difficulty: 'Medium',
    maxParticipants: 8,
    minParticipants: 2,
    included: [
      'Professional English-speaking guide',
      'All entrance fees',
      'Transportation',
      '2 nights accommodation',
      'All meals',
      'Tibetan culture experience'
    ],
    excluded: [
      'Personal expenses',
      'Tips for guide and driver',
      'Optional activities'
    ],
    highlights: [
      'UNESCO World Heritage Site',
      'Crystal-clear lakes',
      'Colorful forests',
      'Tibetan culture experience'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival and Valley Exploration',
        description: 'Arrive in Jiuzhaigou and begin exploring the valley',
        activities: [
          'Morning: Depart from Chengdu',
          'Afternoon: Arrive in Jiuzhaigou and check-in',
          'Evening: Local dinner and cultural performance'
        ],
        meals: ['Lunch en route', 'Dinner at hotel'],
        accommodation: 'Jiuzhaigou Valley Hotel'
      },
      {
        day: 2,
        title: 'Full Day Valley Tour',
        description: 'Complete exploration of Jiuzhaigou Valley',
        activities: [
          'Morning: Visit main lakes and waterfalls',
          'Afternoon: Explore Tibetan villages',
          'Evening: Traditional Tibetan dinner'
        ],
        meals: ['Breakfast at hotel', 'Lunch in valley', 'Tibetan dinner'],
        accommodation: 'Jiuzhaigou Valley Hotel'
      },
      {
        day: 3,
        title: 'Huanglong National Park',
        description: 'Visit the colorful travertine pools of Huanglong',
        activities: [
          'Morning: Visit Huanglong National Park',
          'Afternoon: Return to Chengdu',
          'Evening: Arrive back in Chengdu'
        ],
        meals: ['Breakfast at hotel', 'Lunch en route'],
        accommodation: 'Not included'
      }
    ],
    modules: [],
    experiences: ['exp-1', 'exp-2'],
    accommodations: ['hotel-1', 'hotel-2'],
    availableExperiences: ['exp-1', 'exp-2', 'exp-3'],
    availableAccommodations: ['hotel-1', 'hotel-2', 'hotel-3'],
    requirements: [
      'Good physical condition',
      'Warm clothing (mountain climate)',
      'Camera for photos',
      'Altitude sickness medication (if needed)'
    ],
    bestTimeToVisit: ['April', 'May', 'September', 'October'],
    rating: 4.9,
    reviewCount: 234,
    status: 'active',
    featured: true,
    tags: ['nature', 'unesco', 'lakes', 'mountains', 'tibetan', 'multi-day'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const JourneyManagementProvider: React.FC<JourneyManagementProviderProps> = ({ children }) => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载旅行卡片数据，如果没有则使用默认数据
  useEffect(() => {
    const loadJourneys = () => {
      try {
        const storedJourneys = localStorage.getItem('journeys');
        
        if (storedJourneys) {
          const parsedJourneys = JSON.parse(storedJourneys).map((journey: any) => ({
            ...journey,
            createdAt: new Date(journey.createdAt),
            updatedAt: new Date(journey.updatedAt),
          }));
          setJourneys(parsedJourneys);
        } else {
          setJourneys(defaultJourneys);
          saveJourneys(defaultJourneys);
        }
      } catch (error) {
        console.error('Error loading journeys from storage:', error);
        setJourneys(defaultJourneys);
      } finally {
        setIsLoading(false);
      }
    };

    loadJourneys();
  }, []);

  // 保存旅行卡片数据到 localStorage
  const saveJourneys = (journeysData: Journey[]) => {
    try {
      localStorage.setItem('journeys', JSON.stringify(journeysData));
    } catch (error) {
      console.error('Error saving journeys to storage:', error);
    }
  };

  const updateJourneyStatus = (journeyId: string, status: JourneyStatus) => {
    const updatedJourneys = journeys.map(journey => {
      if (journey.id === journeyId) {
        return {
          ...journey,
          status,
          updatedAt: new Date(),
        };
      }
      return journey;
    });
    
    setJourneys(updatedJourneys);
    saveJourneys(updatedJourneys);
    
    console.log(`Journey ${journeyId} status updated to ${status}`);
  };

  const updateJourney = (journeyId: string, updates: Partial<Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const updatedJourneys = journeys.map(journey => {
      if (journey.id === journeyId) {
        return {
          ...journey,
          ...updates,
          updatedAt: new Date(),
        };
      }
      return journey;
    });
    
    setJourneys(updatedJourneys);
    saveJourneys(updatedJourneys);
    
    console.log(`Journey ${journeyId} updated successfully`);
  };

  const addJourney = (journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newJourney: Journey = {
      ...journey,
      id: `journey-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedJourneys = [...journeys, newJourney];
    setJourneys(updatedJourneys);
    saveJourneys(updatedJourneys);
    
    console.log(`New journey added: ${newJourney.id}`);
  };

  const deleteJourney = (journeyId: string) => {
    const updatedJourneys = journeys.filter(journey => journey.id !== journeyId);
    setJourneys(updatedJourneys);
    saveJourneys(updatedJourneys);
    
    console.log(`Journey ${journeyId} deleted`);
  };

  const getJourneysByStatus = (status: JourneyStatus) => {
    return journeys.filter(journey => journey.status === status);
  };

  const getJourneysByCategory = (category: string) => {
    return journeys.filter(journey => journey.category === category);
  };

  const getJourneysByRegion = (region: string) => {
    return journeys.filter(journey => journey.region.toLowerCase() === region.toLowerCase());
  };

  const getFeaturedJourneys = () => {
    return journeys.filter(journey => journey.featured && journey.status === 'active');
  };

  const value: JourneyManagementContextType = {
    journeys,
    updateJourneyStatus,
    updateJourney,
    addJourney,
    deleteJourney,
    getJourneysByStatus,
    getJourneysByCategory,
    getJourneysByRegion,
    getFeaturedJourneys,
    isLoading,
  };

  return (
    <JourneyManagementContext.Provider value={value}>
      {children}
    </JourneyManagementContext.Provider>
  );
};
