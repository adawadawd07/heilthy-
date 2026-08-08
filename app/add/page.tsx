import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { t } from '@/lib/translations';
import { isVisionConfigured } from '@/lib/ai';
import { requireUser } from '@/lib/session';
import Navigation from '@/components/Navigation';
import MealScanner from '@/components/MealScanner';

export const dynamic = 'force-dynamic';

export default async function AddMealPage() {
  const user = await requireUser('/add');
  const locale = (user.language as 'ar' | 'en') || 'ar';

  return (
    <div className="pb-28">
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <header className="flex items-center gap-3">
          <Link
            href="/"
            aria-label={t('back', locale)}
            className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-2 text-[#94A3B8] transition hover:text-[#F8FAFC]"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-[#F8FAFC]">{t('scanner', locale)}</h1>
        </header>

        <MealScanner aiConfigured={isVisionConfigured()} locale={locale} />
      </main>
      <Navigation locale={locale} />
    </div>
  );
}
