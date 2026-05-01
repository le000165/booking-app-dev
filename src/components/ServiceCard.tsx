'use client';

import { Check } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration_mins: number;
  price: number;
  emoji?: string;
}

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      className={`service-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(service.id)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {service.emoji && (
          <span className="text-xl flex-shrink-0">{service.emoji}</span>
        )}
        <div className="min-w-0 text-left">
          <p className="font-semibold text-[15px] text-[var(--text-primary)] truncate">
            {service.name}
          </p>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            {service.duration_mins} min
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span className="font-semibold text-[15px] text-[var(--text-primary)]">
          ${Number(service.price).toFixed(2)}
        </span>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected
              ? 'bg-[var(--brand)] border-[var(--brand)]'
              : 'border-[var(--border-default)]'
          }`}
        >
          {selected && <Check size={11} strokeWidth={3} className="text-white" />}
        </div>
      </div>
    </button>
  );
}
