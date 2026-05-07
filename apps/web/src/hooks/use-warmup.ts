'use client';

import { useEffect } from 'react';

const WARMUP_KEY = 'api_last_warmup';
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fires a single /api/v1/health fetch when the app mounts,
 * throttled to once every 5 minutes across all tabs.
 * Keeps the Vercel serverless function warm while users are active.
 */
export function useWarmup() {
  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(WARMUP_KEY) || '0');
      if (Date.now() - last < COOLDOWN_MS) return;

      localStorage.setItem(WARMUP_KEY, String(Date.now()));

      fetch('/api/v1/health', { method: 'GET', priority: 'low' } as RequestInit).catch(() => {});
    } catch {
      // localStorage unavailable (e.g. private browsing with strict settings) — skip
    }
  }, []);
}
