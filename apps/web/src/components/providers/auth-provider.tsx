'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import { setAuthToken } from '@/services/api';
import { finalizeSession } from '@/lib/auth/finalize-session';

export type UserRole = 'admin' | 'photographer' | 'participant';

export interface DbUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  birthday?: string;
  gender?: string;
  phone?: string;
  userHandle?: string;
}

interface AuthContextValue {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  isReady: boolean;
  setSession: (firebaseUser: User, dbUser: DbUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  dbUser: null,
  loading: true,
  isReady: false,
  setSession: () => undefined,
  refreshUser: async () => undefined,
});

export function AuthProvider({
  children,
  initialDbUser = null,
}: {
  children: React.ReactNode;
  initialDbUser?: DbUser | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(initialDbUser);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(initialDbUser !== null);
  const queryClient = useQueryClient();
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (window.location.pathname === '/register') {
          setLoading(false);
          return;
        }

        if (prevUidRef.current !== null && prevUidRef.current !== firebaseUser.uid) {
          queryClient.clear();
        }
        prevUidRef.current = firebaseUser.uid;

        const result = await finalizeSession(firebaseUser, { sync: false });
        if (result.ok) {
          setDbUser(result.dbUser);
          setUser(firebaseUser);
        } else {
          setDbUser(null);
          setUser(null);
          await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
        }
      } else {
        queryClient.clear();
        prevUidRef.current = null;
        setAuthToken(null);
        setDbUser(null);
        setUser(null);
        await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
      }

      setLoading(false);
      setIsReady(true);
    });

    return unsubscribe;
  }, [queryClient]);

  const setSession = useCallback((firebaseUser: User, dbUser: DbUser) => {
    setUser(firebaseUser);
    setDbUser(dbUser);
    setLoading(false);
    setIsReady(true);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const result = await finalizeSession(user, { sync: false });
    if (result.ok) {
      setDbUser(result.dbUser);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, isReady, setSession, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
