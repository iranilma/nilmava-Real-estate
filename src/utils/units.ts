/**
 * NILMA VA Real Estate — Units & Calculation Engine
 * Standards:
 * - 1 m² = 10.76391041671 ft² (standard commercial factor: 10.7639)
 * - 1 ft² = 0.09290304 m²
 * - Canonical database storage is ALWAYS in Square Metres (m²)
 */

export const SQM_TO_SQFT_FACTOR = 10.7639;
export const SQFT_TO_SQM_FACTOR = 1 / SQM_TO_SQFT_FACTOR;

/**
 * Converts Square Metres to Square Feet
 */
export function sqmToSqft(sqm: number): number {
  if (!sqm || isNaN(sqm)) return 0;
  return Math.round(sqm * SQM_TO_SQFT_FACTOR);
}

/**
 * Converts Square Feet to Square Metres (rounded to 2 decimal places)
 */
export function sqftToSqm(sqft: number): number {
  if (!sqft || isNaN(sqft)) return 0;
  return Number((sqft * SQFT_TO_SQM_FACTOR).toFixed(2));
}

/**
 * Formats dual measurement string cleanly based on primary preference
 * e.g. "120 m² (1,292 sq ft)" or "1,292 sq ft (120 m²)"
 */
export function formatDualMeasurement(
  sizeSqm: number,
  primaryUnit: 'sqm' | 'sqft' = 'sqm'
): string {
  if (!sizeSqm || sizeSqm <= 0) return '—';
  const sqft = sqmToSqft(sizeSqm);
  const sqmFormatted = sizeSqm.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const sqftFormatted = sqft.toLocaleString();

  if (primaryUnit === 'sqft') {
    return `${sqftFormatted} sq ft (${sqmFormatted} m²)`;
  }
  return `${sqmFormatted} m² (${sqftFormatted} sq ft)`;
}

/**
 * Currency formatter with zero fraction digits
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  if (amount === undefined || amount === null || isNaN(amount)) return `${sym}0`;
  return `${sym}${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Compact currency formatter ($1.2M, $450k)
 */
export function formatCompactCurrency(amount: number, currency: string = 'USD'): string {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  if (!amount || isNaN(amount)) return `${sym}0`;
  if (amount >= 1_000_000) {
    return `${sym}${(amount / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (amount >= 1_000) {
    return `${sym}${Math.round(amount / 1_000)}k`;
  }
  return `${sym}${Math.round(amount)}`;
}

/**
 * Validates Google Drive folder URL
 * Validates links like:
 * - https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoP
 * - https://drive.google.com/drive/u/0/folders/...
 * - https://drive.google.com/open?id=...
 */
export function isValidGoogleDriveUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.hostname === 'drive.google.com' || parsed.hostname.endsWith('.google.com')) &&
      (parsed.pathname.includes('/folders/') ||
        parsed.searchParams.has('id') ||
        parsed.pathname.startsWith('/drive/'))
    );
  } catch {
    return false;
  }
}
