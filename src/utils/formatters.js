/**
 * Format a number as Turkish Lira: ₺75.000,50
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₺0,00';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number without currency symbol: 75.000,50
 */
export function formatNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0,00';
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date as Turkish short date: 15 Haz 2026
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date as Turkish long date: 15 Haziran 2026
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format today's date as YYYY-MM-DD for input fields
 */
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate days between two date strings
 */
export function daysBetween(fromStr, toStr) {
  const from = new Date(fromStr + 'T00:00:00');
  const to = new Date(toStr + 'T00:00:00');
  const diff = to - from;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Days until a future date from today
 */
export function daysUntil(dateStr) {
  return daysBetween(todayStr(), dateStr);
}

/**
 * Parse Turkish-formatted number string back to float
 */
export function parseTurkishNumber(str) {
  if (!str) return 0;
  // Remove thousands separators (.) and replace decimal comma with dot
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}
