'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleMapEmbedProps {
  variant?: 'compact' | 'medium' | 'full';
  showDirectionsButton?: boolean;
  className?: string;
}

const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/yitDE6uwadQe6jWz9';
const EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.9!2d-7.6202967!3d33.5757043!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda7d2a5ceb4c25b%3A0xc8bd242104d6f954!2sKit%20Med!5e0!3m2!1sen!2sma!4v1704067200000!5m2!1sen!2sma';

const variantStyles = {
  compact: {
    height: 'h-[150px]',
    containerClass: '',
  },
  medium: {
    height: 'h-[300px]',
    containerClass: '',
  },
  full: {
    height: 'h-[300px] md:h-[400px]',
    containerClass: '',
  },
};

export function GoogleMapEmbed({
  variant = 'full',
  showDirectionsButton = true,
  className,
}: GoogleMapEmbedProps) {
  const t = useTranslations('common');

  const styles = variantStyles[variant];

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm',
          styles.height
        )}
      >
        <iframe
          src={EMBED_URL}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="KITMED Location"
          className="absolute inset-0"
        />
      </div>

      {showDirectionsButton && (
        <div className={cn('mt-4', variant === 'compact' ? 'mt-2' : 'mt-4')}>
          <Button
            variant={variant === 'compact' ? 'link' : 'outline'}
            size={variant === 'compact' ? 'sm' : 'default'}
            asChild
            className={variant === 'compact' ? 'p-0 h-auto text-xs' : ''}
          >
            <a
              href={GOOGLE_MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('map.getDirections')}
              <ExternalLink className={cn('ml-2', variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4')} />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact clickable map for footer
export function GoogleMapCompact({ className }: { className?: string }) {
  const t = useTranslations('common');

  return (
    <div className={cn('w-full', className)}>
      <a
        href={GOOGLE_MAPS_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full h-[120px] rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
      >
        <iframe
          src={EMBED_URL}
          width="100%"
          height="100%"
          style={{ border: 0, pointerEvents: 'none' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="KITMED Location"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
            {t('map.viewOnMaps')}
          </span>
        </div>
      </a>
    </div>
  );
}
