import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Compass,
  Users,
  Plane,
  FileCheck,
  Globe,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface SpecialtyItem {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  icon?: string | null;
}

interface SpecialtiesSectionProps {
  specialties: SpecialtyItem[];
}

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-6 h-6 text-emerald-400" />,
  Compass: <Compass className="w-6 h-6 text-teal-400" />,
  Users: <Users className="w-6 h-6 text-cyan-400" />,
  Plane: <Plane className="w-6 h-6 text-blue-400" />,
  FileCheck: <FileCheck className="w-6 h-6 text-amber-400" />,
  Globe: <Globe className="w-6 h-6 text-emerald-400" />,
};

export function SpecialtiesSection({ specialties }: SpecialtiesSectionProps) {
  return (
    <section id="specialties" className="py-20 lg:py-28 relative bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مجالات وتخصصات الاستشارة</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            تغطية شاملة لأهم المسارات الدولية
          </h2>
          <p className="text-slate-400 text-base">
            اختر المجال الذي يناسب سؤالك أو حالتك، وسيقوم مستشارونا بمساعدتك في فحص الشروط وتجهيز المتطلبات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((item) => (
            <div
              key={item.id}
              className="glass-panel glass-panel-hover rounded-3xl p-7 flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all shadow-md">
                  {item.icon && iconMap[item.icon] ? (
                    iconMap[item.icon]
                  ) : (
                    <Compass className="w-6 h-6 text-emerald-400" />
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 group-hover:text-emerald-300 transition-colors">
                  {item.nameAr}
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  href={`/book?specialty=${item.slug}`}
                  className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                >
                  <span>احجز في هذا المجال</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <span className="text-[11px] text-slate-500 font-mono">
                  {item.nameEn}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
