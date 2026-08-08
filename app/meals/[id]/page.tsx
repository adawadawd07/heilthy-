'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { t } from '@/lib/translations';
import { calculateNutrition, computeMealTotals, findFoodByName, round } from '@/lib/nutrition';
import { MEAL_TYPES } from '@/lib/meals';
import { apiFetch } from '@/lib/api-client';
import { Food, Meal, MealItem } from '@/types';
import Navigation from '@/components/Navigation';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';

type MealType = Meal['meal_type'];

export default function EditMealPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [items, setItems] = useState<MealItem[]>([]);
  const [mealType, setMealType] = useState<MealType>('snack');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [amount, setAmount] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/meals/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data: Meal = await res.json();
        setMeal(data);
        setItems(data.items);
        setMealType(data.meal_type);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const results = useMemo(() => (query.trim() ? findFoodByName(query) : []), [query]);
  const totals = computeMealTotals(items);

  function changeWeight(itemId: string, rawWeight: number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const weight = Math.max(0, rawWeight);
        const per100 = item.weight_g > 0 ? 100 / item.weight_g : 0;
        const food: Food = {
          id: item.food_id || 'edit',
          name: item.name,
          name_ar: item.name_ar,
          name_en: item.name_en,
          serving_unit: item.unit,
          serving_weight_g: item.weight_g || 100,
          calories_per_100g: round(item.calories * per100, 2),
          protein_g_per_100g: round(item.protein_g * per100, 2),
          carbs_g_per_100g: round(item.carbs_g * per100, 2),
          fat_g_per_100g: round(item.fat_g * per100, 2),
          source: 'edit',
        };
        return {
          ...item,
          weight_g: round(weight, 1),
          quantity: item.unit === 'g' ? round(weight, 1) : item.quantity,
          ...calculateNutrition(food, weight),
        };
      })
    );
  }

  function addItem() {
    if (!selected) return;
    const parsed = Number.parseFloat(amount);
    const weight = Math.max(0, (parsed || 0) * selected.serving_weight_g);
    if (weight <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        meal_id: id ?? 'temp',
        food_id: selected.id,
        name: selected.name,
        name_ar: selected.name_ar,
        name_en: selected.name_en,
        quantity: round(parsed, 2),
        unit: selected.serving_unit,
        weight_g: round(weight, 1),
        ...calculateNutrition(selected, weight),
      },
    ]);
    setSelected(null);
    setQuery('');
    setAmount('1');
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  async function save() {
    if (!id || items.length === 0) return;
    setSaving(true);
    setError('');
    const res = await apiFetch(`/api/meals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, meal_type: mealType }),
    });
    if (res.ok) {
      router.back();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('unexpectedError'));
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className="pb-28">
        <main className="max-w-2xl mx-auto p-4 space-y-4">
          <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('editMeal')}</h1>
          <p className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-6 text-center text-sm text-[#94A3B8]">
            {t('noData')}
          </p>
          <Link
            href="/"
            className="block rounded-2xl bg-[#16B981] py-3.5 text-center font-bold text-white transition hover:bg-[#059669]"
          >
            {t('home')}
          </Link>
        </main>
        <Navigation />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="h-9 w-40 animate-pulse rounded-xl bg-[#0F172A]" />
        <div className="h-20 animate-pulse rounded-2xl bg-[#0F172A]" />
        <div className="h-40 animate-pulse rounded-2xl bg-[#0F172A]" />
      </div>
    );
  }

  return (
    <div className="pb-28">
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label={t('back')}
            className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-2 text-[#94A3B8] transition hover:text-[#F8FAFC]"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('editMeal')}</h1>
            <p className="text-xs text-[#94A3B8]">{meal.logical_date}</p>
          </div>
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

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[#F8FAFC]">{item.name_ar}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={t('removeItem')}
                  className="p-1 text-[#94A3B8] transition hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-[#94A3B8]">{t('weight')}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={5}
                  value={item.weight_g}
                  onChange={(e) => changeWeight(item.id, Number.parseFloat(e.target.value) || 0)}
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
          {items.length === 0 && (
            <p className="rounded-2xl border border-[#1E293B] bg-[#0F172A] py-6 text-center text-sm text-[#94A3B8]">
              {t('noItems')}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-3">
          <label className="block text-sm text-[#94A3B8]">{t('searchFood')}</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder={t('searchFood')}
            className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
          />
          {query.trim() && !selected && (
            <div className="max-h-44 divide-y divide-[#1E293B] overflow-y-auto rounded-xl border border-[#1E293B] bg-[#0B1A14]">
              {results.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelected(f);
                    setQuery(f.name_ar);
                  }}
                  className="w-full p-3 text-start transition hover:bg-[#1E293B]"
                >
                  <span className="block text-sm font-bold text-[#F8FAFC]">{f.name_ar}</span>
                  <span className="block text-xs text-[#94A3B8]">
                    {f.calories_per_100g} kcal / 100{t('grams')}
                  </span>
                </button>
              ))}
              {results.length === 0 && <p className="p-3 text-sm text-[#94A3B8]">{t('noResults')}</p>}
            </div>
          )}
          {selected && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[#94A3B8]">
                  {t('quantity')} ({selected.serving_weight_g}g)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.25}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
                />
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-1 rounded-xl bg-[#16B981] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#059669]"
              >
                <Plus className="w-4 h-4" />
                {t('add')}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#16B981]/40 bg-[#16B981]/10 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[#94A3B8]">{t('total')}</span>
            <span className="text-2xl font-extrabold text-[#F8FAFC]">
              {totals.total_calories} <span className="text-sm font-normal text-[#94A3B8]">kcal</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-[#94A3B8]">
            {t('protein')} {totals.total_protein_g}g · {t('carbs')} {totals.total_carbs_g}g · {t('fat')}{' '}
            {totals.total_fat_g}g
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-800/60 bg-red-950/40 px-3 py-2.5 text-sm font-bold text-red-300"
          >
            {error}
          </p>
        )}

        <button
          onClick={save}
          disabled={saving || items.length === 0}
          className="w-full rounded-2xl bg-[#16B981] py-3.5 font-bold text-white transition hover:bg-[#059669] disabled:opacity-40"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </main>
      <Navigation />
    </div>
  );
}
