'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChartColumn, Plus, Calendar, Settings } from 'lucide-react';
import { t } from '@/lib/translations';
import { Locale } from '@/lib/translations';

export default function Navigation({ locale = 'ar' }: { locale?: Locale }) {
  const pathname = usePathname();
  const links = [
    { href: '/', label: t('home', locale), icon: Home },
    { href: '/stats', label: t('stats', locale), icon: ChartColumn },
    { href: '/add', label: t('addMeal', locale), icon: Plus, primary: true },
    { href: '/calendar', label: t('calendar', locale), icon: Calendar },
    { href: '/settings', label: t('settings', locale), icon: Settings },
  ];

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label={t('home', locale)}
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-[#1E293B] bg-[#0F172A]/95 pt-2 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md items-end justify-around">
        {links.map((link) =>
          link.primary ? (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              className="-mt-8 flex flex-col items-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#0B1A14] bg-gradient-to-br from-[#22C55E] to-[#16B981] text-white shadow-lg shadow-emerald-900/40 transition-transform active:scale-95">
                <link.icon className="h-7 w-7" />
              </span>
              <span className="mt-1 text-[10px] text-[#94A3B8]">{link.label}</span>
            </Link>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-1 transition ${
                isActive(link.href) ? 'text-[#22C55E]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {isActive(link.href) && (
                <span className="absolute -top-2 h-1 w-6 rounded-full bg-[#22C55E]" />
              )}
              <link.icon className="h-6 w-6" />
              <span className="text-[10px]">{link.label}</span>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
