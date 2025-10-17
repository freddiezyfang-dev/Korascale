'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WishlistItem {
  id: string;
  type: 'experience' | 'accommodation';
  title: string;
  location: string;
  image: string;
  price?: string;
  duration?: string;
  bookingDetails?: {
    checkIn: Date | null;
    checkOut: Date | null;
    adults: number;
    children: number;
    roomType: string;
  };
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  isOpen: boolean;
  toggleWishlist: () => void;
  closeWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 从localStorage加载wishlist数据
  useEffect(() => {
    const savedItems = localStorage.getItem('wishlist-items');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        // 处理日期字段的反序列化
        const processedItems = parsedItems.map((item: any) => ({
          ...item,
          bookingDetails: item.bookingDetails ? {
            ...item.bookingDetails,
            checkIn: item.bookingDetails.checkIn ? new Date(item.bookingDetails.checkIn) : null,
            checkOut: item.bookingDetails.checkOut ? new Date(item.bookingDetails.checkOut) : null,
          } : undefined
        }));
        setItems(processedItems);
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    }
  }, []);

  // 保存wishlist数据到localStorage
  useEffect(() => {
    localStorage.setItem('wishlist-items', JSON.stringify(items));
  }, [items]);

  const addToWishlist = (item: WishlistItem) => {
    setItems(prev => {
      if (prev.find(existingItem => existingItem.id === item.id)) {
        return prev; // 如果已存在，不重复添加
      }
      return [...prev, item];
    });
  };

  const removeFromWishlist = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };

  const clearWishlist = () => {
    setItems([]);
  };

  const toggleWishlist = () => {
    setIsOpen(prev => !prev);
  };

  const closeWishlist = () => {
    setIsOpen(false);
  };

  const value: WishlistContextType = {
    items,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    isOpen,
    toggleWishlist,
    closeWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};





















