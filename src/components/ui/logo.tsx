import Image from 'next/image';
import { cn } from '@/lib/utils';

export type LogoVariant = 'original' | 'black' | 'white';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

const logoSizes = {
  sm: { width: 160, height: 64 },
  md: { width: 440, height: 176 },
  lg: { width: 600, height: 240 },
  xl: { width: 760, height: 304 },
};

const logoFiles = {
  original: '/images/logos/kitmed-logo-original.png',
  black: '/images/logos/kitmed-logo-black.png',
  white: '/images/logos/kitmed-logo-white.png',
};

export function Logo({
  variant = 'original',
  size = 'md',
  className,
  priority = false
}: LogoProps) {
  const dimensions = logoSizes[size];
  const src = logoFiles[variant];

  return (
    <div className={cn('flex items-center py-2', className)}>
      <Image
        src={src}
        alt="KITMED - Medical Equipment Platform"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className="h-auto w-auto object-contain"
        style={{ maxHeight: '48px' }}
      />
    </div>
  );
}

// Specialized logo components for common use cases
export function HeaderLogo({ className }: { className?: string }) {
  return (
    <Logo
      variant="original"
      size="md"
      priority
      className={cn('cursor-pointer', className)}
    />
  );
}

export function FooterLogo({ className }: { className?: string }) {
  return (
    <Logo
      variant="original"
      size="sm"
      className={className}
    />
  );
}

export function AdminLogo({ className }: { className?: string }) {
  return (
    <Logo
      variant="original"
      size="md"
      className={className}
    />
  );
}

export function LoginLogo({ className }: { className?: string }) {
  return (
    <Logo
      variant="original"
      size="lg"
      className={cn('mx-auto', className)}
    />
  );
}