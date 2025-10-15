'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  hotelId: string;
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomType: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => string;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updatePaymentStatus: (orderId: string, paymentStatus: Order['paymentStatus']) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByCustomer: (customerEmail: string) => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  // 从 localStorage 加载订单数据
  useEffect(() => {
    const loadOrdersFromStorage = () => {
      try {
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
          const ordersData = JSON.parse(storedOrders);
          setOrders(ordersData);
        }
      } catch (error) {
        console.error('Error loading orders from storage:', error);
      }
    };

    loadOrdersFromStorage();
  }, []);

  // 保存订单数据到 localStorage
  const saveOrdersToStorage = (ordersData: Order[]) => {
    try {
      localStorage.setItem('orders', JSON.stringify(ordersData));
    } catch (error) {
      console.error('Error saving orders to storage:', error);
    }
  };

  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `ORD-${year}${month}-${randomNum}`;
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): string => {
    const newOrder: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);

    console.log('New order created:', newOrder);
    return newOrder.id;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status } : order
    );
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
    console.log(`Order ${orderId} status updated to:`, status);
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: Order['paymentStatus']) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, paymentStatus } : order
    );
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
    console.log(`Order ${orderId} payment status updated to:`, paymentStatus);
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  const getOrdersByCustomer = (customerEmail: string): Order[] => {
    return orders.filter(order => order.customerEmail === customerEmail);
  };

  const value: OrderContextType = {
    orders,
    addOrder,
    updateOrderStatus,
    updatePaymentStatus,
    getOrderById,
    getOrdersByCustomer,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
