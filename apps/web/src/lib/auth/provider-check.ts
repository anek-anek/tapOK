'use client';

import type { AuthProvider } from '@/components/providers/auth-provider';

interface ProviderCheckResult {
  exists: boolean;
  authProvider: AuthProvider | null;
}

export async function lookupExistingAuthProvider(email: string): Promise<AuthProvider | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const res = await fetch('/api/auth/provider-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail }),
  });

  if (!res.ok) {
    throw new Error('Unable to check the email provider.');
  }

  const data = (await res.json()) as ProviderCheckResult;
  return data.exists ? data.authProvider : null;
}
