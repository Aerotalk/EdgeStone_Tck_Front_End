const IST = 'Asia/Kolkata';

/**
 * Format a date string or Date object to a localized IST date string.
 * Example output: "21 Feb" or "21 Feb, 2026"
 */
export function formatDateIST(
    date: string | Date,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
    return new Date(date).toLocaleDateString('en-GB', { ...options, timeZone: IST });
}

/**
 * Format a date string or Date object to a localized IST time string (24hr).
 * Example output: "01:30"
 */
export function formatTimeIST(date: string | Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: IST,
    });
}

/**
 * Get current date formatted in IST.
 * Example output: "21 Feb"
 */
export function nowDateIST(
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
    return formatDateIST(new Date(), options);
}

/**
 * Get current time formatted in IST (24hr) with "hrs" suffix.
 * Example output: "13:45 hrs"
 */
export function nowTimeIST(): string {
    return `${formatTimeIST(new Date())} hrs`;
}
