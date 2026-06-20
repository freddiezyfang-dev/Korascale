'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/common';
import { useUser } from '@/context/UserContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  const showLogout = user?.email === 'admin@korascale.com';

  return (
    <>
      {showLogout ? (
        <div className="fixed top-4 right-4 z-[100]">
          <Button
            onClick={handleLogout}
            variant="secondary"
            size="sm"
            aria-label="Log out of admin"
          >
            <LogOut className="w-4 h-4 mr-2 inline" />
            Log out
          </Button>
        </div>
      ) : null}
      {children}
    </>
  );
}
