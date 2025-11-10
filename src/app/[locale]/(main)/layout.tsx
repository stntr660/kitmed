import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { RFPCart } from '@/components/rfp/rfp-cart';
import type { Locale } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KITMED - Équipements Médicaux Premium | Solutions Hospitalières de Pointe',
  description: 'Découvrez la plus grande sélection d\'équipements médicaux de qualité premium au Maroc. Technologies de pointe, support expert 24/7, et solutions personnalisées pour hôpitaux, cliniques et laboratoires.',
  keywords: 'équipements médicaux, matériel médical, technologie hospitalière, appareils médicaux, Maroc, KITMED, solutions médicales premium',
  openGraph: {
    title: 'KITMED - Leader des Équipements Médicaux Premium au Maroc',
    description: 'Solutions médicales innovantes pour professionnels de santé. Plus de 2000 produits premium, 500+ installations, support 24/7.',
    images: ['/images/og-kitmed-home.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KITMED - Équipements Médicaux Premium',
    description: 'Technologies médicales de pointe pour transformer votre pratique. Solutions complètes et support expert.',
    images: ['/images/twitter-kitmed-home.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://kitmed.ma',
    languages: {
      'fr': 'https://kitmed.ma/fr',
      'en': 'https://kitmed.ma/en',
      'ar': 'https://kitmed.ma/ar',
    },
  },
};

interface MainLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function MainLayout({ children, params: { locale } }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale as Locale} />
      
      <main 
        id="main-content" 
        className="flex-1"
        role="main"
      >
        {children}
      </main>
      
      <Footer locale={locale as Locale} />
      
      {/* Global Components */}
      <RFPCart />
    </div>
  );
}