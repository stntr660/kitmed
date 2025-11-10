'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingBarProps {
  className?: string;
}

export function NavigationLoadingBar({ className }: LoadingBarProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (loading) {
      setProgress(10);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 10;
          }
          return prev;
        });
      }, 200);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 300);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [loading]);

  // Monitor route changes
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // Listen for Next.js router events
    const router = useRouter();
    
    // Add listeners for link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a, [role="link"]');
      if (link && link.getAttribute('href')?.startsWith('/')) {
        handleStart();
        // Auto-complete after 3 seconds if no navigation detected
        setTimeout(handleComplete, 3000);
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  if (progress === 0) {
    return null;
  }

  return (
    <div className={cn('fixed top-0 left-0 w-full h-1 z-50', className)}>
      <div
        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${Math.min(progress, 100)}%`,
          opacity: progress === 100 ? 0 : 1,
          boxShadow: progress > 0 && progress < 100 ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none'
        }}
      />
      {/* Pulse indicator */}
      {progress > 0 && progress < 100 && (
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-primary-400/50 to-transparent animate-pulse" />
      )}
    </div>
  );
}

interface PageLoadingProps {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function PageLoading({ 
  loading = true, 
  size = 'md', 
  text,
  className 
}: PageLoadingProps) {
  if (!loading) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8',
      className
    )}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-primary-200 border-t-primary-600',
        sizeClasses[size]
      )} />
      {text && (
        <p className={cn(
          'mt-3 text-gray-600 font-medium',
          textSizes[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

export function ButtonLoading({ 
  loading = false, 
  children, 
  className,
  ...props 
}: {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center',
        loading && 'cursor-not-allowed opacity-75',
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {children}
    </button>
  );
}

interface LinkLoadingProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LinkWithLoading({ href, children, className, onClick }: LinkLoadingProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (onClick) onClick();
      await router.push(href);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center transition-opacity',
        loading && 'opacity-75 cursor-wait',
        className
      )}
    >
      {loading && (
        <div className="mr-2 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
      )}
      {children}
    </a>
  );
}