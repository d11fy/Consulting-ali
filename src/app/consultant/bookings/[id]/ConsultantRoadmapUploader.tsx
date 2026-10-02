'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Send,
} from 'lucide-react';

interface ConsultantRoadmapUploaderProps {
  bookingId: string;
  roadmap: any;
  customerEmail: string;
  customerName: string;
}

export function ConsultantRoadmapUploader({
  bookingId,
  roadmap,
  customerEmail,
  customerName,
}: ConsultantRoadmapUploaderProps) {
  const router = useRouter();

  const [roadmapFile, setRoadmapFile] = useState<File | null>(null);
  const [summary, setSummary] = useState(roadmap?.summary || '');
  const [analysis, setAnalysis] = useState(roadmap?.analysis || '');
  const [nextSteps, setNextSteps] = useState(roadmap?.nextSteps || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmapFile && !roadmap?.roadmapDocument) {
      setError('يرجى تحديد ملف وثيقة خارطة الطريق (PDF)');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    if (roadmapFile) {
      formData.append('file', roadmapFile);
    }
    formData.append('bookingId', bookingId);
    formData.append('summary', summary);
    formData.append('analysis', analysis);
    formData.append('nextSteps', nextSteps);

    try {
      const res = await fetch('/api/consultant/roadmap', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('تم حفظ ورفع وثيقة خارطة الطريق بنجاح، وإرسال رابط التنزيل للعميل.');
        setTimeout(() => router.refresh(), 1500);
      } else {
        setError(data.error || 'فشل رفع الوثيقة');
      }
    } catch {
      setError('حدث خطأ أثناء رفع الوثيقة');
    } finally {
      setUploading(false);
    }
  };

  const isDelivered = roadmap?.status === 'delivered' || roadmap?.status === 'roadmap_ready';

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>مسار خدمة الـ $200: إعداد وثيقة خارطة الطريق (Roadmap)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            إعداد وثيقة <strong>Personal Case Study & Roadmap</strong> المخصصة وتنزيلها للعميل.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isDelivered
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
        >
          {isDelivered ? 'تم تسليم الملف للعميل' : 'بانتظار إعداد ورفع الوثيقة'}
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Checklist */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
        <div className="font-bold text-slate-300 mb-2">قائمة تدقيق المستشار للخدمة الشاملة:</div>
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>1. مراجعة وثائق وبيانات العميل قبل الجلسة</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>2. إتمام الجلسة الاستشارية المباشرة (60 دقيقة عبر Google Meet)</span>
        </div>
        <div className={`flex items-center gap-2 ${isDelivered ? 'text-emerald-400' : 'text-amber-400 font-semibold'}`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>3. صياغة وثيقة Case Study & Roadmap المخصصة ورفعها هنا</span>
        </div>
      </div>

      {/* Uploader Form */}
      <form onSubmit={handleUpload} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            ملخص وتشخيص الحالة
          </label>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="ملخص موجز لظروف المتقدم الحالية ومؤهلاته..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            تحليل الخيارات والفرص المناسبة
          </label>
          <textarea
            rows={2}
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            placeholder="البرامج الأكاديمية أو مسارات الهجرة الأنسب ونقاط القوة والضعف..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            الخطوات القادمة وأولويات التنفيذ
          </label>
          <textarea
            rows={2}
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            placeholder="الخطوات العملية مرتبة بالجدول الزمني..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            وثيقة الـ PDF الكاملة (Personal Case Study & Roadmap) *
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setRoadmapFile(e.target.files?.[0] || null)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري حفظ وتسليم الوثيقة وإشعار العميل...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>تسليم ملف خارطة الطريق وإشعار العميل</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
