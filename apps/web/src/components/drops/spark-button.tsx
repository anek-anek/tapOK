'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/auth-provider';
import { useSparkDrop, useUnsparkDrop } from '@/hooks/mutations/use-spark-mutations';
import { cn } from '@/lib/utils';
import type { Drop } from '@/types/drop';

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
  drop: Drop;
  className?: string;
  variant?: 'default' | 'hero' | 'compact';
}) {
  const { dbUser } = useAuth();
  
  // Real-time spark tracking
  const isSparked = drop.sparks?.some((s) => s.userId === dbUser?.id) ?? false;
  const sparkCount = drop.sparks?.length ?? 0;

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
    setLocalCount(prev => nextSparked ? prev + 1 : Math.max(0, prev - 1));

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
      : "text-tok-cream/40 group-hover:text-tok-cream/60"
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
      <span className={cn("pt-0.5", variant === 'compact' ? "text-[11px]" : "text-[10px]")}>
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
          localSparked
            ? "bg-amber-400 border-tok-black text-tok-black shadow-[3px_3px_0px_#1C1C1A]"
            : "bg-tok-cream/10 border-tok-cream/20 text-tok-cream hover:bg-tok-cream/20",
          className
        )}
      >
        {buttonContent}
        
        {/* Constant Glow when sparked */}
        {localSparked && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[-1] rounded-full bg-amber-400/20 blur-xl" 
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


