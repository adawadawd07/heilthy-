'use client';

import { useEffect, useState } from 'react';
import { DailySummary as DS, User } from '@/types';
import { t } from '@/lib/translations';
import { Flame, Beef, Wheat, Droplet, TriangleAlert, CircleCheck } from 'lucide-react';
import CalorieRing from './CalorieRing';
import MacroBar from './MacroBar';

export default function DailySummary({
  summary,
  goals,
  locale = 'ar',
}: {
  summary: DS;
  goals: Pick<User, 'daily_calories' | 'daily_protein_g' | 'daily_carbs_g' | 'daily_fat_g'>;
  locale?: 'ar' | 'en';
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const macros = [
    {
      key: 'protein',
      label: t('protein', locale),
      current: Math.round(summary.protein_g),
      goal: goals.daily_protein_g,
      icon: Beef,
      color: 'text-[#22C55E]',
    },
    {
      key: 'carbs',
      label: t('carbs', locale),
      current: Math.round(summary.carbs_g),
      goal: goals.daily_carbs_g,
      icon: Wheat,
      color: 'text-yellow-400',
    },
    {
      key: 'fat',
      label: t('fat', locale),
      current: Math.round(summary.fat_g),
      goal: goals.daily_fat_g,
      icon: Droplet,
      color: 'text-blue-400',
    },
  ];

  const calories = Math.round(summary.calories);
  const goalCalories = goals.daily_calories;
  const over = goalCalories > 0 && calories > goalCalories;
  const remaining = Math.max(0, goalCalories - calories);
  const reached = !over && goalCalories > 0 && calories >= goalCalories * 0.9;

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm space-y-5 transition-colors ${
        over ? 'border-red-800/60 bg-red-950/20' : 'border-[#1E293B] bg-[#0F172A]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-[#F8FAFC]">{t('todaySummary', locale)}</h2>
        {over && (
          <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-400">
            <TriangleAlert className="w-3 h-3" />
            {t('overGoal', locale)}
          </span>
        )}
        {reached && (
          <span className="flex items-center gap-1 rounded-full bg-[#16B981]/15 px-2.5 py-1 text-[10px] font-bold text-[#22C55E]">
            <CircleCheck className="w-3 h-3" />
            {t('goalReached', locale)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <CalorieRing current={calories} goal={goalCalories} animate={animate} />

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[#94A3B8]">{t('calories', locale)}</span>
          </div>
          <p className="text-3xl font-extrabold leading-tight text-[#F8FAFC]">
            {calories}
            <span className="text-base font-normal text-[#94A3B8]">/{goalCalories}</span>
          </p>
          {over ? (
            <p className="text-sm text-[#94A3B8]">
              <span className="font-bold text-red-400">+{calories - goalCalories}</span> kcal فوق الهدف
            </p>
          ) : (
            <p className="text-sm text-[#94A3B8]">
              {t('remaining', locale)}: <span className="font-bold text-[#22C55E]">{remaining}</span> kcal
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3.5 border-t border-[#1E293B] pt-4">
        {macros.map((m) => (
          <MacroBar
            key={m.key}
            label={m.label}
            icon={m.icon}
            current={m.current}
            goal={m.goal}
            color={m.color}
            animate={animate}
          />
        ))}
      </div>
    </div>
  );
}
