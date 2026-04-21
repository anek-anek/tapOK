'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setAuthToken, api } from '@/services/api';

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
        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);

          const { data } = await api.post<DbUser>('/users/sync');
          setDbUser(data);

          const freshToken = await firebaseUser.getIdToken(true);
          setAuthToken(freshToken);

          document.cookie = `session_role=${data.role}; path=/; SameSite=Strict; Secure; max-age=3600`;
        } catch {
          setAuthToken(null);
          setDbUser(null);
          document.cookie = 'session_role=; path=/; max-age=0';
        }
      } else {
        setAuthToken(null);
        setDbUser(null);
        document.cookie = 'session_role=; path=/; max-age=0';
      }

      setUser(firebaseUser);
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
