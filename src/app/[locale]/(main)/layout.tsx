import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { RFPCart } from '@/components/rfp/rfp-cart';
import type { Locale } from '@/types';

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