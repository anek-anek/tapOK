'use client';

import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'react';

const subscribeNothing = () => () => {};

function useClientMounted() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

export function PageBackdropWatermark({ label }: { label: string }) {
  const mounted = useClientMounted();

  const node = (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-[min(38vh,240px)] z-0 flex justify-end overflow-visible opacity-[0.12] select-none sm:inset-x-auto sm:right-0 sm:top-[20vh] sm:overflow-hidden sm:opacity-[0.05]"
    >
      <span className="font-passion block max-w-none translate-x-0 font-black leading-none tracking-tighter text-tok-teal text-[clamp(56px,17vw,280px)] sm:translate-x-1/4 sm:text-[clamp(100px,32vw,280px)]">
        {label}
      </span>
    </div>
  );

  if (!mounted) return null;
  return createPortal(node, document.body);
}
