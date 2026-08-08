'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { t } from '@/lib/translations';
import { calculateNutrition, computeMealTotals, round } from '@/lib/nutrition';
import { MEAL_TYPES, inferMealType } from '@/lib/meals';
import { apiFetch } from '@/lib/api-client';
import { Meal, MealItem } from '@/types';
import Navigation from '@/components/Navigation';
import { AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';

type MealType = Meal['meal_type'];

interface AnalyzedItem {
  name: string;
  name_ar: string;
  name_en: string;
  unit: string;
  estimated_count?: number;
  estimated_weight_g: number;
  confidence: 'high' | 'medium' | 'low';
  matched_food_id?: string;
  nutrition_source?: string;
  calories_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const confidenceStyles: Record<string, string> = {
  high: 'bg-[#16B981]/15 text-[#22C55E]',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low: 'bg-red-500/15 text-red-400',
};

export default function ConfirmPage() {
  const router = useRouter();
  const [items, setItems] = useState<AnalyzedItem[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [mealType, setMealType] = useState<MealType>(() => inferMealType(new Date().getHours()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('nutri-analysis');
    queueMicrotask(() => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setItems(Array.isArray(parsed.items) ? parsed.items : []);
          setNotes(Array.isArray(parsed.notes) ? parsed.notes : []);
        } catch {
          setItems([]);
        }
      }
      setLoaded(true);
    });
  }, []);

  function updateWeight(idx: number, rawWeight: number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const weight = Math.max(0, rawWeight);
        const calc = calculateNutrition(
          {
            id: item.matched_food_id || 'ai',
            name: item.name,
            name_ar: item.name_ar,
            name_en: item.name_en,
            serving_unit: item.unit,
            serving_weight_g: weight || 100,
            calories_per_100g: item.calories_per_100g,
            protein_g_per_100g: item.protein_g_per_100g,
            carbs_g_per_100g: item.carbs_g_per_100g,
            fat_g_per_100g: item.fat_g_per_100g,
            source: item.nutrition_source || 'ai',
          },
          weight
        );
        return { ...item, estimated_weight_g: weight, ...calc };
      })
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const mealItems: MealItem[] = items.map((item) => ({
    id: crypto.randomUUID(),
    meal_id: 'temp',
    food_id: item.matched_food_id || '',
    name: item.name,
    name_ar: item.name_ar,
    name_en: item.name_en,
    quantity: item.estimated_count || 1,
    unit: item.unit,
    weight_g: round(item.estimated_weight_g, 1),
    calories: item.calories,
    protein_g: item.protein_g,
    carbs_g: item.carbs_g,
    fat_g: item.fat_g,
    confidence: item.confidence,
  }));

  const totals = computeMealTotals(mealItems);

  async function saveMeal() {
    if (mealItems.length === 0) return;
    setSaving(true);
    setError('');

    const res = await apiFetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: t(mealType),
        name_ar: t(mealType, 'ar'),
        name_en: t(mealType, 'en'),
        meal_type: mealType,
        items: mealItems,
        source: 'scan',
      }),
    });

    if (res.ok) {
      sessionStorage.removeItem('nutri-analysis');
      router.push('/');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('unexpectedError'));
      setSaving(false);
    }
  }

  if (loaded && items.length === 0) {
    return (
      <div className="pb-28">
        <main className="max-w-2xl mx-auto p-4 space-y-4">
          <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('confirmMeal')}</h1>
          <p className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-6 text-center text-sm text-[#94A3B8]">
            {t('noData')}
          </p>
          <Link
            href="/add"
            className="block rounded-2xl bg-[#16B981] py-3.5 text-center font-bold text-white transition hover:bg-[#059669]"
          >
            {t('scanner')}
          </Link>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="pb-28">
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <header className="flex items-center gap-3">
          <Link href="/add" className="p-2 rounded-xl bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('confirmMeal')}</h1>
        </header>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
          <p className="mb-3 text-sm font-bold text-[#F8FAFC]">{t('meal')}</p>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  mealType === type ? 'bg-[#16B981] text-white' : 'bg-[#1E293B] text-[#94A3B8]'
                }`}
              >
                {t(type)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[#F8FAFC]">{item.name_ar}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      confidenceStyles[item.confidence] || confidenceStyles.low
                    }`}
                  >
                    {t(
                      item.confidence === 'high'
                        ? 'highConfidence'
                        : item.confidence === 'medium'
                          ? 'mediumConfidence'
                          : 'lowConfidence'
                    )}
                  </span>
                  <button
                    onClick={() => removeItem(idx)}
                    aria-label={t('removeItem')}
                    className="p-1 text-[#94A3B8] transition hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-[#94A3B8]">{t('weight')}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={5}
                  value={item.estimated_weight_g}
                  onChange={(e) => updateWeight(idx, Number.parseFloat(e.target.value) || 0)}
                  className="w-24 rounded-xl border border-[#1E293B] bg-[#0B1A14] p-2 text-center text-[#F8FAFC] outline-none focus:border-[#16B981]"
                />
                <span className="text-xs text-[#94A3B8]">{t('grams')}</span>
                <span className="ms-auto text-lg font-extrabold text-[#22C55E]">
                  {Math.round(item.calories)}
                  <span className="text-xs font-normal text-[#94A3B8]"> kcal</span>
                </span>
              </div>

              <p className="text-xs text-[#94A3B8]">
                {t('protein')} {item.protein_g}g · {t('carbs')} {item.carbs_g}g · {t('fat')} {item.fat_g}g
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#16B981]/40 bg-[#16B981]/10 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[#94A3B8]">{t('total')}</span>
            <span className="text-3xl font-extrabold text-[#F8FAFC]">
              {totals.total_calories} <span className="text-sm font-normal text-[#94A3B8]">kcal</span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { label: t('protein'), value: totals.total_protein_g },
              { label: t('carbs'), value: totals.total_carbs_g },
              { label: t('fat'), value: totals.total_fat_g },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-[#0B1A14]/60 py-2">
                <p className="text-base font-extrabold text-[#F8FAFC]">{m.value}g</p>
                <p className="text-[10px] text-[#94A3B8]">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {notes.length > 0 && (
          <div className="rounded-2xl border border-yellow-700/30 bg-yellow-950/20 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-yellow-300">
              <AlertTriangle className="w-4 h-4" />
              {t('estimateDisclaimer')}
            </p>
            <ul className="space-y-1 text-xs text-yellow-200/80">
              {notes.map((note, i) => (
                <li key={i}>• {note}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-800/60 bg-red-950/40 px-3 py-2.5 text-sm font-bold text-red-300"
          >
            {error}
          </p>
        )}

        <button
          onClick={saveMeal}
          disabled={saving || mealItems.length === 0}
          className="w-full rounded-2xl bg-[#16B981] py-3.5 font-bold text-white transition hover:bg-[#059669] disabled:opacity-40"
        >
          {saving ? t('saving') : t('confirm')}
        </button>
      </main>
      <Navigation />
    </div>
  );
}
