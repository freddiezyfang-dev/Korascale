'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface CartExperienceItem {
  id: string;
  title: string;
  unitPrice: number;
  date?: string;
  pax?: number;
}

export interface CartJourneyItem {
  journeyId: string;
  slug: string;
  title: string;
  image?: string;
  dates?: { start?: string; end?: string };
  travelers?: { adults: number; children: number };
  basePrice?: number;
  experiences: CartExperienceItem[];
}

interface CartContextType {
  items: CartJourneyItem[];
  addJourney: (item: Omit<CartJourneyItem, 'experiences'> & { experiences?: CartExperienceItem[] }) => void;
  removeJourney: (slug: string) => void;
  clearCart: () => void;
  addExperienceToJourney: (slug: string, exp: CartExperienceItem) => void;
  removeExperienceFromJourney: (slug: string, expId: string) => void;
  totals: { subtotal: number; journeys: Record<string, number> };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // 安全兜底：在未包裹 Provider 时返回无副作用的默认实现，避免页面崩溃
    const noop = () => {};
    return {
      items: [],
      addJourney: noop as CartContextType['addJourney'],
      removeJourney: noop as CartContextType['removeJourney'],
      clearCart: noop,
      addExperienceToJourney: noop as CartContextType['addExperienceToJourney'],
      removeExperienceFromJourney: noop as CartContextType['removeExperienceFromJourney'],
      totals: { subtotal: 0, journeys: {} },
    } as CartContextType;
  }
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartJourneyItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart');
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const addJourney: CartContextType['addJourney'] = (item) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.slug === item.slug);
      if (exists) {
        // 合并更新（保留已选体验）
        return prev.map((p) =>
          p.slug === item.slug
            ? {
                ...p,
                ...item,
                experiences: [...(item.experiences || []), ...p.experiences],
              }
            : p,
        );
      }
      return [
        ...prev,
        {
          journeyId: item.journeyId,
          slug: item.slug,
          title: item.title,
          image: item.image,
          dates: item.dates,
          travelers: item.travelers,
          basePrice: item.basePrice,
          experiences: item.experiences || [],
        },
      ];
    });
  };

  const removeJourney = (slug: string) => setItems((prev) => prev.filter((p) => p.slug !== slug));
  const clearCart = () => setItems([]);

  const addExperienceToJourney = (slug: string, exp: CartExperienceItem) => {
    setItems((prev) =>
      prev.map((p) =>
        p.slug === slug ? { ...p, experiences: [...p.experiences.filter((e) => e.id !== exp.id), exp] } : p,
      ),
    );
  };

  const removeExperienceFromJourney = (slug: string, expId: string) => {
    setItems((prev) => prev.map((p) => (p.slug === slug ? { ...p, experiences: p.experiences.filter((e) => e.id !== expId) } : p)));
  };

  const totals = useMemo(() => {
    const journeys: Record<string, number> = {};
    let subtotal = 0;
    items.forEach((j) => {
      const base = j.basePrice || 0;
      const exps = j.experiences.reduce((s, e) => s + (e.unitPrice || 0) * (e.pax || 1), 0);
      const sum = base + exps;
      journeys[j.slug] = sum;
      subtotal += sum;
    });
    return { journeys, subtotal };
  }, [items]);

  const value: CartContextType = {
    items,
    addJourney,
    removeJourney,
    clearCart,
    addExperienceToJourney,
    removeExperienceFromJourney,
    totals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};


