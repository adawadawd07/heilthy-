'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/translations';
import { PublicUser } from '@/types';
import Navigation from '@/components/Navigation';
import { caloriesFromMacros, deriveMacroGoals } from '@/lib/goals';
import { apiFetch, apiJson } from '@/lib/api-client';
import { Download, Eraser, Wand2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiJson<{ user: PublicUser }>('/api/user').then((data) => setUser(data?.user ?? null));
  }, []);

  function applyAutoMacros() {
    if (!user) return;
    const derived = deriveMacroGoals(user.daily_calories);
    setUser({ ...user, ...derived });
    setMessage('');
  }

  async function handleExport() {
    const res = await apiFetch('/api/export');
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heilthy-${user?.username ?? 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function resetMeals() {
    if (!confirm(t('resetDataConfirm'))) return;
    const res = await apiFetch('/api/account', { method: 'POST' });
    if (res.ok) {
      setMessage(t('dataCleared'));
      router.refresh();
    }
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const res = await apiFetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) setUser(data.user);
      setMessage(t('saved'));
      router.refresh();
    } else {
      setMessage(t('unexpectedError'));
    }
    setSaving(false);
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="h-9 w-40 animate-pulse rounded-xl bg-[#0F172A]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#0F172A]" />
        <div className="h-56 animate-pulse rounded-2xl bg-[#0F172A]" />
      </div>
    );
  }

  const macroCalories = caloriesFromMacros(user);
  const mismatch = Math.abs(macroCalories - user.daily_calories) > 20;

  return (
    <div className="pb-28">
      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('settings')}</h1>
        {message && (
          <p className="rounded-xl border border-[#16B981]/40 bg-[#16B981]/10 px-4 py-2 text-sm font-bold text-[#22C55E]">
            {message}
          </p>
        )}

        <section className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">{t('dailyGoals')}</h2>
            <p className="text-xs text-[#94A3B8]">{t('autoMacrosHint')}</p>
          </div>

          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">{t('calories')} (kcal)</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={user.daily_calories}
              onChange={(e) => setUser({ ...user, daily_calories: Number(e.target.value) || 0 })}
              className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
            />
          </div>

          <button
            onClick={applyAutoMacros}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#16B981]/40 bg-[#16B981]/10 py-2.5 text-sm font-bold text-[#22C55E] transition hover:bg-[#16B981]/20"
          >
            <Wand2 className="w-4 h-4" />
            {t('autoMacros')}
          </button>

          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'daily_protein_g', label: t('protein') },
              { key: 'daily_carbs_g', label: t('carbs') },
              { key: 'daily_fat_g', label: t('fat') },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-[#94A3B8] mb-1">{label} (g)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={user[key]}
                  onChange={(e) => setUser({ ...user, [key]: Number(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-center text-[#F8FAFC] outline-none focus:border-[#16B981]"
                />
              </div>
            ))}
          </div>

          <p className={`text-xs ${mismatch ? 'text-yellow-400' : 'text-[#94A3B8]'}`}>
            {mismatch ? `${t('goalsMismatch')}: ` : ''}
            {user.daily_protein_g}×4 + {user.daily_carbs_g}×4 + {user.daily_fat_g}×9 ={' '}
            <span className="font-bold">{macroCalories}</span> kcal
          </p>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-[#16B981] py-3 font-bold text-white transition hover:bg-[#059669] disabled:opacity-40"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </section>

        <section className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#16B981] text-lg font-extrabold text-white">
              {(user.display_name || user.username).charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[#F8FAFC]">
                {user.display_name || user.username}
              </h2>
              <p dir="ltr" className="truncate text-start text-xs text-[#94A3B8]">
                @{user.username}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">{t('displayName')}</label>
            <input
              value={user.display_name || ''}
              onChange={(e) => setUser({ ...user, display_name: e.target.value })}
              className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">{t('language')}</label>
            <select
              value={user.language}
              onChange={(e) => setUser({ ...user, language: e.target.value as 'ar' | 'en' })}
              className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">{t('timezone')}</label>
            <select
              value={user.timezone}
              onChange={(e) => setUser({ ...user, timezone: e.target.value })}
              className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-[#F8FAFC] outline-none focus:border-[#16B981]"
            >
              <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
              <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
              <option value="Africa/Cairo">Africa/Cairo (UTC+2)</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
            <p className="mt-1 text-xs text-[#94A3B8]">
              يوم التغذية يبدأ منتصف الليل حسب هذه المنطقة الزمنية.
            </p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-[#16B981] py-3 font-bold text-white transition hover:bg-[#059669] disabled:opacity-40"
          >
            {saving ? t('saving') : t('save')}
          </button>

        </section>

        <section className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-3">
          <h2 className="text-lg font-bold text-[#F8FAFC]">{t('privacy')}</h2>
          <button
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1E293B] py-3 font-bold text-[#F8FAFC] transition hover:bg-[#1E293B]"
          >
            <Download className="w-4 h-4" />
            {t('exportData')} (CSV)
          </button>
          <button
            onClick={resetMeals}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-800/60 bg-yellow-950/20 py-3 font-bold text-yellow-300 transition hover:bg-yellow-950/40"
          >
            <Eraser className="w-4 h-4" />
            {t('resetData')}
          </button>
        </section>
      </main>
      <Navigation locale={user.language} />
    </div>
  );
}
