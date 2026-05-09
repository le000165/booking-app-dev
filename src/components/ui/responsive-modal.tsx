'use client';

import { X } from 'lucide-react';

interface ResponsiveModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function ResponsiveModal({
  open,
  title,
  onClose,
  children,
  footer,
}: ResponsiveModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="responsive-modal">
        <header className="responsive-modal-header">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="responsive-modal-body">{children}</div>
        {footer ? <footer className="responsive-modal-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
