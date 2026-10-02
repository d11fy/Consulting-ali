'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

interface ReviewFormClientProps {
  bookingId: string;
  bookingRef: string;
  serviceName: string;
  consultantName: string;
  customerName: string;
  existingReview: any;
}

export function ReviewFormClient({
  bookingId,
  bookingRef,
  serviceName,
  consultantName,
  customerName,
  existingReview,
}: ReviewFormClientProps) {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(!!existingReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'فشل إرسال التقييم');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">شكرًا جزيلاً لك على تقييمك!</h2>
        <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
          رأيك وملاحظاتك تساعدنا كثيرًا على تحسين وتطوير تجربة الاستشارات لكافة المتقدمين.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <span>العودة للصفحة الرئيسية</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">تقييم جلستك الاستشارية</h1>
        <p className="text-xs text-slate-400">
          استشارة: {serviceName} مع {consultantName}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Star Rating */}
        <div className="text-center space-y-2">
          <label className="block text-slate-300 font-semibold">
            ما هو تقييمك العام للتجربة والفائدة التي حصلت عليها؟
          </label>
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-125 transition-transform"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-slate-300 font-semibold mb-2">
            ملاحظاتك وانطباعك عن الجلسة (اختياري)
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="اكتب انطباعك، هل كانت الإجابات واضحة؟ ما الذي ميز الاستشارة؟"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري إرسال التقييم...</span>
            </>
          ) : (
            <span>إرسال التقييم</span>
          )}
        </button>
      </form>
    </div>
  );
}
