import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'أ. علي هشام — استشارات متخصصة في التعليم والهجرة والفرص الدولية',
  description: 'منصة استشارات متخصصة في القبولات الجامعية، المنح الدولية، مسارات الهجرة، لمّ الشمل، التأشيرات، والفرص الإنسانية. جلسات مباشرة مع خبراء معتمدين وخارطة طريق مخصصة.',
  keywords: [
    'استشارات تعليمية',
    'قبولات جامعية',
    'منح دراسية',
    'هجرة',
    'لم شمل',
    'تأشيرات سفر',
    'علي هشام',
    'مسارات غزة',
    'فرص دولية',
  ],
  authors: [{ name: 'أ. علي هشام' }],
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'أ. علي هشام — استشارات متخصصة في التعليم والهجرة والفرص الدولية',
    description: 'احجز استشارتك مع المستشار الأنسب لحالتك واحصل على توجيه دقيق وخارطة طريق واضحة.',
    url: '/',
    siteName: 'منصة استشارات أ. علي هشام',
    locale: 'ar_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أ. علي هشام — استشارات متخصصة في التعليم والهجرة والفرص الدولية',
    description: 'منصة استشارات متخصصة في التعليم العالي والهجرة والفرص الدولية.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#064e3b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
