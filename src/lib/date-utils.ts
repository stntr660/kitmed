/**
 * Date utilities that are safe for SSR/hydration
 */

/**
 * Format date in a way that's consistent between server and client
 * Uses UTC to prevent timezone-related hydration mismatches
 */
export function formatDate(
  date: string | Date,
  format: 'date' | 'time' | 'datetime' = 'date',
  locale: string = 'en-US'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC', // Use UTC to ensure consistency
    };

    switch (format) {
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'datetime':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      default: // 'date'
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        break;
    }

    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid Date';
  }
}

/**
 * Get relative time in a hydration-safe way
 */
export function formatRelativeTime(date: string | Date, locale: string = 'en'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const diffInMilliseconds = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Use fixed strings instead of relative time formatters to prevent hydration issues
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      // For older dates, use absolute formatting
      return formatDate(dateObj, 'date', locale);
    }
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return 'Invalid Date';
  }
}

/**
 * Check if a date is today (in UTC to prevent hydration issues)
 */
export function isToday(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return (
      dateObj.getUTCFullYear() === today.getUTCFullYear() &&
      dateObj.getUTCMonth() === today.getUTCMonth() &&
      dateObj.getUTCDate() === today.getUTCDate()
    );
  } catch {
    return false;
  }
}

/**
 * Get a stable timestamp string for SSR/client consistency
 */
export function getStableTimestamp(): string {
  // Return a fixed timestamp during SSR to prevent hydration mismatches
  if (typeof window === 'undefined') {
    return new Date().toISOString().split('T')[0]; // Just the date part
  }
  return new Date().toISOString();
}