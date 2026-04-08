/**
 * Escapes a value for safe interpolation into HTML template strings.
 * Prevents XSS when using document.write() in print windows.
 */
export const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
