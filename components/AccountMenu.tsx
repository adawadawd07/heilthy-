'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Settings as SettingsIcon } from 'lucide-react';
import { Locale, t } from '@/lib/translations';

export default function AccountMenu({
  displayName,
  username,
  locale = 'ar',
}: {
  displayName: string;
  username: string;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const initial = (displayName || username || '?').trim().charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('account', locale)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#16B981] text-sm font-extrabold text-white shadow transition active:scale-95"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0F172A] shadow-2xl shadow-black/50"
        >
          <div className="border-b border-[#1E293B] px-4 py-3">
            <p className="truncate text-sm font-bold text-[#F8FAFC]">{displayName}</p>
            <p dir="ltr" className="truncate text-start text-xs text-[#94A3B8]">
              @{username}
            </p>
          </div>

          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#1E293B]"
          >
            <SettingsIcon className="h-4 w-4 text-[#94A3B8]" />
            {t('settings', locale)}
          </Link>
        </div>
      )}
    </div>
  );
}
