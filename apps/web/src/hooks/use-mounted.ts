import { useEffect, useState } from 'react';

/**
 * Returns `true` only after the component has mounted on the client.
 *
 * Use this to gate any rendering that depends on client-only state
 * (auth, browser APIs, Date.now(), etc.) so that the server-rendered
 * HTML and the first client render are identical, preventing React
 * hydration mismatches.
 *
 * Pattern:
 *   const mounted = useMounted();
 *   if (!mounted) return <PageSkeleton />;
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
