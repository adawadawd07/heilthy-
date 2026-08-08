'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DayWatcher({
  logicalDate,
  timezone = 'Asia/Riyadh',
}: {
  logicalDate: string;
  timezone?: string;
}) {
  const router = useRouter();
  const currentDate = useRef(logicalDate);

  useEffect(() => {
    currentDate.current = logicalDate;
  }, [logicalDate]);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    function check() {
      const today = formatter.format(new Date());
      if (today !== currentDate.current) {
        currentDate.current = today;
        router.refresh();
      }
    }

    const interval = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [router, timezone]);

  return null;
}
