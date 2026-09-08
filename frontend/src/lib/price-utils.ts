/**
 * Utility functions for robust currency handling in Iranian Tomans.
 * Ensures whole integer precision (no .00 decimal places) and proper 3-digit comma separation.
 */

/**
 * Converts any price (number, string with decimals like "420000.00", strings with commas, etc.)
 * into a clean rounded integer.
 */
export function parsePrice(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") {
    if (isNaN(val)) return 0;
    return Math.round(val);
  }

  const str = String(val).trim();
  if (!str) return 0;

  // Convert Persian and Arabic numerals to standard Latin digits
  const normalizedDigits = str
    .replace(/[۰-۹]/g, (d: string) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d: string) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());

  // Strip Persian/English currency labels and separators
  const cleaned = normalizedDigits
    .replace(/تومان|ریال|IRR|TOMAN|,|٬/gi, "")
    .trim();

  const parsed = parseFloat(cleaned);
  if (!isNaN(parsed)) {
    return Math.round(parsed);
  }

  const match = cleaned.match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Formats a price into Persian digits with 3-digit grouping and zero decimal places.
 * E.g. "420000.00" -> "۴۲۰٬۰۰۰"
 */
export function formatPriceNumber(val: any): string {
  const num = parsePrice(val);
  return num.toLocaleString("fa-IR", {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
}

/**
 * Formats a price with 3-digit grouping and the "تومان" unit.
 * E.g. "420000.00" -> "۴۲۰٬۰۰۰ تومان"
 */
export function formatPrice(val: any, fallback: string = "۰ تومان"): string {
  if (val === null || val === undefined || val === "") return fallback;
  const num = parsePrice(val);
  if (num === 0 && fallback !== "۰ تومان") return fallback;
  return `${formatPriceNumber(num)} تومان`;
}
