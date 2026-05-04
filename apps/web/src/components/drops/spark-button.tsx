'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/auth-provider';
import { useSparkDrop, useUnsparkDrop } from '@/hooks/mutations/use-spark-mutations';
import { cn } from '@/lib/utils';
import type { Drop, DropCardModel } from '@/types/drop';

/** Component for the flying spark particles */
function SparkParticles({ count = 8 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i * 360) / count + (Math.random() * 20 - 10);
        const distance = 40 + Math.random() * 30;
        const duration = 0.4 + Math.random() * 0.3;
        const size = 2 + Math.random() * 4;

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2
            }}
          />
        );
      })}
    </div>
  );
}

export function SparkButton({
  drop,
  className,
  variant = 'default',
}: {
  drop: DropCardModel;
  className?: string;
  variant?: 'default' | 'hero' | 'compact';
}) {
  const { dbUser } = useAuth();

  const isSparked =
    'sparkedByViewer' in drop && drop.sparkedByViewer !== undefined
      ? drop.sparkedByViewer
      : (drop as Drop).sparks?.some((s) => s.userId === dbUser?.id) ?? false;
  const sparkCount =
    'sparkCount' in drop ? drop.sparkCount : ((drop as Drop).sparks?.length ?? 0);

  // Local optimistic state for zero-latency feedback
  const [localSparked, setLocalSparked] = useState(isSparked);
  const [localCount, setLocalCount] = useState(sparkCount);
  const [showSparks, setShowSparks] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setLocalSparked(isSparked);
    setLocalCount(sparkCount);
  }, [isSparked, sparkCount]);

  const { mutate: spark } = useSparkDrop(drop.id, dbUser?.id);
  const { mutate: unspark } = useUnsparkDrop(drop.id, dbUser?.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dbUser) return;

    // Trigger local state immediately
    const nextSparked = !localSparked;
    setLocalSparked(nextSparked);
    setLocalCount((prev) =>
      nextSparked ? (prev ?? 0) + 1 : Math.max(0, (prev ?? 0) - 1),
    );

    // Fire animation on spark (not unspark)
    if (nextSparked) {
      setShowSparks(false); // Reset
      setTimeout(() => setShowSparks(true), 10);
      spark();
    } else {
      unspark();
    }
  };

  const iconClasses = cn(
    "transition-all duration-300",
    localSparked
      ? "fill-tok-black text-tok-black"
      : "text-tok-black/20 group-hover:text-tok-black/40"
  );

  const heroIconClasses = cn(
    "transition-all duration-300",
    localSparked
      ? "fill-tok-black text-tok-black"
      : "text-tok-teal/45 group-hover:text-tok-teal",
  );

  const compactIconClasses = cn(
    "transition-all duration-300",
    localSparked
      ? "fill-amber-500"
      : "text-tok-black/20 group-hover:text-tok-black/40"
  );

  const buttonContent = (
    <>
      <AnimatePresence>
        {showSparks && <SparkParticles key={Date.now()} count={variant === 'hero' ? 12 : 8} />}
      </AnimatePresence>

      <motion.div
        animate={localSparked ? {
          scale: [1, 1.4, 1],
          rotate: [0, -10, 10, -5, 5, 0],
        } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Flame
          size={variant === 'hero' ? 16 : 14}
          strokeWidth={2.5}
          className={variant === 'hero' ? heroIconClasses : variant === 'compact' ? compactIconClasses : iconClasses}
        />
      </motion.div>
      <span
        className={cn(
          "pt-0.5",
          variant === 'compact' ? "text-xs" : "text-sm",
          variant === 'hero' &&
          (localSparked ? "text-tok-black" : "text-tok-teal"),
        )}
      >
        {localCount}
      </span>

      {/* Explosion Shockwave Ring */}
      <AnimatePresence>
        {showSparks && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-0 rounded-full border-2 border-amber-400 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </>
  );

  if (variant === 'hero') {
    return (
      <button
        onClick={handleToggle}
        disabled={!dbUser}
        className={cn(
          "group relative flex h-10 min-w-[70px] items-center justify-center gap-2 rounded-sm border-2 font-passion text-xs font-bold uppercase tracking-[2px] transition-all active:scale-95",
          "shadow-[3px_3px_0px_#1C1C1A]",
          localSparked
            ? "border-tok-black bg-amber-400 text-tok-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A]"
            : "border-tok-black bg-tok-cream text-tok-teal hover:-translate-y-0.5 hover:bg-tok-cream-dim hover:shadow-[4px_4px_0px_#1C1C1A]",
          "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_#1C1C1A]",
          className,
        )}
      >
        {buttonContent}

        {localSparked && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-0 z-[-1] rounded-sm bg-amber-400/25 blur-lg"
          />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleToggle}
        disabled={!dbUser}
        className={cn(
          "relative flex items-center gap-1.5 font-passion text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 group",
          localSparked ? "text-amber-500" : "text-tok-black/30 hover:text-tok-black",
          className
        )}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={!dbUser}
      className={cn(
        "group relative flex h-9 items-center gap-2 rounded-sm border-2 border-tok-black px-3 font-passion text-[10px] font-bold uppercase tracking-[2px] transition-all active:scale-95",
        localSparked
          ? "bg-amber-400 text-tok-black shadow-[2px_2px_0px_#1C1C1A]"
          : "bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A]",
        className
      )}
    >
      {buttonContent}
    </button>
  );
}

export function SparkButtonSkeleton({
  variant = 'default',
  className
}: {
  variant?: 'default' | 'hero' | 'compact';
  className?: string;
}) {
  if (variant === 'hero') {
    return (
      <div className={cn(
        "flex h-10 min-w-[70px] items-center justify-center gap-2 rounded-sm border-2 border-tok-black bg-tok-cream shadow-[3px_3px_0px_#1C1C1A]",
        className
      )}>
        <Skeleton className="h-4 w-4 bg-tok-black/10" />
        <Skeleton className="h-4 w-6 bg-tok-black/10" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Skeleton className="h-3.5 w-3.5 bg-tok-black/10" />
        <Skeleton className="h-3.5 w-5 bg-tok-black/10" />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-9 items-center gap-2 rounded-sm border-2 border-tok-black bg-white px-3 shadow-[2px_2px_0px_#1C1C1A]",
      className
    )}>
      <Skeleton className="h-3.5 w-3.5 bg-tok-black/10" />
      <Skeleton className="h-3.5 w-5 bg-tok-black/10" />
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';


