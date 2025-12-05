'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function MaintenancePage() {
  const router = useRouter();
  const [dots, setDots] = useState('');

  // Animation des points
  useEffect(() => {
    const timer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 800);

    return () => clearInterval(timer);
  }, []);

  const phrases = [
    "Nous créons quelque chose d'extraordinaire",
    "Une nouvelle plateforme médicale naît",
    "L'innovation prend forme dans l'ombre",
    "Notre site se métamorphose",
    "Bientôt, l'impossible deviendra possible"
  ];

  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhrase(prev => (prev + 1) % phrases.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-16">
        {/* Logo avec mystère */}
        <div className="opacity-90 flex justify-center">
          <Logo variant="white" size="xl" className="filter drop-shadow-2xl" />
        </div>

        {/* Message principal mystérieux */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-thin text-white/90 tracking-wider">
              Bientôt<span className="text-primary-300">{dots}</span>
            </h1>

            <div className="h-20 flex items-center justify-center">
              <p className="text-2xl lg:text-3xl text-slate-300/80 font-light italic transition-all duration-1000 ease-in-out">
                "{phrases[currentPhrase]}"
              </p>
            </div>
          </div>

        </div>

        {/* Bouton de retour discret */}
        <div className="pt-8">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400/60 hover:text-white/80 transition-all duration-500"
            asChild
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}