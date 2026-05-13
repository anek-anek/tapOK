'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CLOSE_DURATION = 180;

export { CLOSE_DURATION };

import { Portal } from './shared/Portal';

export function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const triggerClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onClose, CLOSE_DURATION);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') triggerClose();
    };
    document.addEventListener('keydown', onKey);

    // Lock scroll
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);

      const otherModals = document.querySelectorAll('.fixed.inset-0.z-50');
      if (otherModals.length <= 1) {
        document.body.style.overflow = originalBodyOverflow;
      }
    };
  }, [triggerClose]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
        <div
          className="fixed inset-0 bg-tok-black/70 backdrop-blur-md"
          style={{
            animation: closing
              ? `tapok-fadeOut ${CLOSE_DURATION}ms ease-in forwards`
              : 'tapok-fadeIn 200ms ease-out',
          }}
          onClick={triggerClose}
        />
        <div
          className="relative z-10 max-h-[92dvh] w-full max-w-[min(960px,calc(100vw-2rem))] overflow-visible sm:max-h-[90vh]"
          style={{
            animation: closing
              ? `tapok-slideDown ${CLOSE_DURATION}ms cubic-bezier(0.4, 0, 1, 1) forwards`
              : 'tapok-slideUp 220ms cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        >
          {typeof children === 'function' ? children(triggerClose) : children}
        </div>
        <style>{`
          @keyframes tapok-fadeIn  { from { opacity: 0 } to { opacity: 1 } }
          @keyframes tapok-fadeOut { from { opacity: 1 } to { opacity: 0 } }
          @keyframes tapok-slideUp   { 
            0% { opacity: 0; transform: scale(0.95) translate(8px, 8px); }
            100% { opacity: 1; transform: scale(1) translate(0, 0); }
          }
          @keyframes tapok-slideDown { 
            from { opacity: 1; transform: scale(1) translate(0, 0); } 
            to { opacity: 0; transform: scale(0.95) translate(8px, 8px); } 
          }
        `}</style>
      </div>
    </Portal>
  );
}
