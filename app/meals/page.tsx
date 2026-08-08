'use client';

import { useEffect, useMemo, useState } from 'react';
import { Meal } from '@/types';
import { t } from '@/lib/translations';
import { Search } from 'lucide-react';
import MealCard from '@/components/MealCard';
import Navigation from '@/components/Navigation';
import { calculateNutritionTotals } from '@/lib/summary';
import { apiJson } from '@/lib/api-client';

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<Meal[]>('/api/meals')
      .then((data) => setMeals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter(
      (m) =>
        m.name_ar.toLowerCase().includes(q) ||
        m.name_en.toLowerCase().includes(q) ||
        m.items.some(
          (i) => i.name_ar.toLowerCase().includes(q) || i.name_en.toLowerCase().includes(q)
        )
    );
  }, [meals, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const meal of filtered) {
      const list = map.get(meal.logical_date) ?? [];
      list.push(meal);
      map.set(meal.logical_date, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  function formatDay(logicalDate: string) {
    const [y, m, d] = logicalDate.split('-').map(Number);
    return new Intl.DateTimeFormat('ar-SA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(Date.UTC(y, m - 1, d)));
  }

  return (
    <div className="pb-28">
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('myMeals')}</h1>

        <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-3.5 w-5 h-5 text-[#94A3B8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchFood')}
            className="w-full rounded-2xl border border-[#1E293B] bg-[#0F172A] p-3 pe-11 text-[#F8FAFC] outline-none focus:border-[#16B981]"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#0F172A]" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <p className="rounded-2xl border border-[#1E293B] bg-[#0F172A] py-10 text-center text-sm text-[#94A3B8]">
            {t('noMeals')}
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, dayMeals]) => {
              const totals = calculateNutritionTotals(dayMeals, date);
              return (
                <section key={date} className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-[#1E293B] pb-2">
                    <h2 className="text-sm font-bold text-[#F8FAFC]">{formatDay(date)}</h2>
                    <span className="text-xs text-[#94A3B8]">
                      <span className="font-bold text-[#22C55E]">{Math.round(totals.calories)} kcal</span>
                      {' · '}
                      {totals.protein_g}p / {totals.carbs_g}c / {totals.fat_g}f
                    </span>
                  </div>
                  <div className="space-y-3">
                    {dayMeals.map((meal) => (
                      <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
      <Navigation />
    </div>
  );
}
