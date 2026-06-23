'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
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

function sessionUserToUser(sessionUser: SessionUser): User {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    isLoggedIn: true,
    isAdmin: sessionUser.isAdmin,
    lastLoginAt: new Date(),
    loginCount: 1,
  };
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginCount, setLoginCount] = useState(0);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const payload = await response.json();
      if (payload.authenticated && payload.user) {
        const sessionUser = payload.user as SessionUser;
        setUser(sessionUserToUser(sessionUser));
        setLoginCount((prev) => prev + (prev === 0 ? 1 : 0));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      await refreshSession();
      setIsLoading(false);
    };
    void loadSession();
  }, [refreshSession]);

  const register = async (userData: { firstName: string; lastName: string; email: string; password: string }): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (!userData.email || !userData.password) {
        return false;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
        }),
      });

      if (!response.ok) {
        return false;
      }

      const payload = await response.json();
      const userId = payload.user?.id || `user_${userData.email.replace('@', '_').replace('.', '_')}`;
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();

      const newUser: User = {
        id: userId,
        email: userData.email,
        name: fullName,
        isLoggedIn: true,
        isAdmin: false,
        lastLoginAt: new Date(),
        loginCount: 1,
      };

      setUser(newUser);
      setLoginCount(1);
      return true;
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const payload = await response.json();
      if (!payload.authenticated || !payload.user) {
        return false;
      }

      const sessionUser = payload.user as SessionUser;
      const userData = sessionUserToUser(sessionUser);
      setUser(userData);
      setLoginCount((prev) => prev + 1);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { Origin: window.location.origin },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoginCount(0);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
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
