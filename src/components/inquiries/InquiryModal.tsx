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
          className="inquiry-modal relative w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 max-h-[calc(100dvh-2rem)] flex flex-col text-left text-[#1e3b32]"
        >
          {!hideHeader ? (
            <div className="inquiry-modal__header flex items-center justify-between gap-4 p-6 border-b border-gray-200 shrink-0 text-left">
              <div id={titleId} className="min-w-0 flex-1 pr-2">
                <Heading level={2} align="left" className="text-xl font-semibold text-[#1e3b32]">
                  {title}
                </Heading>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inquiry-modal__close relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1e3b32] transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b32] focus-visible:ring-offset-2"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5 stroke-current" strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="inquiry-modal__body p-6 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
