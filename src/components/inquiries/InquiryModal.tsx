'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

import { Heading } from '@/components/common';

const BODY_LOCK_CLASS = 'inquiry-modal-open';

type InquiryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** When true, hide header (e.g. success state with its own layout). */
  hideHeader?: boolean;
};

export function InquiryModal({
  isOpen,
  onClose,
  title,
  children,
  hideHeader = false,
}: InquiryModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.classList.add(BODY_LOCK_CLASS);
    return () => {
      document.body.classList.remove(BODY_LOCK_CLASS);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusable = panelRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [isOpen, hideHeader]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 backdrop-blur-md bg-black/20 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <div className="flex min-h-full items-center justify-center p-4 relative z-10">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="inquiry-modal relative w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 max-h-[calc(100dvh-2rem)] flex flex-col"
        >
          {!hideHeader ? (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <div id={titleId}>
                <Heading level={2} className="text-xl font-semibold">
                  {title}
                </Heading>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="p-6 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
