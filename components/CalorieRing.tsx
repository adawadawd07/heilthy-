'use client';

const SIZE = 132;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CalorieRing({
  current,
  goal,
  animate = true,
}: {
  current: number;
  goal: number;
  animate?: boolean;
}) {
  const rawPct = goal > 0 ? (current / goal) * 100 : 0;
  const over = rawPct > 100;
  const clamped = Math.min(100, Math.max(0, rawPct));
  const dash = animate ? (clamped / 100) * CIRCUMFERENCE : 0;

  return (
    <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16B981" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#1E293B"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={over ? '#EF4444' : 'url(#ringGradient)'}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          className="transition-[stroke-dasharray] duration-1000 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-3xl font-extrabold ${over ? 'text-red-400' : 'text-[#F8FAFC]'}`}>
          {Math.round(rawPct)}
          <span className="text-base">%</span>
        </span>
        <span className="text-[10px] text-[#94A3B8]">من الهدف</span>
      </div>
    </div>
  );
}
