'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Check,
  Globe2,
  Trash2,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Specialty {
  id: string;
  slug: string;
  nameAr: string;
}

interface Service {
  id: string;
  slug: string;
  nameAr: string;
  descriptionAr: string;
  durationMinutes: number;
  price: number;
  currency: string;
  isComprehensive: boolean;
}

interface Consultant {
  id: string;
  slug?: string | null;
  name: string;
  title: string;
  initials?: string | null;
  shortBio?: string | null;
  bio: string;
  avatarUrl?: string | null;
  yearsOfExperience: number;
  tags?: string[];
  specialties: string[];
}

interface BookingWizardProps {
  specialties: Specialty[];
  services: Service[];
  consultants: Consultant[];
}

interface UploadedDoc {
  id: string;
  originalName: string;
  sizeBytes: number;
}

const COMMON_TIMEZONES = [
  { label: 'فلسطين / القدس / غزة (GMT+3)', value: 'Asia/Gaza' },
  { label: 'مكة المكرمة / الرياض (GMT+3)', value: 'Asia/Riyadh' },
  { label: 'القاهرة (GMT+3)', value: 'Africa/Cairo' },
  { label: 'دبي / أبوظبي (GMT+4)', value: 'Asia/Dubai' },
  { label: 'إسطنبول (GMT+3)', value: 'Europe/Istanbul' },
  { label: 'برلين / غرب أوروبا (GMT+2)', value: 'Europe/Berlin' },
  { label: 'لندن (GMT+1)', value: 'Europe/London' },
  { label: 'نيويورك / واشنطن (GMT-4)', value: 'America/New_York' },
];

export function BookingWizard({ specialties, services, consultants }: BookingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial params
  const defaultServiceSlug = searchParams.get('service') || 'specialized-30';
  const defaultSpecialtySlug = searchParams.get('specialty') || '';
  const paramConsultant = searchParams.get('consultantId') || searchParams.get('consultantSlug') || searchParams.get('consultant') || '';
  const defaultAutoAssign = searchParams.get('autoAssign') === 'true';

  // Find matching consultant by id or slug
  const matchedConsultant = consultants.find((c) => c.id === paramConsultant || c.slug === paramConsultant);
  const initialConsultantId = matchedConsultant ? matchedConsultant.id : (consultants[0]?.id || '');
  const initialAutoAssign = defaultAutoAssign ? true : !matchedConsultant;

  // Step state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.find((s) => s.slug === defaultServiceSlug)?.id || services[0]?.id || ''
  );
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(
    specialties.find((s) => s.slug === defaultSpecialtySlug)?.id || specialties[0]?.id || ''
  );
  const [isAutoAssign, setIsAutoAssign] = useState<boolean>(initialAutoAssign);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>(initialConsultantId);

  // Schedule selection
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Gaza');
  const [availableSlots, setAvailableSlots] = useState<{ startTimeUtc: string; localStartTime: string; localEndTime: string }[]>([]);
  const [selectedSlotUtc, setSelectedSlotUtc] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Customer info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [country, setCountry] = useState('فلسطين');
  const [age, setAge] = useState<number | ''>('');
  const [caseDescription, setCaseDescription] = useState('');
  const [primaryQuestion, setPrimaryQuestion] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Files
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch slots whenever consultant/service/date/timezone changes
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedServiceId || !selectedDate) return;
      setLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlotUtc('');

      try {
        const query = new URLSearchParams({
          serviceId: selectedServiceId,
          date: selectedDate,
          timezone: selectedTimezone,
        });

        if (!isAutoAssign && selectedConsultantId) {
          query.set('consultantId', selectedConsultantId);
        } else {
          query.set('isAutoAssign', 'true');
        }

        const res = await fetch(`/api/bookings/available-slots?${query.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setAvailableSlots(data.slots || []);
        } else {
          setSlotsError(data.error || 'تعذر تحميل المواعيد');
          setAvailableSlots([]);
        }
      } catch {
        setSlotsError('حدث خطأ في جلب المواعيد المتاحة');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    if (currentStep === 3) {
      fetchSlots();
    }
  }, [currentStep, selectedServiceId, selectedDate, selectedTimezone, isAutoAssign, selectedConsultantId]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('category', 'academic');

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadedDocs((prev) => [...prev, data.document]);
      } else {
        setUploadError(data.error || 'فشل رفع الملف');
      }
    } catch {
      setUploadError('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const removeDoc = (id: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Submit Final Booking
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        serviceId: selectedServiceId,
        consultantId: isAutoAssign ? null : selectedConsultantId,
        isAutoAssign,
        slotStartTime: selectedSlotUtc,
        customerTimezone: selectedTimezone,
        fullName,
        email,
        whatsappPhone,
        country,
        age: age ? Number(age) : null,
        caseDescription,
        primaryQuestion,
        desiredOutcome,
        additionalNotes: additionalNotes || null,
        documentIds: uploadedDocs.map((d) => d.id),
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(data.redirectUrl);
      } else {
        setSubmitError(data.error || 'فشل إنشاء الحجز، يرجى المحاولة مرة أخرى.');
        setSubmitting(false);
      }
    } catch {
      setSubmitError('حدث خطأ في الاتصال بالخادم.');
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedConsultant = consultants.find((c) => c.id === selectedConsultantId);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Progress header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { num: 1, title: 'الخدمة والمجال' },
            { num: 2, title: 'المستشار' },
            { num: 3, title: 'الموعد' },
            { num: 4, title: 'بيانات الحالة' },
            { num: 5, title: 'الملفات والتأكيد' },
          ].map((st) => (
            <div
              key={st.num}
              className={`flex items-center gap-2 shrink-0 ${
                currentStep >= st.num ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === st.num
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md'
                    : currentStep > st.num
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentStep > st.num ? <Check className="w-4 h-4" /> : st.num}
              </div>
              <span className="text-xs sm:text-sm font-semibold hidden md:inline">
                {st.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Consultant Banner Indicator */}
      {!isAutoAssign && selectedConsultant && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-bold flex items-center justify-center text-lg shadow-md shrink-0">
              {selectedConsultant.initials || selectedConsultant.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
            </div>
            <div>
              <div className="text-slate-400 text-xs font-semibold">أنت تحجز الآن حصريًا مع المستشار:</div>
              <div className="text-white font-extrabold text-base flex items-center gap-2 mt-0.5">
                <span>{selectedConsultant.name}</span>
                <span className="text-emerald-400 font-medium text-xs">({selectedConsultant.title})</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold shrink-0 transition-colors"
          >
            تغيير المستشار
          </button>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
          <span>{submitError}</span>
        </div>
      )}

      {/* STEP 1: Service & Specialty */}
      {currentStep === 1 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              الخطوة 1: اختر نوع الاستشارة ومجالها
            </h2>
            <p className="text-slate-400 text-sm">
              اختر المدة المناسبة لحالتك مع المجال الأكاديمي أو الإجرائي المعني.
            </p>
          </div>

          {/* Service Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-3">
              نوع الاستشارة
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {services.map((s) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`rounded-2xl p-6 cursor-pointer border transition-all duration-200 relative ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-bold text-white">
                        {s.nameAr}
                      </span>
                      <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {s.durationMinutes} دقيقة
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white mb-2">
                      ${s.price}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {s.descriptionAr}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specialty Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              مجال الحالة
            </label>
            <select
              value={selectedSpecialtyId}
              onChange={(e) => setSelectedSpecialtyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {specialties.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <span>المتابعة لاختيار المستشار</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Consultant Selection */}
      {currentStep === 2 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              الخطوة 2: اختيار المستشار
            </h2>
            <p className="text-slate-400 text-sm">
              اختر مستشارًا معينًا أو دع المنصة ترشح لك المستشار الأكثر خبرة بحالتك.
            </p>
          </div>

          {/* Auto Assign Card */}
          <div
            onClick={() => {
              setIsAutoAssign(true);
              setSelectedConsultantId('');
            }}
            className={`p-6 rounded-2xl border cursor-pointer transition-all ${
              isAutoAssign
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    اختاروا لي المستشار الأنسب (موصى به)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    توجيه ذكي
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  سيقوم فريق المنصة بدراسة بلد حالتك وتعيين المستشار الأكثر خبرة وتخصصًا بها.
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                  isAutoAssign
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                    : 'border-slate-700'
                }`}
              >
                {isAutoAssign && <Check className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* Consultants List */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-3">
              أو اختر مستشارًا محددًا من الفريق:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {consultants.map((c) => {
                const isSelected = !isAutoAssign && selectedConsultantId === c.id;
                const displayInitials = c.initials || c.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
                const displayBio = c.shortBio || c.bio;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setIsAutoAssign(false);
                      setSelectedConsultantId(c.id);
                    }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-emerald-500/30 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                          {displayInitials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{c.name}</div>
                        <div className="text-[11px] text-emerald-400 line-clamp-1">{c.title}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                      {displayBio}
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium">
                      {c.yearsOfExperience > 2 ? `+${c.yearsOfExperience} سنوات خبرة` : `${c.yearsOfExperience} سنوات خبرة`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <span>المتابعة لاختيار الموعد</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Date & Time Slot Selection */}
      {currentStep === 3 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              الخطوة 3: تحديد التاريخ والوقت
            </h2>
            <p className="text-slate-400 text-sm">
              يتم عرض الأوقات المتاحة الحقيقية حسب منطقتك الزمنية لمنع أي تعارض.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                تاريخ الاستشارة
              </label>
              <input
                type="date"
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Timezone selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>المنطقة الزمنية</span>
              </label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>الأوقات المتاحة في هذا اليوم ({selectedDate})</span>
              <span className="text-[11px] text-slate-400">مدة الجلسة: {selectedService?.durationMinutes} دقيقة</span>
            </label>

            {loadingSlots ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs">جاري فحص جدول المواعيد وتفادي التعارض...</span>
              </div>
            ) : slotsError ? (
              <div className="p-6 text-center text-red-300 bg-red-950/40 border border-red-500/30 rounded-2xl text-xs">
                {slotsError}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs">
                لا توجد أوقات متاح حجزها في هذا التاريخ (قد يكون إجازة أو محجوز بالكامل). يرجى اختيار يوم آخر.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableSlots.map((slot, idx) => {
                  const isSelected = selectedSlotUtc === slot.startTimeUtc;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlotUtc(slot.startTimeUtc)}
                      className={`py-3 px-2 rounded-xl text-center text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-105'
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 mx-auto mb-1 opacity-70" />
                      <div>{slot.localStartTime}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={!selectedSlotUtc}
              onClick={() => setCurrentStep(4)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>المتابعة لبيانات الحالة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Customer Details & Case Info */}
      {currentStep === 4 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              الخطوة 4: بيانات العميل وتفاصيل الحالة
            </h2>
            <p className="text-slate-400 text-sm">
              معلوماتك سرية ومحمية تمامًا وتستخدم فقط لدراسة حالتك من قبل المستشار.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                الاسم الكامل *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أحمد محمد"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                البريد الإلكتروني (لتأكيد الموعد ورابط Meet) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 dir-ltr text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                رقم WhatsApp (مع مفتاح الدولة) *
              </label>
              <input
                type="text"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+970 59..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 dir-ltr text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                الدولة الحالية أو بلد الإقامة *
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="فلسطين، مصر، تركيا، ألمانيا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              وصف موجز لحالتك وظروفها *
            </label>
            <textarea
              rows={3}
              required
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              placeholder="مثال: خريج بكالوريوس هندسة بمعدل 84% أرغب بإكمال ماجستير في ألمانيا وأريد معرفة متطلبات الحساب المغلق واللغة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                السؤال الرئيسي أو العقبة التي تواجهك *
              </label>
              <input
                type="text"
                required
                value={primaryQuestion}
                onChange={(e) => setPrimaryQuestion(e.target.value)}
                placeholder="مثال: هل ملفي مؤهل للتقديم على منحة DAAD؟"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                النتيجة أو الهدف الذي تريد الوصول إليه *
              </label>
              <input
                type="text"
                required
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                placeholder="مثال: خطة تقديم واضحة وجدول زمني للعام القادم"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={!fullName || !email || !whatsappPhone || !caseDescription || !primaryQuestion}
              onClick={() => setCurrentStep(5)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>المتابعة لرفع الملفات والتأكيد</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Document Upload & Final Confirmation */}
      {currentStep === 5 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              الخطوة 5: رفع الوثائق وتثبيت الحجز
            </h2>
            <p className="text-slate-400 text-sm">
              رفع الوثائق اختياري ولكنه يُثري الاستشارة ويمنح المستشار رؤية دقيقة لملفك قبل اللقاء.
            </p>
          </div>

          {/* Upload Box */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors text-center relative">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingFile}
            />
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400">
                {uploadingFile ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {uploadingFile ? 'جاري رفع الملف وحفظه بأمان...' : 'انقر هنا لرفع جواز سفر، شهادة، كشف درجات أو سيرة ذاتية'}
              </div>
              <div className="text-xs text-slate-500">
                يدعم PDF, JPG, PNG, DOCX حتى 15 ميغابايت لكل ملف (تخزين مشفر ومحمي)
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/30">
              {uploadError}
            </div>
          )}

          {/* Uploaded Files list */}
          {uploadedDocs.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                الملفات المرفقة ({uploadedDocs.length}):
              </label>
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{doc.originalName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="p-1 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Booking Summary Box */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
              ملخص الحجز
            </h4>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">الخدمة:</span>
              <span className="font-semibold text-white">{selectedService?.nameAr}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">المستشار:</span>
              <span className="font-semibold text-emerald-400">
                {isAutoAssign ? 'تعيين تلقائي (المستشار الأنسب)' : selectedConsultant?.name}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">التاريخ والوقت:</span>
              <span className="font-semibold text-white font-mono dir-ltr">
                {selectedDate} ({COMMON_TIMEZONES.find((t) => t.value === selectedTimezone)?.label.split(' ')[0]})
              </span>
            </div>
            <div className="flex justify-between py-1 text-sm border-t border-slate-800 pt-3">
              <span className="font-bold text-white">المبلغ الإجمالي للدفع:</span>
              <span className="font-black text-emerald-400 text-base">
                ${selectedService?.price} USD
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <p className="leading-relaxed">
              عند الضغط على تثبيت الحجز، سيتم حجز وتجميد هذا الموعد باسمك لمدة ساعتين لإتاحة الوقت الكافي للتحويل البنكي ورفع إشعار الدفع عبر الصفحة التالية.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري حجز الموعد وتأكيده...</span>
                </>
              ) : (
                <>
                  <span>تثبيت الموعد والانتقال للدفع</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
