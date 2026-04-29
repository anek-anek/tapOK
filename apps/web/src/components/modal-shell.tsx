'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CLOSE_DURATION = 180;

export { CLOSE_DURATION };

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

    // Lock scroll - more aggressive for cross-browser support
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', onKey);

      const otherModals = document.querySelectorAll('.fixed.inset-0.z-50');
      if (otherModals.length <= 1) {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [triggerClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="fixed inset-0 bg-[#2a2118]/50 backdrop-blur-[3px]"
        style={{
          animation: closing
            ? `tapok-fadeOut ${CLOSE_DURATION}ms ease-in forwards`
            : 'tapok-fadeIn 200ms ease-out',
        }}
        onClick={triggerClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-10 max-h-[92dvh] sm:relative sm:inset-x-auto sm:bottom-auto sm:w-full sm:max-w-[720px]"
        style={{
          animation: closing
            ? `tapok-slideDown ${CLOSE_DURATION}ms cubic-bezier(0.4,0,1,1) forwards`
            : 'tapok-slideUp 280ms cubic-bezier(0.34,1.4,0.64,1)',
        }}
      >
        {typeof children === 'function' ? children(triggerClose) : children}
      </div>
      <style>{`
        @keyframes tapok-fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tapok-fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes tapok-slideUp   { from { opacity: 0; transform: translateY(28px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes tapok-slideDown { from { opacity: 1; transform: translateY(0)    scale(1)    } to { opacity: 0; transform: translateY(22px) scale(0.97) } }
      `}</style>
    </div>
  );
}
