'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getMe } from '@/lib/api';
import { User } from '@/lib/types';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function verify() {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const me = await getMe();
        setUser(me);
      } catch {
        router.replace('/login');
        return;
      } finally {
        setChecking(false);
      }
    }

    verify();
  }, [router]);

  if (checking) {
    return <LoadingSpinner fullPage />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
