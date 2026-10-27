/**
 * Safely serializes an object to JSON for use in <script type="application/ld+json">
 * tags by escaping dangerous HTML/script characters and Unicode line separators.
 * This prevents reflected XSS via JSON-LD interpolation.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export default safeJsonLd;
