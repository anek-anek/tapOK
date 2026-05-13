'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check, Hand, Info } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Portal } from './Portal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
  variant?: 'destructive' | 'success' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  isDestructive = true,
  variant = 'destructive',
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <Hand size={24} />,
          bg: 'bg-tok-teal/10',
          border: 'border-tok-teal',
          text: 'text-tok-teal',
          button: 'bg-tok-teal text-tok-cream'
        };
      case 'info':
        return {
          icon: <Info size={24} />,
          bg: 'bg-amber-100',
          border: 'border-amber-500',
          text: 'text-amber-600',
          button: 'bg-amber-400 text-tok-black'
        };
      default: // destructive
        return {
          icon: <AlertTriangle size={24} />,
          bg: 'bg-red-100',
          border: 'border-red-500',
          text: 'text-red-600',
          button: 'bg-tok-black text-tok-cream'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-tok-black/70 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-sm border-[3px] border-tok-black bg-white shadow-[12px_12px_0px_#1C1C1A]"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-sm border-2 border-tok-black",
                    styles.bg,
                    styles.text
                  )}>
                    {styles.icon}
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-sm p-1 text-tok-black/20 transition-colors hover:bg-tok-black/5 hover:text-tok-black"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
                    {title}
                  </h3>
                  <p className="mt-2 font-inter text-sm leading-relaxed text-tok-black/60">
                    {description}
                  </p>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 rounded-sm border-[3px] border-tok-black bg-white font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-all hover:bg-tok-black/5 active:translate-y-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 rounded-sm border-[3px] border-tok-black font-passion text-xs font-bold uppercase tracking-[2px] shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none",
                      styles.button
                    )}
                  >
                    {isLoading ? 'Processing...' : confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
