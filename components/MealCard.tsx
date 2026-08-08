'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Meal } from '@/types';
import { t } from '@/lib/translations';
import { MEAL_EMOJI } from '@/lib/meals';
import { apiFetch } from '@/lib/api-client';
import { Pencil, Trash2 } from 'lucide-react';

export default function MealCard({
  meal,
  locale = 'ar',
  timezone = 'Asia/Riyadh',
  onDelete,
}: {
  meal: Meal;
  locale?: 'ar' | 'en';
  timezone?: string;
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (hidden) return null;

  const typeLabels: Record<string, string> = {
    breakfast: t('breakfast', locale),
    lunch: t('lunch', locale),
    dinner: t('dinner', locale),
    snack: t('snack', locale),
  };

  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(meal.timestamp));

  const itemsLabel = meal.items
    .map((item) => `${item.quantity} × ${locale === 'ar' ? item.name_ar : item.name_en}`)
    .join(' • ');

  async function handleDelete() {
    if (!confirm(locale === 'ar' ? 'هل تريد حذف هذه الوجبة؟' : 'Delete this meal?')) return;
    setDeleting(true);
    const res = await apiFetch(`/api/meals/${meal.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setDeleting(false);
      alert(t('unexpectedError', locale));
      return;
    }
    onDelete?.(meal.id);
    setHidden(true);
    router.refresh();
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-[#1E293B] bg-[#0F172A] p-3 shadow-sm transition ${
        deleting ? 'opacity-50' : 'hover:border-[#1E293B] hover:bg-[#0F172A]/80'
      }`}
    >
      <div className="w-14 h-14 rounded-xl bg-[#1E293B] flex items-center justify-center text-2xl flex-shrink-0">
        {MEAL_EMOJI[meal.meal_type] || '🍽️'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#F8FAFC] truncate">{typeLabels[meal.meal_type]}</h3>
          <span className="text-xs text-[#94A3B8]">{time}</span>
        </div>
        {itemsLabel && <p className="text-xs text-[#94A3B8] truncate">{itemsLabel}</p>}
        <p className="text-xs text-[#94A3B8] mt-1">
          <span className="font-bold text-[#22C55E]">{meal.total_calories} kcal</span>
          {' · '}
          {meal.total_protein_g}p / {meal.total_carbs_g}c / {meal.total_fat_g}f
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Link
          href={`/meals/${meal.id}`}
          aria-label={t('editMeal', locale)}
          className="p-2 text-[#94A3B8] transition hover:text-[#22C55E]"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <button
          className="p-2 text-[#94A3B8] transition hover:text-red-400 disabled:opacity-40"
          aria-label={t('delete', locale)}
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
