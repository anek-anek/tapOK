'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
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
}

interface AuthContextValue {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  /** Hydrate the context after a successful registration without waiting for onAuthStateChanged. */
  setSession: (firebaseUser: User, dbUser: DbUser) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  dbUser: null,
  loading: true,
  setSession: () => undefined,
});

function readProfileCookie(): DbUser | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split('; ').find((c) => c.startsWith('user_profile='));
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw.split('=')[1] ?? '')) as DbUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(readProfileCookie);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // The register page manages its own sync (createUserWithEmailAndPassword
        // + finalizeSession with sync:true). If AuthProvider races and calls
        // GET /users/me before the sync completes, it gets a 404 and deletes
        // the brand-new Firebase account. Skip here; the form sets state itself.
        if (window.location.pathname === '/register') {
          setLoading(false);
          return;
        }

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
        setAuthToken(null);
        setDbUser(null);
        setUser(null);
        await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setSession = useCallback((firebaseUser: User, dbUser: DbUser) => {
    setUser(firebaseUser);
    setDbUser(dbUser);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
