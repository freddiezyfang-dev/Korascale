'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hotel, HotelStatus, RoomAvailability } from '@/types';
import hotelsData from '@/data/hotels.json';

interface HotelManagementContextType {
  hotels: Hotel[];
  updateHotelStatus: (hotelId: string, status: HotelStatus) => void;
  updateHotel: (hotelId: string, updates: Partial<Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  updateRoomAvailability: (hotelId: string, availability: RoomAvailability) => void;
  updateRoomPrice: (hotelId: string, roomTypeName: string, date: string, price: number) => void;
  toggleRoomAvailability: (hotelId: string, roomTypeName: string, date: string) => void;
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
            roomTypes: hotel.roomTypes?.map((roomType: any) => ({
              ...roomType,
              basePrice: roomType.basePrice || 200,
              maxOccupancy: roomType.maxOccupancy || 2,
            })) || [],
            availability: hotel.availability || [],
            createdAt: new Date(hotel.createdAt),
            updatedAt: new Date(hotel.updatedAt),
          }));
          setHotels(parsedHotels);
        } else {
          // 使用默认数据，所有酒店默认为活跃状态
          const defaultHotels: Hotel[] = hotelsData.hotels.map(hotel => ({
            ...hotel,
            roomTypes: hotel.roomTypes?.map(roomType => ({
              ...roomType,
              basePrice: 200, // 默认基础价格
              maxOccupancy: 2, // 默认最大入住人数
            })) || [],
            availability: [], // 初始化为空数组
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
          roomTypes: hotel.roomTypes?.map(roomType => ({
            ...roomType,
            basePrice: 200, // 默认基础价格
            maxOccupancy: 2, // 默认最大入住人数
          })) || [],
          availability: [], // 初始化为空数组
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

  const updateHotel = (hotelId: string, updates: Partial<Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const updatedHotels = hotels.map(hotel => {
      if (hotel.id === hotelId) {
        return {
          ...hotel,
          ...updates,
          updatedAt: new Date(),
        };
      }
      return hotel;
    });
    
    setHotels(updatedHotels);
    saveHotels(updatedHotels);
    
    console.log(`Hotel ${hotelId} updated successfully`);
  };

  const getHotelsByStatus = (status: HotelStatus) => {
    return hotels.filter(hotel => hotel.status === status);
  };

  const getHotelsByCity = (city: string) => {
    return hotels.filter(hotel => hotel.city.toLowerCase() === city.toLowerCase());
  };

  const updateRoomAvailability = (hotelId: string, availability: RoomAvailability) => {
    const updatedHotels = hotels.map(hotel => {
      if (hotel.id === hotelId) {
        const existingIndex = hotel.availability.findIndex(
          item => item.roomTypeName === availability.roomTypeName && item.date === availability.date
        );
        
        let newAvailability = [...hotel.availability];
        if (existingIndex >= 0) {
          newAvailability[existingIndex] = availability;
        } else {
          newAvailability.push(availability);
        }
        
        return {
          ...hotel,
          availability: newAvailability,
          updatedAt: new Date(),
        };
      }
      return hotel;
    });
    
    setHotels(updatedHotels);
    saveHotels(updatedHotels);
  };

  const updateRoomPrice = (hotelId: string, roomTypeName: string, date: string, price: number) => {
    const updatedHotels = hotels.map(hotel => {
      if (hotel.id === hotelId) {
        const newAvailability = hotel.availability.map(item => {
          if (item.roomTypeName === roomTypeName && item.date === date) {
            return { ...item, price };
          }
          return item;
        });
        
        return {
          ...hotel,
          availability: newAvailability,
          updatedAt: new Date(),
        };
      }
      return hotel;
    });
    
    setHotels(updatedHotels);
    saveHotels(updatedHotels);
  };

  const toggleRoomAvailability = (hotelId: string, roomTypeName: string, date: string) => {
    const updatedHotels = hotels.map(hotel => {
      if (hotel.id === hotelId) {
        const existingIndex = hotel.availability.findIndex(
          item => item.roomTypeName === roomTypeName && item.date === date
        );
        
        let newAvailability = [...hotel.availability];
        if (existingIndex >= 0) {
          newAvailability[existingIndex] = {
            ...newAvailability[existingIndex],
            available: !newAvailability[existingIndex].available
          };
        } else {
          // 如果不存在，创建一个新的可用性记录
          const roomType = hotel.roomTypes.find(rt => rt.name === roomTypeName);
          newAvailability.push({
            roomTypeName,
            date,
            available: true,
            price: roomType?.basePrice || 200,
            maxOccupancy: roomType?.maxOccupancy || 2
          });
        }
        
        return {
          ...hotel,
          availability: newAvailability,
          updatedAt: new Date(),
        };
      }
      return hotel;
    });
    
    setHotels(updatedHotels);
    saveHotels(updatedHotels);
  };

  const value: HotelManagementContextType = {
    hotels,
    updateHotelStatus,
    updateHotel,
    updateRoomAvailability,
    updateRoomPrice,
    toggleRoomAvailability,
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
