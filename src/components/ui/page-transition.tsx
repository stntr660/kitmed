'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Reset loading state when pathname changes (page successfully loaded)
    setIsLoading(false);
    setProgress(0);
  }, [pathname]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isLoading) {
      setProgress(10);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 15;
          }
          return prev;
        });
      }, 150);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isLoading]);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = () => {
      setIsLoading(true);
      setProgress(10);
    };

    // Listen for clicks on navigation links
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"]');
      
      if (link && !link.getAttribute('href')?.includes('#')) {
        const href = link.getAttribute('href');
        if (href && href !== pathname) {
          handleNavigation();
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [pathname]);

  return (
    <div className="relative">
      {/* Page Loading Overlay */}
      {isLoading && (
        <>
          {/* Top progress bar */}
          <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(progress, 100)}%`,
                boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)'
              }}
            />
          </div>

          {/* Main content overlay */}
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Chargement en cours...
                </h3>
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.min(progress, 100)}%`
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {progress < 30 ? 'Initialisation...' : 
                   progress < 60 ? 'Chargement des données...' :
                   progress < 90 ? 'Finalisation...' : 'Presque terminé...'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Page Content */}
      <div className={cn(
        'transition-opacity duration-200',
        isLoading && 'opacity-50'
      )}>
        {children}
      </div>
    </div>
  );
}

// Hook for programmatic navigation with loading
export function useNavigationWithLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const navigate = (href: string) => {
    setIsLoading(true);
    
    startTransition(() => {
      router.push(href);
      // Auto-reset loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    });
  };

  return {
    navigate,
    isLoading: isLoading || isPending
  };
}