'use client';

import { useWarmup } from '@/hooks/use-warmup';

export function WarmupProvider() {
  useWarmup();
  return null;
}
