'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  dbUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
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

  return (
    <AuthContext.Provider value={{ user, dbUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
