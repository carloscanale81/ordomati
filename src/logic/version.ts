/**
 * Application build version tag generated in YYYYMMDDhhmmss format.
 * Injected during Vite build or dev server via import.meta.env.VITE_APP_BUILD_VERSION,
 * or computed at runtime as a fallback.
 */
export function generateTimestampVersion(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

export const APP_BUILD_VERSION: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_BUILD_VERSION) ||
  generateTimestampVersion();
