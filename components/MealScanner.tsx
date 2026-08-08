'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Locale, t } from '@/lib/translations';
import { apiFetch } from '@/lib/api-client';
import { compressImage } from '@/lib/image';
import { Loader2, PenLine, Sparkles, Upload, TriangleAlert } from 'lucide-react';

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export default function MealScanner({
  aiConfigured,
  locale = 'ar',
}: {
  aiConfigured: boolean;
  locale?: Locale;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_FILE_BYTES) {
      setError('حجم الصورة كبير جداً (الحد 15 ميجا)');
      return;
    }

    setError('');
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      // Downscaling keeps the upload small and the vision model fast without hurting recognition.
      const base64 = await compressImage(file);
      const res = await apiFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || t('aiAnalysisFailed', locale));
        setLoading(false);
        return;
      }

      sessionStorage.setItem('nutri-analysis', JSON.stringify(data));
      router.push('/confirm');
    } catch {
      setError(t('aiAnalysisFailed', locale));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {!aiConfigured && (
        <p className="flex items-start gap-2 rounded-2xl border border-yellow-800/60 bg-yellow-950/20 p-3.5 text-xs leading-relaxed text-yellow-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            التحليل بالصورة يعمل حالياً بوضع تجريبي ويرجّع نتيجة ثابتة. لتفعيله فعلياً أضف{' '}
            <code dir="ltr" className="rounded bg-black/30 px-1">
              AI_PROVIDER=openai
            </code>{' '}
            و{' '}
            <code dir="ltr" className="rounded bg-black/30 px-1">
              AI_API_KEY
            </code>{' '}
            في متغيرات البيئة. تقدر تستخدم الإضافة اليدوية بدقة كاملة.
          </span>
        </p>
      )}

      <div className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
        <label className="relative flex h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#1E293B] transition hover:border-[#16B981]">
          {preview ? (
            <Image
              src={preview}
              alt="preview"
              fill
              unoptimized
              className="rounded-xl object-contain p-2"
              sizes="100vw"
            />
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16B981]/15">
                <Upload className="h-6 w-6 text-[#22C55E]" />
              </span>
              <span className="text-sm font-bold text-[#F8FAFC]">{t('uploadImage', locale)}</span>
              <span className="text-xs text-[#94A3B8]">JPG · PNG · HEIC</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>

        <button
          onClick={analyze}
          disabled={!file || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16B981] py-3.5 font-bold text-white transition hover:bg-[#059669] disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? t('analyzing', locale) : t('analyzeImage', locale)}
        </button>

        <Link
          href="/manual"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#1E293B] py-3.5 font-bold text-[#F8FAFC] transition hover:bg-[#1E293B]"
        >
          <PenLine className="h-4 w-4" />
          {t('addManual', locale)}
        </Link>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-800/60 bg-red-950/40 px-3 py-2.5 text-sm font-bold text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      <p className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 text-xs leading-relaxed text-[#94A3B8]">
        {t('estimateDisclaimer', locale)}
      </p>
    </div>
  );
}
