'use client';

import { useEffect, useState } from 'react';
import { t } from '@/lib/translations';
import { StatsResult } from '@/lib/stats';
import { apiJson } from '@/lib/api-client';
import Navigation from '@/components/Navigation';
import CaloriesChart from '@/components/CaloriesChart';
import MacroDonut from '@/components/MacroDonut';
import MacroBar from '@/components/MacroBar';
import { Beef, Wheat, Droplet, Flame, Target, TrendingUp, CalendarCheck } from 'lucide-react';

const RANGES = [
  { days: 7, key: 'last7Days' as const },
  { days: 30, key: 'last30Days' as const },
  { days: 90, key: 'last90Days' as const },
];

export default function StatsPage() {
  const [range, setRange] = useState(7);
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<StatsResult>(`/api/stats?days=${range}`)
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [range]);

  function selectRange(days: number) {
    setLoading(true);
    setRange(days);
  }

  function formatDay(date: string) {
    const [y, m, d] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' }).format(
      new Date(Date.UTC(y, m - 1, d))
    );
  }

  return (
    <div className="pb-28">
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('stats')}</h1>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#1E293B] bg-[#0F172A] p-1.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => selectRange(r.days)}
              className={`rounded-xl py-2 text-xs font-bold transition ${
                range === r.days ? 'bg-[#16B981] text-white' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {t(r.key)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#0F172A]" />
              ))}
            </div>
            <div className="h-52 animate-pulse rounded-2xl bg-[#0F172A]" />
          </div>
        )}

        {!loading && (!stats || stats.loggedDays === 0) && (
          <p className="rounded-2xl border border-[#1E293B] bg-[#0F172A] py-12 text-center text-sm text-[#94A3B8]">
            {t('notEnoughData')}
          </p>
        )}

        {!loading && stats && stats.loggedDays > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
                <div className="mb-1 flex items-center gap-2 text-[#94A3B8]">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs">{t('average')}</span>
                </div>
                <p className="text-2xl font-extrabold text-[#F8FAFC]">
                  {stats.avgCalories}
                  <span className="text-xs font-normal text-[#94A3B8]"> kcal</span>
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {t('goalLine')} {stats.goals.daily_calories}
                </p>
              </div>

              <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
                <div className="mb-1 flex items-center gap-2 text-[#94A3B8]">
                  <Target className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-xs">{t('adherence')}</span>
                </div>
                <p className="text-2xl font-extrabold text-[#F8FAFC]">
                  {stats.adherencePct}
                  <span className="text-xs font-normal text-[#94A3B8]">%</span>
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {stats.onTargetDays}/{stats.loggedDays} {t('onTargetDays')}
                </p>
              </div>

              <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
                <div className="mb-1 flex items-center gap-2 text-[#94A3B8]">
                  <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-xs">{t('streak')}</span>
                </div>
                <p className="text-2xl font-extrabold text-[#F8FAFC]">
                  {stats.streak}
                  <span className="text-xs font-normal text-[#94A3B8]"> {t('day')}</span>
                </p>
                <p className="text-[10px] text-[#64748B]">🔥</p>
              </div>

              <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
                <div className="mb-1 flex items-center gap-2 text-[#94A3B8]">
                  <CalendarCheck className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-xs">{t('daysLogged')}</span>
                </div>
                <p className="text-2xl font-extrabold text-[#F8FAFC]">
                  {stats.loggedDays}
                  <span className="text-xs font-normal text-[#94A3B8]">/{stats.range}</span>
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {Math.round((stats.loggedDays / stats.range) * 100)}%
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#F8FAFC]">{t('caloriesTrend')}</h2>
              <CaloriesChart days={stats.days} goal={stats.goals.daily_calories} />
            </section>

            <section className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-4">
              <h2 className="text-sm font-bold text-[#F8FAFC]">{t('macroDistribution')}</h2>
              <MacroDonut
                split={stats.macroSplit}
                labels={{ protein: t('protein'), carbs: t('carbs'), fat: t('fat') }}
              />
            </section>

            <section className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-4">
              <h2 className="text-sm font-bold text-[#F8FAFC]">
                {t('average')} · {t('dailyGoals')}
              </h2>
              <div className="space-y-3.5">
                <MacroBar
                  label={t('protein')}
                  icon={Beef}
                  current={Math.round(stats.avgProtein)}
                  goal={stats.goals.daily_protein_g}
                  color="text-[#22C55E]"
                  track="bg-[#1E293B]"
                />
                <MacroBar
                  label={t('carbs')}
                  icon={Wheat}
                  current={Math.round(stats.avgCarbs)}
                  goal={stats.goals.daily_carbs_g}
                  color="text-yellow-400"
                  track="bg-[#1E293B]"
                />
                <MacroBar
                  label={t('fat')}
                  icon={Droplet}
                  current={Math.round(stats.avgFat)}
                  goal={stats.goals.daily_fat_g}
                  color="text-blue-400"
                  track="bg-[#1E293B]"
                />
              </div>
            </section>

            {(stats.bestDay || stats.worstDay) && (
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {stats.bestDay && (
                  <div className="rounded-2xl border border-[#16B981]/40 bg-[#16B981]/10 p-4">
                    <p className="text-xs text-[#94A3B8]">{t('bestDay')}</p>
                    <p className="mt-1 text-sm font-bold text-[#F8FAFC]">{formatDay(stats.bestDay.date)}</p>
                    <p className="text-lg font-extrabold text-[#22C55E]">
                      {Math.round(stats.bestDay.calories)}
                      <span className="text-xs font-normal text-[#94A3B8]"> kcal</span>
                    </p>
                  </div>
                )}
                {stats.worstDay && (
                  <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
                    <p className="text-xs text-[#94A3B8]">{t('worstDay')}</p>
                    <p className="mt-1 text-sm font-bold text-[#F8FAFC]">{formatDay(stats.worstDay.date)}</p>
                    <p className="text-lg font-extrabold text-[#F8FAFC]">
                      {Math.round(stats.worstDay.calories)}
                      <span className="text-xs font-normal text-[#94A3B8]"> kcal</span>
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <Navigation />
    </div>
  );
}
