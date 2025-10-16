'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hotel, HotelStatus } from '@/types';
import hotelsData from '@/data/hotels.json';

interface HotelManagementContextType {
  hotels: Hotel[];
  updateHotelStatus: (hotelId: string, status: HotelStatus) => void;
  getHotelsByStatus: (status: HotelStatus) => Hotel[];
  getHotelsByCity: (city: string) => Hotel[];
  isLoading: boolean;
}

const HotelManagementContext = createContext<HotelManagementContextType | undefined>(undefined);

export const useHotelManagement = () => {
  const context = useContext(HotelManagementContext);
  if (context === undefined) {
    throw new Error('useHotelManagement must be used within a HotelManagementProvider');
  }
  return context;
};

interface HotelManagementProviderProps {
  children: ReactNode;
}

export const HotelManagementProvider: React.FC<HotelManagementProviderProps> = ({ children }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载酒店数据，如果没有则使用默认数据
  useEffect(() => {
    const loadHotels = () => {
      try {
        const storedHotels = localStorage.getItem('hotels');
        
        if (storedHotels) {
          const parsedHotels = JSON.parse(storedHotels).map((hotel: any) => ({
            ...hotel,
            createdAt: new Date(hotel.createdAt),
            updatedAt: new Date(hotel.updatedAt),
          }));
          setHotels(parsedHotels);
        } else {
          // 使用默认数据，所有酒店默认为活跃状态
          const defaultHotels: Hotel[] = hotelsData.hotels.map(hotel => ({
            ...hotel,
            status: 'active' as HotelStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          setHotels(defaultHotels);
          saveHotels(defaultHotels);
        }
      } catch (error) {
        console.error('Error loading hotels from storage:', error);
        // 如果出错，使用默认数据
        const defaultHotels: Hotel[] = hotelsData.hotels.map(hotel => ({
          ...hotel,
          status: 'active' as HotelStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setHotels(defaultHotels);
      } finally {
        setIsLoading(false);
      }
    };

    loadHotels();
  }, []);

  // 保存酒店数据到 localStorage
  const saveHotels = (hotelsData: Hotel[]) => {
    try {
      localStorage.setItem('hotels', JSON.stringify(hotelsData));
    } catch (error) {
      console.error('Error saving hotels to storage:', error);
    }
  };

  const updateHotelStatus = (hotelId: string, status: HotelStatus) => {
    const updatedHotels = hotels.map(hotel => {
      if (hotel.id === hotelId) {
        return {
          ...hotel,
          status,
          updatedAt: new Date(),
        };
      }
      return hotel;
    });
    
    setHotels(updatedHotels);
    saveHotels(updatedHotels);
    
    console.log(`Hotel ${hotelId} status updated to ${status}`);
  };

  const getHotelsByStatus = (status: HotelStatus) => {
    return hotels.filter(hotel => hotel.status === status);
  };

  const getHotelsByCity = (city: string) => {
    return hotels.filter(hotel => hotel.city.toLowerCase() === city.toLowerCase());
  };

  const value: HotelManagementContextType = {
    hotels,
    updateHotelStatus,
    getHotelsByStatus,
    getHotelsByCity,
    isLoading,
  };

  return (
    <HotelManagementContext.Provider value={value}>
      {children}
    </HotelManagementContext.Provider>
  );
};
