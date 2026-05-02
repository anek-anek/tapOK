'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const CARD_SHADOW = '6px 6px 0 #000';
const CARD_SHADOW_HOVER = '8px 8px 0 #000';

const STAGGER_MS = 70;

export type WhyTapokFeatureItem = {
  image: string;
  title: string;
  desc: string;
};

type WhyTapokFeatureCardsProps = {
  items: WhyTapokFeatureItem[];
};

export function WhyTapokFeatureCards({ items }: WhyTapokFeatureCardsProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '-48px 0px', threshold: 0.12 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={gridRef} className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {items.map(({ image, title, desc }, i) => (
        <div
          key={title}
          className={cn(
            'h-full motion-reduce:animate-none',
            // Reduced motion: visible immediately, no entrance keyframes (SSR + client markup identical; media query only).
            'motion-reduce:opacity-100',
            inView ? 'motion-safe:animate-fade-up motion-safe:opacity-100' : 'motion-safe:opacity-0',
          )}
          style={
            inView
              ? { animationDelay: `${i * STAGGER_MS}ms` }
              : undefined
          }
        >
          <div
            className="feature-card flex h-full flex-col items-center rounded-2xl border-[3px] border-tok-black bg-tok-white p-6 text-center active:scale-[0.97]"
            style={{
              boxShadow: CARD_SHADOW,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translate(-2px,-2px)';
              el.style.boxShadow = CARD_SHADOW_HOVER;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = '';
              el.style.boxShadow = CARD_SHADOW;
            }}
          >
            <div className="relative mb-6 flex h-32 w-full items-center justify-center">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="select-none object-contain"
              />
            </div>
            <p className="mb-2 font-passion text-xl font-bold uppercase tracking-tight text-tok-teal">
              {title}
            </p>
            <p className="font-inter text-base font-semibold leading-snug text-tok-black/80">
              {desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
