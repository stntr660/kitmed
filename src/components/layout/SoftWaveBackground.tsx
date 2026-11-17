import { cn } from '@/lib/utils';

/**
 * Light-blue gradient with soft white/blue waves (owner mockup 2026-11-17), as used behind the
 * Partenaires hero and the Catalogues header. Place it as the first child of a `relative isolate
 * overflow-hidden` section: it fills the section behind its content (-z-10).
 * `fadeTo` is the colour of the last wave, i.e. the colour the next section should start with.
 */
export function SoftWaveBackground({
  fadeTo = '#F4F8FE',
  wavesClassName = 'h-[55%]',
  className,
}: {
  fadeTo?: string;
  /** Height of the wave band at the bottom of the section. */
  wavesClassName?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#F1F7FE] via-[#E6F0FC] to-[#D6E8FB]',
        className
      )}
    >
      <svg
        className={cn('absolute inset-x-0 bottom-0 w-full', wavesClassName)}
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <path d="M0 210 C 260 120 520 300 820 230 C 1080 170 1260 200 1440 150 L1440 400 L0 400 Z" fill="#ffffff" fillOpacity="0.35" />
        <path d="M0 290 C 300 210 560 360 900 300 C 1140 255 1300 300 1440 260 L1440 400 L0 400 Z" fill="#ffffff" fillOpacity="0.55" />
        <path d="M0 350 C 360 300 700 400 1040 350 C 1220 325 1340 345 1440 330 L1440 400 L0 400 Z" fill={fadeTo} />
      </svg>
    </div>
  );
}
