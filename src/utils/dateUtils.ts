import { format, parseISO, isValid, parse } from 'date-fns';

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';

  // Try parsing different date formats
  let date: Date | null = null;

  // Try ISO format
  try {
    date = parseISO(dateStr);
    if (isValid(date)) {
      return format(date, 'MMM d, yyyy');
    }
  } catch {
    // Continue to other formats
  }

  // Try "January 9th 2026, 2:00:28 pm" format
  try {
    const cleanDate = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
    date = parse(cleanDate, 'MMMM d yyyy, h:mm:ss a', new Date());
    if (isValid(date)) {
      return format(date, 'MMM d, yyyy');
    }
  } catch {
    // Continue
  }

  // Try RFC 2822 format "Thu, 15 Jan 2026 12:00:00 +0000"
  try {
    date = new Date(dateStr);
    if (isValid(date)) {
      return format(date, 'MMM d, yyyy');
    }
  } catch {
    // Continue
  }

  return dateStr;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';

  try {
    const date = new Date(dateStr);
    if (isValid(date)) {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  } catch {
    return dateStr;
  }

  return dateStr;
};

export const isDateInPast = (dateStr: string): boolean => {
  try {
    const date = new Date(dateStr);
    return date < new Date();
  } catch {
    return false;
  }
};

export const getRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `In ${diffDays} days`;
    }
  } catch {
    return '-';
  }
};
