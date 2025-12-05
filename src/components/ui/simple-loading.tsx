'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SimplePageLoader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
    setProgress(0);
  }, [pathname]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (loading) {
      setProgress(20);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + Math.random() * 15;
          return prev;
        });
      }, 200);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"]');

      if (link && !link.getAttribute('href')?.includes('#')) {
        const href = link.getAttribute('href');
        if (href && href !== pathname && !href.startsWith('http')) {
          setLoading(true);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!loading || progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50 bg-gray-200/30">
      <div
        className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 transition-all duration-300 ease-out"
        style={{
          width: `${Math.min(progress, 100)}%`,
          opacity: progress === 100 ? 0 : 1,
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)'
        }}
      />
      {progress > 0 && progress < 100 && (
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-primary-300/50 to-transparent animate-pulse" />
      )}
    </div>
  );
}