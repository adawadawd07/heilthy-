import Link from 'next/link';
import { getMeals } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { DEFAULT_TIMEZONE, getGreeting, getHourInTimezone, getLogicalNutritionDate } from '@/lib/dates';
import { calculateNutritionTotals } from '@/lib/summary';
import { t } from '@/lib/translations';
import Navigation from '@/components/Navigation';
import DailySummary from '@/components/DailySummary';
import MealCard from '@/components/MealCard';
import DayWatcher from '@/components/DayWatcher';
import AccountMenu from '@/components/AccountMenu';
import { Camera, PenLine, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const user = await requireUser();
  const locale = (user.language as 'ar' | 'en') || 'ar';
  const timezone = user.timezone || DEFAULT_TIMEZONE;

  const today = getLogicalNutritionDate(new Date(), timezone);
  const meals = await getMeals(user.id, today);
  const summary = calculateNutritionTotals(meals, today);

  const dateLabel = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const greeting = getGreeting(locale, getHourInTimezone(new Date(), timezone));
  const displayName = user.display_name || user.username;

  return (
    <div className="pb-28">
      <DayWatcher logicalDate={today} timezone={timezone} />
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold text-[#F8FAFC]">
              {greeting}
              {displayName ? `، ${displayName}` : ''} 👋
            </h1>
            <p className="text-sm text-[#94A3B8]">{dateLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/meals"
              aria-label={t('myMeals', locale)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1E293B] bg-[#0F172A] text-[#94A3B8] transition hover:text-[#F8FAFC]"
            >
              <Search className="h-4 w-4" />
            </Link>
            <AccountMenu displayName={displayName} username={user.username} locale={locale} />
          </div>
        </header>

        <DailySummary summary={summary} goals={user} locale={locale} />

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/add"
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#16B981]/40 bg-[#16B981]/10 py-3 text-sm font-bold text-[#22C55E] transition hover:bg-[#16B981]/20"
          >
            <Camera className="w-4 h-4" />
            {t('scanner', locale)}
          </Link>
          <Link
            href="/manual"
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#1E293B] bg-[#0F172A] py-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#1E293B]"
          >
            <PenLine className="w-4 h-4" />
            {t('addManual', locale)}
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#F8FAFC]">{t('mealsToday', locale)}</h2>
          {meals.length > 0 && (
            <span className="text-xs text-[#94A3B8]">
              {meals.length} {t('meal', locale)}
            </span>
          )}
        </div>

        {meals.length === 0 ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-[#1E293B] bg-[#0F172A] p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#16B981]/10 text-2xl">
              🍽️
            </span>
            <div className="space-y-1">
              <p className="font-bold text-[#F8FAFC]">{t('noMeals', locale)}</p>
              <p className="text-sm text-[#94A3B8]">{t('startScan', locale)} 📸</p>
            </div>
            <Link
              href="/manual"
              className="inline-flex items-center gap-2 rounded-xl border border-[#16B981]/40 bg-[#16B981]/10 px-4 py-2 text-sm font-bold text-[#22C55E] transition hover:bg-[#16B981]/20"
            >
              <PenLine className="h-4 w-4" />
              {t('addManual', locale)}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} locale={locale} timezone={timezone} />
            ))}
          </div>
        )}
      </main>
      <Navigation locale={locale} />
    </div>
  );
}
