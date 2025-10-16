'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
  loginCount: number;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginCount, setLoginCount] = useState(0);

  // 从 localStorage 加载用户信息
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser({
            ...userData,
            lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined,
          });
          setLoginCount(userData.loginCount || 0);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // 保存用户信息到 localStorage
  const saveUserToStorage = (userData: User | null) => {
    try {
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const register = async (userData: { firstName: string; lastName: string; email: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟注册验证（实际项目中这里会调用真实的 API）
      if (userData.email && userData.password) {
        const now = new Date();
        const userId = `user_${userData.email.replace('@', '_').replace('.', '_')}`;
        const fullName = `${userData.firstName} ${userData.lastName}`;
        
        const newUser: User = {
          id: userId,
          email: userData.email,
          name: fullName,
          isLoggedIn: true,
          lastLoginAt: now,
          loginCount: 1,
        };
        
        setUser(newUser);
        setLoginCount(1);
        saveUserToStorage(newUser);
        
        console.log('User registered successfully:', newUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟登录验证（实际项目中这里会调用真实的 API）
      if (email && password) {
        // 检查是否为管理员账户
        const isAdmin = email === 'admin@korascale.com';
        const now = new Date();
        
        // 获取或创建用户ID（基于邮箱生成固定ID）
        const userId = `user_${email.replace('@', '_').replace('.', '_')}`;
        
        // 检查是否已存在用户
        const existingUser = user?.email === email ? user : null;
        const newLoginCount = (existingUser?.loginCount || 0) + 1;
        
        const userData: User = {
          id: userId,
          email,
          name: isAdmin ? 'Admin' : email.split('@')[0],
          isLoggedIn: true,
          lastLoginAt: now,
          loginCount: newLoginCount,
        };
        
        setUser(userData);
        setLoginCount(newLoginCount);
        saveUserToStorage(userData);
        
        // 记录登录信息
        const loginRecord = {
          userId,
          userEmail: email,
          loginAt: now,
          ipAddress: '127.0.0.1', // 实际项目中从请求中获取
          userAgent: navigator.userAgent,
        };
        
        // 这里可以调用 OrderManagementContext 的 addLoginRecord
        // 但由于循环依赖，我们将在组件中处理
        
        console.log('User logged in successfully:', userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    saveUserToStorage(null);
    console.log('User logged out');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const value: UserContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    isLoading,
    loginCount,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
