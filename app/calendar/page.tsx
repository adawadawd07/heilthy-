'use client';

import { useState, useEffect, useMemo } from 'react';
import { t } from '@/lib/translations';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_TIMEZONE, getLogicalNutritionDate } from '@/lib/dates';
import { DailySummary, Meal, PublicUser } from '@/types';
import { calculateNutritionTotals } from '@/lib/summary';
import { round } from '@/lib/nutrition';
import { apiJson } from '@/lib/api-client';
import Navigation from '@/components/Navigation';
import MealCard from '@/components/MealCard';

const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function CalendarPage() {
  const [current, setCurrent] = useState(() => new Date());
  const [mealsByDate, setMealsByDate] = useState<Record<string, Meal[]>>({});
  const [goal, setGoal] = useState(0);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const year = current.getFullYear();
  const month = current.getMonth();

  useEffect(() => {
    apiJson<{ user: PublicUser }>('/api/user').then((data) => {
      setGoal(data?.user?.daily_calories ?? 0);
      setTimezone(data?.user?.timezone || DEFAULT_TIMEZONE);
    });
  }, []);

  useEffect(() => {
    apiJson<Record<string, Meal[]>>(`/api/calendar?month=${month + 1}&year=${year}`)
      .then((data) => setMealsByDate(data && typeof data === 'object' ? data : {}))
      .finally(() => setLoading(false));
  }, [month, year]);

  const summaries = useMemo(() => {
    const map: Record<string, DailySummary> = {};
    for (const [date, meals] of Object.entries(mealsByDate)) {
      map[date] = calculateNutritionTotals(meals, date);
    }
    return map;
  }, [mealsByDate]);

  const today = getLogicalNutritionDate(new Date(), timezone);
  const startDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: ({ date: string; day: number } | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
    });
  }

  const monthStats = useMemo(() => {
    const days = Object.values(summaries).filter((s) => s.meal_count > 0);
    const totalCalories = days.reduce((sum, s) => sum + s.calories, 0);
    return {
      totalCalories: Math.round(totalCalories),
      daysLogged: days.length,
      average: days.length ? Math.round(totalCalories / days.length) : 0,
    };
  }, [summaries]);

  const selectedMeals = selected ? (mealsByDate[selected] ?? []) : [];
  const selectedSummary = selected ? summaries[selected] : undefined;

  function changeMonth(offset: number) {
    setLoading(true);
    setSelected(null);
    setCurrent(new Date(year, month + offset, 1));
  }

  function ringColor(calories: number) {
    if (!goal) return 'bg-[#16B981]';
    const pct = calories / goal;
    if (pct > 1.1) return 'bg-red-500';
    if (pct >= 0.85) return 'bg-[#22C55E]';
    return 'bg-yellow-500';
  }

  return (
    <div className="pb-28">
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            aria-label={t('back')}
            className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-2 text-[#94A3B8] transition hover:text-[#F8FAFC]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[#F8FAFC]">
            {new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(current)}
          </h1>
          <button
            onClick={() => changeMonth(1)}
            aria-label={t('next')}
            className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-2 text-[#94A3B8] transition hover:text-[#F8FAFC]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-3 text-center">
            <p className="text-lg font-extrabold text-[#F8FAFC]">{monthStats.average}</p>
            <p className="text-[10px] text-[#94A3B8]">{t('average')} kcal</p>
          </div>
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-3 text-center">
            <p className="text-lg font-extrabold text-[#F8FAFC]">{monthStats.daysLogged}</p>
            <p className="text-[10px] text-[#94A3B8]">{t('daysLogged')}</p>
          </div>
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-3 text-center">
            <p className="text-lg font-extrabold text-[#F8FAFC]">{round(monthStats.totalCalories / 1000, 1)}k</p>
            <p className="text-[10px] text-[#94A3B8]">{t('monthTotal')}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-3">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-[#94A3B8]">
            {dayNames.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`empty-${i}`} />;
              const summary = summaries[cell.date];
              const hasMeals = Boolean(summary?.meal_count);
              const isToday = cell.date === today;
              const isSelected = cell.date === selected;
              return (
                <button
                  key={cell.date}
                  onClick={() => setSelected(isSelected ? null : cell.date)}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-center transition ${
                    isSelected
                      ? 'border-[#16B981] bg-[#16B981]/20'
                      : isToday
                        ? 'border-[#16B981]/50 bg-[#16B981]/10'
                        : 'border-transparent bg-[#1E293B]/40 hover:bg-[#1E293B]'
                  }`}
                >
                  <span className={`text-xs font-bold ${hasMeals ? 'text-[#F8FAFC]' : 'text-[#64748B]'}`}>
                    {cell.day}
                  </span>
                  {hasMeals ? (
                    <span className={`h-1.5 w-1.5 rounded-full ${ringColor(summary.calories)}`} />
                  ) : (
                    <span className="h-1.5 w-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading && <div className="h-16 animate-pulse rounded-2xl bg-[#0F172A]" />}

        {selected && (
          <section className="space-y-3">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-bold text-[#F8FAFC]">
                  {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(
                    new Date(`${selected}T00:00:00Z`)
                  )}
                </h2>
                <span className="text-lg font-extrabold text-[#22C55E]">
                  {Math.round(selectedSummary?.calories ?? 0)}
                  <span className="text-xs font-normal text-[#94A3B8]"> kcal</span>
                </span>
              </div>
              {selectedSummary && selectedSummary.meal_count > 0 && (
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {t('protein')} {selectedSummary.protein_g}g · {t('carbs')} {selectedSummary.carbs_g}g ·{' '}
                  {t('fat')} {selectedSummary.fat_g}g
                  {goal ? ` · ${t('dailyGoals')} ${goal} kcal` : ''}
                </p>
              )}
            </div>

            {selectedMeals.length === 0 ? (
              <p className="rounded-2xl border border-[#1E293B] bg-[#0F172A] py-8 text-center text-sm text-[#94A3B8]">
                {t('noMeals')}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onDelete={(id) =>
                      setMealsByDate((prev) => ({
                        ...prev,
                        [selected]: (prev[selected] ?? []).filter((m) => m.id !== id),
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <Navigation />
    </div>
  );
}
