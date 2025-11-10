'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface NavigationLoaderProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
}

export function NavigationLoader({ children, href, className, onClick }: NavigationLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if this is the current active page
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Don't navigate if already on this page
    if (isActive) return;
    
    // Call external onClick if provided
    if (onClick) onClick();
    
    setIsLoading(true);
    
    try {
      // Use router.push for navigation
      await router.push(href);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset loading after a delay to ensure page transition is visible
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // Reset loading when pathname changes (successful navigation)
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'relative transition-all duration-200',
        isLoading && 'pointer-events-none',
        className
      )}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className=\"absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 flex items-center justify-end pr-4 rounded-2xl z-10\">
          <div className=\"flex items-center space-x-2 text-white/90\">
            <Loader2 className=\"h-4 w-4 animate-spin\" />
            <span className=\"text-xs font-medium\">Chargement...</span>
          </div>
        </div>
      )}
      
      {/* Content with loading state */}
      <div className={cn(
        'transition-opacity duration-200',
        isLoading && 'opacity-60'
      )}>
        {children}
      </div>
    </a>
  );
}

// Global page loading indicator
export function GlobalPageLoader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Reset when pathname changes
    setLoading(false);
    setProgress(0);
  }, [pathname]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (loading) {
      setProgress(10);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + Math.random() * 10;
          return prev;
        });
      }, 200);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading]);

  // Listen for navigation clicks
  useEffect(() => {
    const handleNavigation = () => {
      setLoading(true);
    };

    // Listen for all link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"]');
      
      if (link && !link.getAttribute('href')?.includes('#')) {
        const href = link.getAttribute('href');
        if (href && href !== pathname && !href.startsWith('http')) {
          handleNavigation();
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!loading || progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-gray-200/50">
      <div
        className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${Math.min(progress, 100)}%`,
          opacity: progress === 100 ? 0 : 1,
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.6), 0 0 20px rgba(37, 99, 235, 0.3)'
        }}
      />
      {progress > 0 && progress < 100 && (
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-primary-300/60 to-transparent animate-pulse" />
      )}
    </div>
  );
}