'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SquareSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SquareSelectProps {
  label: string;
  value: string;
  options: SquareSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom';
};

export default function SquareSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
  menuClassName,
  triggerClassName,
  ariaLabel,
}: SquareSelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const selectedIndex = options.findIndex(option => option.value === value);
    return selectedIndex >= 0 ? selectedIndex : 0;
  });
  const [position, setPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: 0,
    placement: 'bottom',
  });

  const selectedIndex = useMemo(() => {
    const index = options.findIndex(option => option.value === value);
    return index >= 0 ? index : 0;
  }, [options, value]);

  const selectedOption = options[selectedIndex] ?? options[0];

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;

    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 240);
    const margin = 12;
    const gap = 8;
    const menuHeight = menuRef.current?.offsetHeight ?? 0;

    let left = rect.left;
    left = Math.min(
      Math.max(margin, left),
      Math.max(margin, window.innerWidth - menuWidth - margin)
    );

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const shouldOpenAbove = menuHeight > 0 ? spaceBelow < menuHeight && spaceAbove > spaceBelow : false;
    const top = shouldOpenAbove
      ? Math.max(margin, rect.top - (menuHeight || 0) - gap)
      : Math.min(window.innerHeight - margin, rect.bottom + gap);

    setPosition({
      top,
      left,
      width: menuWidth,
      placement: shouldOpenAbove ? 'top' : 'bottom',
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
  }, [open, selectedIndex]);

  useLayoutEffect(() => {
    if (!open || !mounted) return;

    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [mounted, open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const chooseValue = useCallback((nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  }, [closeMenu, onChange]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(Math.max(0, selectedIndex - 1));
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => Math.min(options.length - 1, index + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(0, index - 1));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      chooseValue(options[activeIndex]?.value ?? selectedOption.value);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  };

  const panel = open && mounted ? createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label={ariaLabel ?? label}
      tabIndex={-1}
      onKeyDown={handleMenuKeyDown}
      className={cn(
        'fixed z-[70] rounded-2xl border border-gray-100 bg-white p-2 shadow-xl',
        'max-h-[min(320px,calc(100vh-24px))] overflow-y-auto',
        menuClassName
      )}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isActive = index === activeIndex;

        return (
          <button
            key={option.value || option.label}
            ref={node => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => chooseValue(option.value)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-black/10',
              isSelected || isActive ? 'bg-gray-100' : 'hover:bg-gray-100'
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-gray-900">{option.label}</p>
              {option.description && (
                <p className="mt-0.5 truncate text-[12px] text-gray-500">{option.description}</p>
              )}
            </div>
            {isSelected && <Check size={15} className="shrink-0 text-gray-900" />}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'inline-flex h-10 min-w-0 items-center justify-between gap-3 rounded-full border border-gray-300 bg-white px-4 py-2 text-left shadow-sm transition-colors',
          'hover:border-gray-400 hover:bg-gray-50',
          open && 'border-black ring-1 ring-black/10',
          disabled && 'cursor-not-allowed opacity-60 hover:border-gray-300 hover:bg-white',
          className,
          triggerClassName
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-none text-gray-500">{label}</p>
          <p className="truncate text-[13px] font-semibold leading-tight text-gray-900">
            {selectedOption?.label ?? 'Select'}
          </p>
        </div>
        <ChevronDown size={15} className={cn('shrink-0 text-gray-400 transition-transform', open && 'rotate-180 text-gray-900')} />
      </button>
      {panel}
    </>
  );
}
