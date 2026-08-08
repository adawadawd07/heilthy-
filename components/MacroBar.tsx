'use client';

import { LucideIcon } from 'lucide-react';

export default function MacroBar({
  label,
  icon: Icon,
  current,
  goal,
  unit = 'g',
  color,
  track = 'bg-[#0B1A14]',
  animate = true,
}: {
  label: string;
  icon: LucideIcon;
  current: number;
  goal: number;
  unit?: string;
  color: string;
  track?: string;
  animate?: boolean;
}) {
  const pct = goal > 0 ? (current / goal) * 100 : 0;
  const width = animate ? Math.min(100, pct) : 0;
  const over = pct > 100;
  const remaining = Math.max(0, goal - current);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          {label}
        </span>
        <span className="text-xs font-bold text-[#F8FAFC]">
          {current}
          <span className="font-normal text-[#94A3B8]">
            /{goal}
            {unit}
          </span>
        </span>
      </div>

      <div className={`relative h-2 w-full overflow-hidden rounded-full ${track}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
            over ? 'bg-red-500' : color.replace('text-', 'bg-')
          }`}
          style={{ width: `${width}%` }}
        />
      </div>

      <p className="text-[10px] text-[#94A3B8]">
        {over ? (
          <span className="font-bold text-red-400">
            +{Math.round(current - goal)}
            {unit}
          </span>
        ) : (
          <>
            <span className="font-bold text-[#22C55E]">
              {Math.round(remaining)}
              {unit}
            </span>{' '}
            متبقي
          </>
        )}
      </p>
    </div>
  );
}
