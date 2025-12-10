'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Journey, JourneyStatus } from '@/types';
import { dataPersistence } from '@/utils/dataPersistence';
import { journeyAPI } from '@/lib/databaseClient';

interface JourneyManagementContextType {
  journeys: Journey[];
  updateJourneyStatus: (journeyId: string, status: JourneyStatus) => Promise<void>;
  updateJourney: (journeyId: string, updates: Partial<Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Journey | undefined>;
  addJourney: (journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Journey>;
  deleteJourney: (journeyId: string) => Promise<void>;
  getJourneysByStatus: (status: JourneyStatus) => Journey[];
  getJourneysByCategory: (category: string) => Journey[];
  getJourneysByRegion: (region: string) => Journey[];
  getFeaturedJourneys: () => Journey[];
  isLoading: boolean;
  reloadJourneys: () => Promise<void>;
  resetToDefaults: () => void;
  clearStorageAndReload: () => void;
  createBackup: () => boolean;
  restoreFromBackup: () => boolean;
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
    accommodations: ['hotel-7', 'hotel-8'],
    availableExperiences: ['exp-1', 'exp-2', 'exp-3'],
    availableAccommodations: ['hotel-7', 'hotel-8', 'hotel-9'],
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
    slug: 'chengdu-city-one-day-deep-dive',
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
    includes: 'Transportation throughout in private bus. The departure time and meeting point will be arranged by our staff based on your hotel location and schedule.\nServices of an experienced English-speaking guide (other languages like Japanese, Korean, Spanish, German, and French available upon request).\nLeshan snack experience and a Chengdu Hot Pot dinner.\nAll entrance fees to attractions and sites are included.',
    excludes: 'Accommodation is not included in this trip.',
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
    // 页面生成相关字段（补齐必需字段的占位）
    slug: 'leshan-giant-buddha',
    pageTitle: 'Leshan Giant Buddha Day Trip from Chengdu',
    metaDescription: 'Visit the world\'s largest stone Buddha statue, a UNESCO World Heritage Site. Marvel at this 71-meter tall statue carved into the cliff face over 1,200 years ago.',
    heroImage: '/images/journey-cards/leshan-giant-buddha.jpg',
    heroStats: { days: 1, destinations: 2, maxGuests: 16 },
    navigation: [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      { name: 'Details', href: '#details' }
    ],
    overview: {
      breadcrumb: ['Home','Journey','Culture & History','Leshan Giant Buddha'],
      description: 'See the Giant Buddha and surrounding temples',
      highlights: [
        { icon: '🙏', title: 'UNESCO Site', description: 'World-famous stone Buddha' },
        { icon: '🏛️', title: 'Ancient Craftsmanship', description: 'Marvel at ancient engineering' }
      ],
      sideImage: '/images/journey-cards/leshan-giant-buddha.jpg'
    },
    includes: 'Round-trip transportation from Chengdu.\nServices of an experienced English-speaking guide (other languages like Japanese, Korean, Spanish, German, and French available upon request).\nLunch at local restaurant.\nAll entrance fees to attractions and sites are included.',
    excludes: 'Accommodation is not included in this trip.',
    relatedTrips: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'journey-3',
    title: 'Full-Day Tour to the Ancient Dujiangyan Irrigation System',
    description: 'Explore one of China\'s most remarkable engineering achievements, a 2,000-year-old irrigation system that still functions today. Learn about ancient Chinese water management techniques and their impact on Sichuan\'s agriculture.',
    shortDescription: 'Explore ancient Chinese engineering marvel',
    image: '/images/journey-cards/ancient-dujiangyan-irrigation.jpg',
    images: ['/images/journey-cards/ancient-dujiangyan-irrigation.jpg'],
    duration: '1 Day',
    price: 179,
    category: 'Culture & History',
    region: 'Sichuan',
    city: 'Dujiangyan',
    location: 'Dujiangyan, Sichuan',
    difficulty: 'Easy',
    maxParticipants: 12,
    minParticipants: 2,
    included: [
      'Professional English-speaking guide',
      'All entrance fees',
      'Transportation',
      'Lunch'
    ],
    excluded: [
      'Personal expenses',
      'Tips for guide and driver',
      'Hotel accommodation'
    ],
    highlights: [
      '2,000-year-old irrigation system',
      'Ancient Chinese engineering',
      'Still functioning today',
      'UNESCO World Heritage Site'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Dujiangyan Irrigation System Tour',
        description: 'Full day exploration of ancient water management',
        activities: [
          'Morning: Depart from Chengdu',
          'Afternoon: Tour irrigation system and museum',
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
      'Interest in history and engineering'
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.5,
    reviewCount: 67,
    status: 'active',
    featured: false,
    tags: ['history', 'engineering', 'unesco', 'ancient', 'one-day'],
    slug: 'dujiangyan-irrigation',
    pageTitle: 'Full-Day Tour to the Ancient Dujiangyan Irrigation System',
    metaDescription: 'Explore one of China\'s most remarkable engineering achievements, a 2,000-year-old irrigation system that still functions today.',
    heroImage: '/images/journey-cards/ancient-dujiangyan-irrigation.jpg',
    heroStats: { days: 1, destinations: 2, maxGuests: 16 },
    navigation: [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      { name: 'Details', href: '#details' }
    ],
    overview: {
      breadcrumb: ['Home','Journey','Culture & History','Dujiangyan Irrigation'],
      description: 'Explore ancient Chinese water management techniques',
      highlights: [
        { icon: '🏗️', title: 'Ancient Engineering', description: '2,000-year-old system still working' },
        { icon: '🌊', title: 'Water Management', description: 'Revolutionary irrigation techniques' }
      ],
      sideImage: '/images/journey-cards/ancient-dujiangyan-irrigation.jpg'
    },
    includes: 'Round-trip transportation from Chengdu.\nServices of an experienced English-speaking guide.\nLunch at local restaurant.\nAll entrance fees to attractions and sites are included.',
    excludes: 'Accommodation is not included in this trip.',
    relatedTrips: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'journey-4',
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
    // 页面生成字段占位，避免类型缺失
    slug: 'jiuzhaigou-valley',
    pageTitle: 'Jiuzhaigou Valley Multi-Color Lake Adventure',
    metaDescription: 'Discover the stunning natural beauty of Jiuzhaigou\'s crystal-clear lakes and waterfalls.',
    heroImage: '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'journey-5',
    title: 'Jiuzhaigou & Huanglong National Parks Tour from Chengdu',
    description: 'Experience two of China\'s most spectacular natural wonders. Visit the colorful travertine pools of Huanglong and the pristine lakes of Jiuzhaigou, both UNESCO World Heritage Sites.',
    shortDescription: 'Experience two spectacular natural wonders',
    image: '/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg',
    images: ['/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg'],
    duration: '4 Days',
    price: 799,
    category: 'Adventure',
    region: 'Sichuan',
    city: 'Jiuzhaigou',
    location: 'Jiuzhaigou & Huanglong, Sichuan',
    difficulty: 'Medium',
    maxParticipants: 6,
    minParticipants: 2,
    included: [
      'Professional English-speaking guide',
      'All entrance fees',
      'Transportation',
      '3 nights accommodation',
      'All meals',
      'Tibetan culture experience'
    ],
    excluded: [
      'Personal expenses',
      'Tips for guide and driver',
      'Optional activities'
    ],
    highlights: [
      'Two UNESCO World Heritage Sites',
      'Colorful travertine pools',
      'Pristine lakes',
      'Tibetan culture experience'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival and Huanglong Exploration',
        description: 'Arrive and explore Huanglong National Park',
        activities: [
          'Morning: Depart from Chengdu',
          'Afternoon: Arrive and visit Huanglong',
          'Evening: Check-in and dinner'
        ],
        meals: ['Lunch en route', 'Dinner at hotel'],
        accommodation: 'Huanglong Hotel'
      },
      {
        day: 2,
        title: 'Full Day Huanglong Tour',
        description: 'Complete exploration of Huanglong',
        activities: [
          'Morning: Visit travertine pools',
          'Afternoon: Explore surrounding areas',
          'Evening: Traditional dinner'
        ],
        meals: ['Breakfast at hotel', 'Lunch in park', 'Dinner'],
        accommodation: 'Huanglong Hotel'
      },
      {
        day: 3,
        title: 'Jiuzhaigou Valley',
        description: 'Explore Jiuzhaigou Valley',
        activities: [
          'Morning: Travel to Jiuzhaigou',
          'Afternoon: Valley exploration',
          'Evening: Check-in and dinner'
        ],
        meals: ['Breakfast at hotel', 'Lunch en route', 'Dinner'],
        accommodation: 'Jiuzhaigou Hotel'
      },
      {
        day: 4,
        title: 'Return to Chengdu',
        description: 'Complete valley tour and return',
        activities: [
          'Morning: Final valley exploration',
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
    rating: 4.8,
    reviewCount: 156,
    status: 'active',
    featured: false,
    tags: ['nature', 'unesco', 'lakes', 'mountains', 'tibetan', 'multi-day'],
    slug: 'jiuzhaigou-huanglong',
    pageTitle: 'Jiuzhaigou & Huanglong National Parks Tour from Chengdu',
    metaDescription: 'Experience two of China\'s most spectacular natural wonders. Visit the colorful travertine pools of Huanglong and the pristine lakes of Jiuzhaigou.',
    heroImage: '/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg',
    heroStats: { days: 4, destinations: 2, maxGuests: 16 },
    navigation: [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      { name: 'Details', href: '#details' }
    ],
    overview: {
      breadcrumb: ['Home','Journey','Adventure','Jiuzhaigou & Huanglong'],
      description: 'Experience two spectacular natural wonders',
      highlights: [
        { icon: '🏔️', title: 'Two UNESCO Sites', description: 'Jiuzhaigou and Huanglong' },
        { icon: '🌈', title: 'Colorful Pools', description: 'Travertine formations' }
      ],
      sideImage: '/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg'
    },
    includes: 'Transportation throughout the tour.\nServices of an experienced English-speaking guide.\nAll meals included.\n3 nights accommodation included.\nAll entrance fees to attractions and sites are included.',
    excludes: '',
    relatedTrips: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'journey-6',
    title: 'The Cyberpunk City: Chongqing Day Tour',
    description: 'See the best of Chongqing\'s magical and retro vibes in one day. Explore the ancient Ciqikou Old Town in the morning. In the afternoon, experience the Liziba Monorail passing through a residential building, ride the Yangtze River Cableway, and stroll through Longmenhao Old Street. Admire the Hongyadong night view before enjoying a dinner of authentic Chongqing hot pot after a lunch of local noodles. Feel the unique charm of this 8D city.',
    shortDescription: 'Experience Chongqing\'s magical and retro vibes',
    image: '/images/journey-cards/chongqing-cyber-city.jpg',
    images: ['/images/journey-cards/chongqing-cyber-city.jpg'],
    duration: '1 Day',
    price: 249,
    category: 'City',
    region: 'Chongqing',
    city: 'Chongqing',
    location: 'Chongqing',
    difficulty: 'Easy',
    maxParticipants: 10,
    minParticipants: 2,
    included: [
      'Professional English-speaking guide',
      'All entrance fees',
      'Transportation',
      'Lunch and dinner',
      'Cableway ride'
    ],
    excluded: [
      'Personal expenses',
      'Tips for guide and driver',
      'Hotel accommodation'
    ],
    highlights: [
      'Ciqikou Old Town',
      'Liziba Monorail',
      'Yangtze River Cableway',
      'Hongyadong night view',
      'Chongqing hot pot'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Chongqing City Highlights',
        description: 'Full day exploration of Chongqing\'s unique attractions',
        activities: [
          'Morning: Ciqikou Old Town exploration',
          'Afternoon: Liziba Monorail and cableway ride',
          'Evening: Hongyadong night view and hot pot dinner'
        ],
        meals: ['Local noodles lunch', 'Chongqing hot pot dinner'],
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
      'Appetite for spicy food'
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.7,
    reviewCount: 123,
    status: 'active',
    featured: false,
    tags: ['city', 'cyberpunk', 'modern', 'chongqing', 'one-day'],
    slug: 'chongqing-city-highlights',
    pageTitle: 'The Cyberpunk City: Chongqing Day Tour',
    metaDescription: 'See the best of Chongqing\'s magical and retro vibes in one day. Explore ancient old town, modern monorail, and enjoy authentic hot pot.',
    heroImage: '/images/journey-cards/chongqing-cyber-city.jpg',
    heroStats: { days: 1, destinations: 4, maxGuests: 16 },
    navigation: [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      { name: 'Details', href: '#details' }
    ],
    overview: {
      breadcrumb: ['Home','Journey','City','Chongqing Highlights'],
      description: 'Experience Chongqing\'s unique 8D city charm',
      highlights: [
        { icon: '🏙️', title: '8D City', description: 'Unique urban landscape' },
        { icon: '🚇', title: 'Monorail', description: 'Train through building' },
        { icon: '🌉', title: 'Cableway', description: 'Yangtze River crossing' }
      ],
      sideImage: '/images/journey-cards/chongqing-cyber-city.jpg'
    },
    includes: 'Transportation throughout the tour.\nServices of an experienced English-speaking guide.\nLocal noodles lunch and Chongqing hot pot dinner.\nAll entrance fees to attractions and sites are included.',
    excludes: 'Accommodation is not included in this trip.',
    relatedTrips: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'journey-7',
    title: 'Chongqing and Wulong Karst National Park 2-Day Adventure',
    description: 'Explore the dramatic karst landscapes of Wulong, famous for its natural bridges and limestone formations. Experience the Three Natural Bridges and Furong Cave, showcasing millions of years of geological evolution.',
    shortDescription: 'Explore dramatic karst landscapes',
    image: '/images/journey-cards/chongqing-wulong-karst-national-park.jpg',
    images: ['/images/journey-cards/chongqing-wulong-karst-national-park.jpg'],
    duration: '2 Days',
    price: 399,
    category: 'Adventure',
    region: 'Chongqing',
    city: 'Wulong',
    location: 'Wulong, Chongqing',
    difficulty: 'Medium',
    maxParticipants: 8,
    minParticipants: 2,
    included: [
      'Professional English-speaking guide',
      'All entrance fees',
      'Transportation',
      '1 night accommodation',
      'All meals'
    ],
    excluded: [
      'Personal expenses',
      'Tips for guide and driver',
      'Optional activities'
    ],
    highlights: [
      'Three Natural Bridges',
      'Furong Cave',
      'Karst landscapes',
      'Geological formations'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Wulong Karst Exploration',
        description: 'Explore Three Natural Bridges',
        activities: [
          'Morning: Depart from Chongqing',
          'Afternoon: Visit Three Natural Bridges',
          'Evening: Check-in and dinner'
        ],
        meals: ['Lunch en route', 'Dinner at hotel'],
        accommodation: 'Wulong Hotel'
      },
      {
        day: 2,
        title: 'Furong Cave and Return',
        description: 'Explore Furong Cave and return to Chongqing',
        activities: [
          'Morning: Visit Furong Cave',
          'Afternoon: Return to Chongqing',
          'Evening: Arrive back in Chongqing'
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
      'Comfortable walking shoes',
      'Camera for photos'
    ],
    bestTimeToVisit: ['March', 'April', 'May', 'September', 'October', 'November'],
    rating: 4.6,
    reviewCount: 89,
    status: 'active',
    featured: false,
    tags: ['adventure', 'karst', 'nature', 'chongqing', 'multi-day'],
    slug: 'chongqing-wulong-karst',
    pageTitle: 'Chongqing and Wulong Karst National Park 2-Day Adventure',
    metaDescription: 'Explore the dramatic karst landscapes of Wulong, famous for its natural bridges and limestone formations.',
    heroImage: '/images/journey-cards/chongqing-wulong-karst-national-park.jpg',
    heroStats: { days: 2, destinations: 2, maxGuests: 16 },
    navigation: [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      { name: 'Details', href: '#details' }
    ],
    overview: {
      breadcrumb: ['Home','Journey','Adventure','Wulong Karst'],
      description: 'Explore dramatic karst landscapes',
      highlights: [
        { icon: '🌉', title: 'Natural Bridges', description: 'Three spectacular bridges' },
        { icon: '🕳️', title: 'Furong Cave', description: 'Massive limestone cave' }
      ],
      sideImage: '/images/journey-cards/chongqing-wulong-karst-national-park.jpg'
    },
    includes: 'Transportation throughout the tour.\nServices of an experienced English-speaking guide.\nAll meals included.\n1 night accommodation included.\nAll entrance fees to attractions and sites are included.',
    excludes: '',
    relatedTrips: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const JourneyManagementProvider: React.FC<JourneyManagementProviderProps> = ({ children }) => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从数据库加载旅行卡片数据的函数
  const loadJourneys = async () => {
    try {
      console.log('JourneyManagementContext: Loading journeys from database...');
      setIsLoading(true);
      
      // 首先尝试从数据库加载
      const dbJourneys = await journeyAPI.getAll();
      
      if (dbJourneys.length > 0) {
        console.log('JourneyManagementContext: Loaded from database:', dbJourneys.length, 'journeys');
        setJourneys(dbJourneys);
      } else {
        // 如果没有数据库数据，尝试从localStorage加载（向后兼容）
        const storedJourneys = localStorage.getItem('journeys');
        if (storedJourneys) {
          const parsedJourneys = JSON.parse(storedJourneys).map((journey: any) => ({
            ...journey,
            createdAt: new Date(journey.createdAt),
            updatedAt: new Date(journey.updatedAt),
          }));
          
          console.log('JourneyManagementContext: Migrating from localStorage:', parsedJourneys.length, 'journeys');
          setJourneys(parsedJourneys);
          
          // 迁移到数据库（异步执行，不阻塞）
          parsedJourneys.forEach(async (journey: any) => {
            try {
              await journeyAPI.create(journey);
            } catch (error) {
              console.error('Error migrating journey to database:', error);
            }
          });
        } else {
          console.log('JourneyManagementContext: No stored journeys, using default data');
          setJourneys(defaultJourneys);
        }
      }
    } catch (error) {
      console.error('Error loading journeys from database:', error);
      
      // 如果数据库失败，使用localStorage作为fallback
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
        }
      } catch (localStorageError) {
        console.error('Error loading from localStorage:', localStorageError);
        setJourneys(defaultJourneys);
      }
    } finally {
      // 确保 isLoading 总是被设置为 false
      setIsLoading(false);
    }
  };

  // 从数据库加载旅行卡片数据（首次加载）
  useEffect(() => {
    loadJourneys();
  }, []);

  // 定期刷新数据（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('JourneyManagementContext: Auto-refreshing journeys...');
      loadJourneys();
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, []);

  // 当页面重新获得焦点时刷新数据
  useEffect(() => {
    const handleFocus = () => {
      console.log('JourneyManagementContext: Page focused, refreshing journeys...');
      loadJourneys();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 手动刷新函数
  const reloadJourneys = async () => {
    await loadJourneys();
  };

  // 保存旅行卡片数据到持久化存储
  const saveJourneys = async (journeysData: Journey[]) => {
    try {
      // 保存到localStorage（向后兼容）
      localStorage.setItem('journeys', JSON.stringify(journeysData));
      console.log('JourneyManagementContext: Saved journeys count:', journeysData.length);
      
      // 保存到持久化存储
      await dataPersistence.saveData({ journeys: journeysData });
      console.log('JourneyManagementContext: Saved to persistent storage');
      
      // 自动创建备份
      await dataPersistence.createBackup();
      console.log('JourneyManagementContext: Auto-backup created');
      
    } catch (error) {
      console.error('Error saving journeys to storage:', error);
    }
  };

  // 强制重置为默认数据
  const resetToDefaults = () => {
    console.log('JourneyManagementContext: Force resetting to default journeys');
    setJourneys(defaultJourneys);
    saveJourneys(defaultJourneys);
  };

  // 清除localStorage并重新加载
  const clearStorageAndReload = () => {
    console.log('JourneyManagementContext: Clearing localStorage and reloading');
    localStorage.removeItem('journeys');
    setJourneys(defaultJourneys);
    saveJourneys(defaultJourneys);
  };

  // 创建数据备份
  const createBackup = () => {
    try {
      const backup = {
        journeys: journeys,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('journeys_backup', JSON.stringify(backup));
      console.log('JourneyManagementContext: Backup created with', journeys.length, 'journeys');
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  };

  // 从备份恢复数据
  const restoreFromBackup = () => {
    try {
      const backup = localStorage.getItem('journeys_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        if (parsedBackup.journeys && Array.isArray(parsedBackup.journeys)) {
          console.log('JourneyManagementContext: Restoring from backup with', parsedBackup.journeys.length, 'journeys');
          setJourneys(parsedBackup.journeys);
          saveJourneys(parsedBackup.journeys);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  };

  const updateJourneyStatus = async (journeyId: string, status: JourneyStatus) => {
    try {
      // 🔥 自动保存到数据库
      await journeyAPI.updateStatus(journeyId, status);
      
      // 更新本地状态
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
      
      // 同时保存到localStorage作为备份
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.log(`✅ Journey ${journeyId} status updated to ${status} in database`);
    } catch (error) {
      console.error('Error updating journey status in database:', error);
      
      // 如果数据库失败，更新localStorage作为fallback
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
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.warn('⚠️ Journey status updated in localStorage (database unavailable)');
    }
  };

  const updateJourney = async (journeyId: string, updates: Partial<Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      // 🔥 自动保存到数据库
      const updatedJourney = await journeyAPI.update(journeyId, updates);
      
      // 更新本地状态
      const updatedJourneys = journeys.map(journey => 
        journey.id === journeyId ? updatedJourney : journey
      );
      setJourneys(updatedJourneys);
      
      // 同时保存到localStorage作为备份
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.log(`✅ Journey ${journeyId} updated in database`);
      return updatedJourney;
    } catch (error) {
      console.error('Error updating journey in database:', error);
      
      // 如果数据库失败，更新localStorage作为fallback
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
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.warn('⚠️ Journey updated in localStorage (database unavailable)');
      return undefined;
    }
  };

  const addJourney = async (journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 🔥 自动保存到数据库
      const savedJourney = await journeyAPI.create(journey);
      
      // 更新本地状态
      const updatedJourneys = [...journeys, savedJourney];
      setJourneys(updatedJourneys);
      
      // 同时保存到localStorage作为备份
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.log(`✅ New journey saved to database: ${savedJourney.id}`);
      return savedJourney;
    } catch (error) {
      console.error('Error saving journey to database:', error);
      
      // 如果数据库失败，保存到localStorage作为fallback
      const newJourney: Journey = {
        ...journey,
        id: `journey-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedJourneys = [...journeys, newJourney];
      setJourneys(updatedJourneys);
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.warn('⚠️ Journey saved to localStorage (database unavailable)');
      return newJourney;
    }
  };

  const deleteJourney = async (journeyId: string) => {
    try {
      // 🔥 自动从数据库删除
      await journeyAPI.delete(journeyId);
      
      // 更新本地状态
      const updatedJourneys = journeys.filter(journey => journey.id !== journeyId);
      setJourneys(updatedJourneys);
      
      // 同时更新localStorage作为备份
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.log(`✅ Journey ${journeyId} deleted from database`);
    } catch (error) {
      console.error('Error deleting journey from database:', error);
      
      // 如果数据库失败，从localStorage删除作为fallback
      const updatedJourneys = journeys.filter(journey => journey.id !== journeyId);
      setJourneys(updatedJourneys);
      localStorage.setItem('journeys', JSON.stringify(updatedJourneys));
      
      console.warn('⚠️ Journey deleted from localStorage (database unavailable)');
    }
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
    reloadJourneys,
    resetToDefaults,
    clearStorageAndReload,
    createBackup,
    restoreFromBackup,
  };

  return (
    <JourneyManagementContext.Provider value={value}>
      {children}
    </JourneyManagementContext.Provider>
  );
};
