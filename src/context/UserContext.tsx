'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isLoggedIn: boolean;
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
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

  // 从 localStorage 加载用户信息
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟登录验证（实际项目中这里会调用真实的 API）
      if (email && password) {
        // 检查是否为管理员账户
        const isAdmin = email === 'admin@korascale.com';
        
        const userData: User = {
          id: `user_${Date.now()}`,
          email,
          name: isAdmin ? 'Admin' : email.split('@')[0], // 从邮箱提取用户名
          isLoggedIn: true,
        };
        
        setUser(userData);
        saveUserToStorage(userData);
        
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
    logout,
    updateUser,
    isLoading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
