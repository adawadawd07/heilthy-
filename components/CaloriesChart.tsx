'use client';

import { useState } from 'react';
import { DayStat } from '@/lib/stats';

const WIDTH = 340;
const HEIGHT = 160;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;
const PAD_X = 6;

export default function CaloriesChart({
  days,
  goal,
  locale = 'ar',
}: {
  days: DayStat[];
  goal: number;
  locale?: 'ar' | 'en';
}) {
  const [active, setActive] = useState<number | null>(null);

  const maxValue = Math.max(goal * 1.2, ...days.map((d) => d.calories), 1);
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = days.length > 1 ? (WIDTH - PAD_X * 2) / (days.length - 1) : 0;

  const x = (i: number) => PAD_X + i * step;
  const y = (value: number) => PAD_TOP + plotHeight - (value / maxValue) * plotHeight;

  const loggedPoints = days.map((d, i) => ({ i, d, x: x(i), y: y(d.calories) }));
  const linePoints = loggedPoints.filter((p) => p.d.logged);

  const linePath = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePoints.length
    ? `${linePath} L${linePoints[linePoints.length - 1].x},${PAD_TOP + plotHeight} L${linePoints[0].x},${PAD_TOP + plotHeight} Z`
    : '';

  const goalY = y(goal);
  const activePoint = active !== null ? loggedPoints[active] : null;

  function dayLabel(date: string) {
    const [yy, mm, dd] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(Date.UTC(yy, mm - 1, dd)));
  }

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseLeave={() => setActive(null)}
        role="img"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16B981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#16B981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_TOP + plotHeight * (1 - f)}
            y2={PAD_TOP + plotHeight * (1 - f)}
            stroke="#1E293B"
            strokeWidth="1"
          />
        ))}

        {goal > 0 && goalY > PAD_TOP && (
          <>
            <line
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={goalY}
              y2={goalY}
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text x={WIDTH - PAD_X} y={goalY - 5} textAnchor="end" fill="#F59E0B" fontSize="9">
              {goal}
            </text>
          </>
        )}

        {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
        {linePath && (
          <path d={linePath} fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {loggedPoints.map((p) => (
          <g key={p.d.date}>
            <rect
              x={p.x - step / 2}
              y={PAD_TOP}
              width={Math.max(step, 8)}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setActive(p.i)}
              onClick={() => setActive(p.i)}
            />
            {p.d.logged && (
              <circle
                cx={p.x}
                cy={p.y}
                r={active === p.i ? 5 : 3}
                fill={p.d.calories > goal && goal > 0 ? '#EF4444' : '#22C55E'}
                stroke="#0B1A14"
                strokeWidth="1.5"
              />
            )}
          </g>
        ))}

        {activePoint?.d.logged && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={PAD_TOP}
            y2={PAD_TOP + plotHeight}
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {days.length <= 10 &&
          loggedPoints.map((p) => (
            <text
              key={`label-${p.d.date}`}
              x={p.x}
              y={HEIGHT - 6}
              textAnchor="middle"
              fill="#64748B"
              fontSize="8"
            >
              {p.d.date.slice(-2)}
            </text>
          ))}
      </svg>

      <div className="flex min-h-[38px] items-center justify-between rounded-xl bg-[#1E293B]/60 px-3 py-2">
        {activePoint ? (
          <>
            <span className="text-xs text-[#94A3B8]">{dayLabel(activePoint.d.date)}</span>
            <span className="text-xs font-bold text-[#F8FAFC]">
              {activePoint.d.logged ? (
                <>
                  <span className={activePoint.d.calories > goal && goal > 0 ? 'text-red-400' : 'text-[#22C55E]'}>
                    {Math.round(activePoint.d.calories)} kcal
                  </span>
                  <span className="font-normal text-[#94A3B8]">
                    {' '}
                    · {activePoint.d.protein_g}p / {activePoint.d.carbs_g}c / {activePoint.d.fat_g}f
                  </span>
                </>
              ) : (
                <span className="font-normal text-[#64748B]">—</span>
              )}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-[#64748B]">
            {locale === 'ar' ? 'المس أي نقطة لعرض تفاصيل اليوم' : 'Tap a point for day details'}
          </span>
        )}
      </div>
    </div>
  );
}
