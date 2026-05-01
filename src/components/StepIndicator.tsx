'use client';

interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`step-dot ${
              i + 1 === current ? 'active' : i + 1 < current ? 'done' : ''
            }`}
          />
          {i < total - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}
