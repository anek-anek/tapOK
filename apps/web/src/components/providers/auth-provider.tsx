'use client';

import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { api } from '@/services/api';

export type UserRole = 'admin' | 'participant';
export type AuthProvider = 'password' | 'google';

export interface DbUser {
  id: string;
  email: string;
  authProvider: AuthProvider;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  birthday?: string;
  gender?: string;
  phone?: string;
  userHandle?: string;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt?: string;
}

interface AuthContextValue {
  dbUser: DbUser | null;
  loading: boolean;
  isReady: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  dbUser: null,
  loading: true,
  isReady: false,
  refreshUser: async () => undefined,
});

export function AuthProvider({
  children,
  initialDbUser = null,
}: {
  children: React.ReactNode;
  initialDbUser?: DbUser | null;
}) {
  const { data: session, isPending } = useSession();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null>(null);
  const cachedDbUserRef = useRef<DbUser | null>(initialDbUser);

  // Clear query cache when the authenticated user changes
  useEffect(() => {
    const currentId = session?.user?.id ?? null;
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== currentId) {
      queryClient.clear();
      cachedDbUserRef.current = null;
    }
    prevUserIdRef.current = currentId;
  }, [session?.user?.id, queryClient]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<DbUser>('/users/me');
      cachedDbUserRef.current = res.data;
    } catch {
      // non-fatal
    }
  }, []);

  const sessionUser = session?.user ?? null;

  // Map BetterAuth session user → DbUser shape the rest of the app expects
  const dbUser: DbUser | null = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        authProvider: ((sessionUser as any).authProvider as AuthProvider) ?? 'password',
        firstName: (sessionUser as any).firstName ?? sessionUser.name?.split(' ')[0] ?? '',
        lastName:
          (sessionUser as any).lastName ?? sessionUser.name?.split(' ').slice(1).join(' ') ?? '',
        avatar: sessionUser.image ?? undefined,
        role: ((sessionUser as any).role as UserRole) ?? 'participant',
        isEmailVerified: sessionUser.emailVerified ?? false,
        isActive: true,
        onboardingCompleted: (sessionUser as any).onboardingCompleted ?? false,
        createdAt: (sessionUser as any).createdAt ?? new Date().toISOString(),
        updatedAt: (sessionUser as any).updatedAt ?? new Date().toISOString(),
        birthday: (sessionUser as any).birthday,
        gender: (sessionUser as any).gender,
        phone: (sessionUser as any).phone,
        userHandle: (sessionUser as any).userHandle,
        termsAccepted: (sessionUser as any).termsAccepted ?? false,
        termsAcceptedAt: (sessionUser as any).termsAcceptedAt,
        privacyPolicyAccepted: (sessionUser as any).privacyPolicyAccepted ?? false,
        privacyPolicyAcceptedAt: (sessionUser as any).privacyPolicyAcceptedAt,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        dbUser,
        loading: isPending,
        isReady: !isPending,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
