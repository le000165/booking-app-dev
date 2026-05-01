'use client';

interface TimeSlotGridProps {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Group slots by time-of-day period
function groupSlots(slots: string[]) {
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];

  slots.forEach((slot) => {
    const h = new Date(slot).getHours();
    if (h < 12) morning.push(slot);
    else if (h < 17) afternoon.push(slot);
    else evening.push(slot);
  });

  return { morning, afternoon, evening };
}

function SlotGroup({ label, slots, selected, onSelect }: {
  label: string;
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
}) {
  if (slots.length === 0) return null;
  return (
    <div>
      <p className="caption mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot}
            className={`time-slot ${selected === slot ? 'selected' : ''}`}
            onClick={() => onSelect(slot)}
          >
            {formatTime(slot)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TimeSlotGrid({ slots, selected, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-[13px] text-[var(--text-secondary)]">No availability on this day.</p>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">Try selecting a different date.</p>
      </div>
    );
  }

  const { morning, afternoon, evening } = groupSlots(slots);

  return (
    <div className="space-y-5">
      <SlotGroup label="Morning" slots={morning} selected={selected} onSelect={onSelect} />
      <SlotGroup label="Afternoon" slots={afternoon} selected={selected} onSelect={onSelect} />
      <SlotGroup label="Evening" slots={evening} selected={selected} onSelect={onSelect} />
    </div>
  );
}
