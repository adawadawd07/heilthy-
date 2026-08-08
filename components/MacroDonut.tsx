'use client';

import { MacroSplit } from '@/lib/stats';

const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MacroDonut({
  split,
  labels,
}: {
  split: MacroSplit;
  labels: { protein: string; carbs: string; fat: string };
}) {
  const segments = [
    { key: 'protein', value: split.protein, color: '#22C55E', label: labels.protein },
    { key: 'carbs', value: split.carbs, color: '#FACC15', label: labels.carbs },
    { key: 'fat', value: split.fat, color: '#60A5FA', label: labels.fat },
  ];

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#1E293B" strokeWidth={STROKE} />
          {total > 0 &&
            segments.map((s) => {
              const length = (s.value / total) * CIRCUMFERENCE;
              const dash = `${length} ${CIRCUMFERENCE - length}`;
              const dashOffset = -offset;
              offset += length;
              return (
                <circle
                  key={s.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={STROKE}
                  strokeDasharray={dash}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
        </svg>
      </div>

      <div className="flex-1 space-y-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-xs text-[#94A3B8]">{s.label}</span>
            <span className="text-sm font-bold text-[#F8FAFC]">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
