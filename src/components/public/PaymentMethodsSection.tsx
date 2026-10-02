import React from 'react';
import { CreditCard, Landmark, Smartphone, Coins, MapPin, Globe, CheckCircle2 } from 'lucide-react';

interface PaymentMethodItem {
  id: string;
  code: string;
  nameAr: string;
  instructionsAr: string;
}

interface PaymentMethodsSectionProps {
  paymentMethods: PaymentMethodItem[];
}

const methodIcons: Record<string, React.ReactNode> = {
  bop: <Landmark className="w-5 h-5 text-emerald-400" />,
  aib: <Landmark className="w-5 h-5 text-teal-400" />,
  palpay: <Smartphone className="w-5 h-5 text-blue-400" />,
  jawwal_pay: <Smartphone className="w-5 h-5 text-cyan-400" />,
  crypto: <Coins className="w-5 h-5 text-amber-400" />,
  cash_gaza: <MapPin className="w-5 h-5 text-emerald-400" />,
  international: <Globe className="w-5 h-5 text-purple-400" />,
};

export function PaymentMethodsSection({ paymentMethods }: PaymentMethodsSectionProps) {
  return (
    <section className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <CreditCard className="w-3.5 h-3.5" />
            <span>طرق الدفع والتحويل المتاحة</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            وسائل دفع مرنة ومتاحة محليًا ودوليًا
          </h2>
          <p className="text-slate-400 text-base">
            لتسهيل الأمر على جميع عملائنا في غزة والضفة والشتات والدول العربية، نوفر وسائل دفع يدوية متعددة وموثوقة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-start gap-4 hover:border-emerald-500/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                {methodIcons[pm.code] || <CreditCard className="w-5 h-5 text-emerald-400" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {pm.nameAr}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {pm.instructionsAr}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Advisory footnote */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-2xl mx-auto text-xs text-slate-400 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>يتم إرفاق إشعار التحويل بعد اختيار الموعد، وتأكيد الحجز يتم فور مراجعة الإدارة للوصل.</span>
        </div>
      </div>
    </section>
  );
}
