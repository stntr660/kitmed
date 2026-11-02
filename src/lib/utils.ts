import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// A brochure link can be the maker's product page instead of a PDF
// (the Hylo range points at hylo.ma): it opens, it doesn't download.
export function isWebPageLink(url: string | null | undefined): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  return !/\.pdf($|[?#])/i.test(url);
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined, format: 'short' | 'long' | 'time' = 'short'): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(d.getTime())) return 'Invalid Date';

  // Use UTC formatting to prevent hydration mismatches between server and client
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC'
  };

  switch (format) {
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'time':
      options.month = 'short';
      options.day = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    default:
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
  }

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

export function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}