'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingWhatsAppProps {
  whatsappNumber: string;
  defaultMessage: string;
}

export function FloatingWhatsApp({ whatsappNumber, defaultMessage }: FloatingWhatsAppProps) {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <aside aria-label="محادثة واتساب سريعة">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
        title="تواصل معنا عبر WhatsApp"
      >
        <span className="sr-only">تواصل معنا عبر واتساب</span>
        <MessageCircle className="w-7 h-7 fill-slate-950 text-slate-950 group-hover:rotate-12 transition-transform" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out text-xs font-bold mr-2 text-slate-950">
          تواصل معنا عبر واتساب
        </span>
      </a>
    </aside>
  );
}
