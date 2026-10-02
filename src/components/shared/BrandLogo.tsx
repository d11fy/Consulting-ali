import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogoIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${dimMap[size]} rounded-2xl bg-gradient-to-br from-[#12A37A] via-[#0E8A66] to-[#0B1A20] flex items-center justify-center p-2 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30 shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white"
      >
        {/* Outer Arch Gate */}
        <path
          d="M20 90 V50 C20 33.4315 33.4315 20 50 20 C66.5685 20 80 33.4315 80 50 V90"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Inner Arrow upward */}
        <path
          d="M50 82 V40 M50 40 L36 54 M50 40 L64 54"
          stroke="#3DDC97"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BrandLogo({ className = '', showText = true, size = 'md' }: BrandLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <BrandLogoIcon size={size} className="group-hover:scale-105 transition-transform duration-200" />
      {showText && (
        <div className="flex flex-col">
          <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>أ. علي هشام</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#12A37A]/15 text-[#3DDC97] border border-[#12A37A]/30 font-bold">
              استشارات دولية
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            استشارات ومعاملات دولية • غزة
          </p>
        </div>
      )}
    </Link>
  );
}
