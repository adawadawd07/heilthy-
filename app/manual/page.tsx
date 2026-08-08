'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { t } from '@/lib/translations';
import { findFoodByName, calculateNutrition, computeMealTotals, round } from '@/lib/nutrition';
import { MEAL_TYPES, inferMealType } from '@/lib/meals';
import { apiFetch } from '@/lib/api-client';
import { Meal, MealItem, Food } from '@/types';
import Navigation from '@/components/Navigation';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';

type MealType = Meal['meal_type'];
type Mode = 'serving' | 'grams';

export default function ManualMealPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [mode, setMode] = useState<Mode>('serving');
  const [amount, setAmount] = useState('1');
  const [items, setItems] = useState<MealItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(() => inferMealType(new Date().getHours()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const results = useMemo(() => (query.trim() ? findFoodByName(query) : []), [query]);

  const parsedAmount = Number.parseFloat(amount);
  const weightG = selected
    ? mode === 'grams'
      ? Math.max(0, parsedAmount || 0)
      : Math.max(0, (parsedAmount || 0) * selected.serving_weight_g)
    : 0;

  const preview = selected && weightG > 0 ? calculateNutrition(selected, weightG) : null;
  const totals = computeMealTotals(items);

  function addItem() {
    if (!selected || weightG <= 0) return;
    const calc = calculateNutrition(selected, weightG);
    const quantity = mode === 'grams' ? weightG : round(parsedAmount, 2);
    const item: MealItem = {
      id: crypto.randomUUID(),
      meal_id: 'temp',
      food_id: selected.id,
      name: selected.name,
      name_ar: selected.name_ar,
      name_en: selected.name_en,
      quantity,
      unit: mode === 'grams' ? 'g' : selected.serving_unit,
      weight_g: round(weightG, 1),
      ...calc,
    };
    setItems((prev) => [...prev, item]);
    setSelected(null);
    setQuery('');
    setAmount('1');
    setMode('serving');
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function save() {
    if (items.length === 0) return;
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
        items,
        source: 'manual',
      }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('unexpectedError'));
      setSaving(false);
    }
  }

  return (
    <div className="pb-28">
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <header className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('addManual')}</h1>
        </header>

        <div className="bg-[#0F172A] rounded-2xl p-4 border border-[#1E293B] space-y-3">
          <label className="block text-sm text-[#94A3B8]">{t('searchFood')}</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            className="w-full bg-[#0B1A14] border border-[#1E293B] rounded-xl p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
            placeholder={t('searchFood')}
          />

          {query.trim() && !selected && (
            <div className="bg-[#0B1A14] border border-[#1E293B] rounded-xl max-h-52 overflow-y-auto divide-y divide-[#1E293B]">
              {results.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelected(f);
                    setQuery(f.name_ar);
                  }}
                  className="w-full text-start p-3 hover:bg-[#1E293B] transition"
                >
                  <span className="block text-sm font-bold text-[#F8FAFC]">{f.name_ar}</span>
                  <span className="block text-xs text-[#94A3B8]">
                    {f.calories_per_100g} kcal / 100{t('grams')} · {f.serving_weight_g}g / {f.serving_unit}
                  </span>
                </button>
              ))}
              {results.length === 0 && <p className="p-3 text-sm text-[#94A3B8]">{t('noResults')}</p>}
            </div>
          )}

          {selected && (
            <div className="space-y-3 rounded-xl bg-[#1E293B] p-3">
              <p className="text-sm font-bold text-[#F8FAFC]">{selected.name_ar}</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMode('serving');
                    setAmount('1');
                  }}
                  className={`rounded-xl py-2 text-xs font-bold transition ${
                    mode === 'serving' ? 'bg-[#16B981] text-white' : 'bg-[#0B1A14] text-[#94A3B8]'
                  }`}
                >
                  {t('serving')} ({selected.serving_weight_g}g)
                </button>
                <button
                  onClick={() => {
                    setMode('grams');
                    setAmount(String(selected.serving_weight_g));
                  }}
                  className={`rounded-xl py-2 text-xs font-bold transition ${
                    mode === 'grams' ? 'bg-[#16B981] text-white' : 'bg-[#0B1A14] text-[#94A3B8]'
                  }`}
                >
                  {t('grams')}
                </button>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-[#94A3B8] mb-1">
                    {mode === 'grams' ? t('weight') : t('quantity')}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={mode === 'grams' ? 5 : 0.25}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0B1A14] border border-[#1E293B] rounded-xl p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
                  />
                </div>
                <button
                  onClick={addItem}
                  disabled={weightG <= 0}
                  className="flex items-center gap-1 rounded-xl bg-[#16B981] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#059669] disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  {t('add')}
                </button>
              </div>

              {preview && (
                <p className="text-xs text-[#94A3B8]">
                  {round(weightG, 1)}g →{' '}
                  <span className="font-bold text-[#22C55E]">{Math.round(preview.calories)} kcal</span> ·{' '}
                  {preview.protein_g}p / {preview.carbs_g}c / {preview.fat_g}f
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#0F172A] rounded-2xl p-4 border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F8FAFC]">{t('meal')}</h2>
            <span className="text-xs text-[#94A3B8]">{items.length}</span>
          </div>

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

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#94A3B8]">{t('noItems')}</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[#1E293B] p-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[#F8FAFC]">{item.name_ar}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {item.quantity} {item.unit === 'g' ? t('grams') : item.unit} · {item.weight_g}g ·{' '}
                      {item.protein_g}p / {item.carbs_g}c / {item.fat_g}f
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#22C55E]">{Math.round(item.calories)}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={t('removeItem')}
                    className="p-1.5 text-[#94A3B8] transition hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
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
          onClick={save}
          disabled={items.length === 0 || saving}
          className="w-full rounded-2xl bg-[#16B981] py-3.5 font-bold text-white transition hover:bg-[#059669] disabled:opacity-40"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </main>
      <Navigation />
    </div>
  );
}
