'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderStatus, UserLoginRecord } from '@/types';

interface OrderManagementContextType {
  orders: Order[];
  loginRecords: UserLoginRecord[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => void;
  addLoginRecord: (record: Omit<UserLoginRecord, 'id'>) => void;
  updateLogoutRecord: (userId: string) => void;
  getOrdersByUser: (userId: string) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  isLoading: boolean;
}

const OrderManagementContext = createContext<OrderManagementContextType | undefined>(undefined);

export const useOrderManagement = () => {
  const context = useContext(OrderManagementContext);
  if (context === undefined) {
    throw new Error('useOrderManagement must be used within an OrderManagementProvider');
  }
  return context;
};

interface OrderManagementProviderProps {
  children: ReactNode;
}

export const OrderManagementProvider: React.FC<OrderManagementProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loginRecords, setLoginRecords] = useState<UserLoginRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载数据
  useEffect(() => {
    const loadData = () => {
      try {
        const storedOrders = localStorage.getItem('orders');
        const storedLoginRecords = localStorage.getItem('loginRecords');
        
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders).map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            paymentConfirmedAt: order.paymentConfirmedAt ? new Date(order.paymentConfirmedAt) : undefined,
            staffConfirmedAt: order.staffConfirmedAt ? new Date(order.staffConfirmedAt) : undefined,
            completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
          }));
          setOrders(parsedOrders);
        }
        
        if (storedLoginRecords) {
          const parsedRecords = JSON.parse(storedLoginRecords).map((record: any) => ({
            ...record,
            loginAt: new Date(record.loginAt),
            logoutAt: record.logoutAt ? new Date(record.logoutAt) : undefined,
          }));
          setLoginRecords(parsedRecords);
        }
      } catch (error) {
        console.error('Error loading data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 保存数据到 localStorage
  const saveOrders = (newOrders: Order[]) => {
    try {
      localStorage.setItem('orders', JSON.stringify(newOrders));
    } catch (error) {
      console.error('Error saving orders to storage:', error);
    }
  };

  const saveLoginRecords = (newRecords: UserLoginRecord[]) => {
    try {
      localStorage.setItem('loginRecords', JSON.stringify(newRecords));
    } catch (error) {
      console.error('Error saving login records to storage:', error);
    }
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
    
    console.log('Order added:', newOrder);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, notes?: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const now = new Date();
        const updates: Partial<Order> = {
          status,
          updatedAt: now,
          notes: notes || order.notes,
        };

        // 根据状态设置相应的时间戳
        if (status === 'paid' && !order.paymentConfirmedAt) {
          updates.paymentConfirmedAt = now;
        } else if (status === 'staff_confirmed' && !order.staffConfirmedAt) {
          updates.staffConfirmedAt = now;
        } else if (status === 'completed' && !order.completedAt) {
          updates.completedAt = now;
        }

        return { ...order, ...updates };
      }
      return order;
    });
    
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
    
    console.log(`Order ${orderId} status updated to ${status}`);
  };

  const addLoginRecord = (recordData: Omit<UserLoginRecord, 'id'>) => {
    const newRecord: UserLoginRecord = {
      ...recordData,
      id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedRecords = [...loginRecords, newRecord];
    setLoginRecords(updatedRecords);
    saveLoginRecords(updatedRecords);
    
    console.log('Login record added:', newRecord);
  };

  const updateLogoutRecord = (userId: string) => {
    const updatedRecords = loginRecords.map(record => {
      if (record.userId === userId && !record.logoutAt) {
        return { ...record, logoutAt: new Date() };
      }
      return record;
    });
    
    setLoginRecords(updatedRecords);
    saveLoginRecords(updatedRecords);
    
    console.log(`Logout record updated for user ${userId}`);
  };

  const getOrdersByUser = (userId: string) => {
    return orders.filter(order => order.userId === userId);
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status);
  };

  const value: OrderManagementContextType = {
    orders,
    loginRecords,
    addOrder,
    updateOrderStatus,
    addLoginRecord,
    updateLogoutRecord,
    getOrdersByUser,
    getOrdersByStatus,
    isLoading,
  };

  return (
    <OrderManagementContext.Provider value={value}>
      {children}
    </OrderManagementContext.Provider>
  );
};
