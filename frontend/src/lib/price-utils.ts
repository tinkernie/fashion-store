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
 * Returns a clean integer string representation suitable for input fields (e.g. "420000").
 * Strips decimal places (.00) and unwanted characters. Returns "" if value is empty/null.
 */
export function cleanPriceInput(val: any): string {
  if (val === null || val === undefined || val === "") return "";
  const num = parsePrice(val);
  return num > 0 ? String(num) : (val === 0 || val === "0" ? "0" : "");
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
 * Formats a price into Latin/English digits with 3-digit comma grouping and zero decimal places.
 * E.g. "420000.00" -> "420,000"
 */
export function formatPriceNumberEn(val: any): string {
  const num = parsePrice(val);
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
}

/**
 * Formats a price with 3-digit grouping and the "تومان" unit in Persian digits.
 * E.g. "420000.00" -> "۴۲۰٬۰۰۰ تومان"
 */
export function formatPrice(val: any, fallback: string = "۰ تومان"): string {
  if (val === null || val === undefined || val === "") return fallback;
  const num = parsePrice(val);
  if (num === 0 && fallback !== "۰ تومان") return fallback;
  return `${formatPriceNumber(num)} تومان`;
}

/**
 * Formats a price with 3-digit grouping and the "تومان" unit in Latin/English digits.
 * E.g. "420000.00" -> "420,000 تومان"
 */
export function formatPriceEn(val: any, fallback: string = "0 تومان"): string {
  if (val === null || val === undefined || val === "") return fallback;
  const num = parsePrice(val);
  if (num === 0 && fallback !== "0 تومان") return fallback;
  return `${formatPriceNumberEn(num)} تومان`;
}

/**
 * Validates whether a discount percentage is strictly an integer between 1 and 99.
 */
export function isValidDiscountPercent(val: any): boolean {
  if (val === null || val === undefined || val === "") return false;
  const str = String(val).trim();
  if (str.includes(".") || str.includes(",")) return false;
  const num = typeof val === "number" ? val : Number(str);
  return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 99;
}

/**
 * Calculates discounted price given base price and percentage (1-99).
 * E.g., basePrice = 1,000,000, percent = 20 -> 800,000
 */
export function calculateDiscountPrice(basePrice: any, percent: any): number {
  const base = parsePrice(basePrice);
  if (base <= 0) return 0;
  if (!isValidDiscountPercent(percent)) return base;
  const p = typeof percent === "number" ? percent : parseInt(String(percent), 10);
  const discounted = Math.round(base * (1 - p / 100));
  return Math.max(0, discounted);
}

/**
 * Calculates discount percentage given base price and discounted price.
 * E.g., basePrice = 1,000,000, discountPrice = 800,000 -> 20
 */
export function calculateDiscountPercent(basePrice: any, discountPrice: any): number {
  const base = parsePrice(basePrice);
  const discounted = parsePrice(discountPrice);
  if (base <= 0 || discounted <= 0 || discounted >= base) return 0;
  const percent = Math.round(((base - discounted) / base) * 100);
  return Math.min(99, Math.max(1, percent));
}

export interface ProductDiscountInfo {
  hasDiscount: boolean;
  basePrice: number;
  discountPrice: number;
  discountPercent: number;
  savings: number;
  remainingTime?: string;
}

/**
 * Extracts and normalizes discount parameters from a product object.
 */
export function getDiscountInfo(product: any): ProductDiscountInfo {
  if (!product) {
    return {
      hasDiscount: false,
      basePrice: 0,
      discountPrice: 0,
      discountPercent: 0,
      savings: 0,
    };
  }

  let basePrice = parsePrice(product.price);
  let rawDiscountPrice = parsePrice(product.discount_price ?? product.discountPrice);

  // If compare_at_price is higher than price, price is the discounted price
  const compareAt = parsePrice(product.compare_at_price ?? product.compareAtPrice);
  if (compareAt > basePrice && basePrice > 0) {
    rawDiscountPrice = basePrice;
    basePrice = compareAt;
  }

  let discountPercent = 0;
  if (isValidDiscountPercent(product.metadata?.discount_percent)) {
    discountPercent = Number(product.metadata.discount_percent);
  } else if (isValidDiscountPercent(product.discount_percent ?? product.discountPercent)) {
    discountPercent = Number(product.discount_percent ?? product.discountPercent);
  } else if (rawDiscountPrice > 0 && rawDiscountPrice < basePrice) {
    discountPercent = calculateDiscountPercent(basePrice, rawDiscountPrice);
  }

  let finalDiscountPrice = 0;
  if (rawDiscountPrice > 0 && rawDiscountPrice < basePrice) {
    finalDiscountPrice = rawDiscountPrice;
  } else if (discountPercent > 0 && basePrice > 0) {
    finalDiscountPrice = calculateDiscountPrice(basePrice, discountPercent);
  }

  const hasDiscount =
    discountPercent >= 1 &&
    discountPercent <= 99 &&
    finalDiscountPrice > 0 &&
    finalDiscountPrice < basePrice;

  const savings = hasDiscount ? Math.max(0, basePrice - finalDiscountPrice) : 0;
  const remainingTime =
    product.metadata?.discount_remaining ||
    product.discount_remaining ||
    product.metadata?.discount_expires_in ||
    "۴۸ ساعت";

  return {
    hasDiscount,
    basePrice,
    discountPrice: hasDiscount ? finalDiscountPrice : basePrice,
    discountPercent: hasDiscount ? discountPercent : 0,
    savings,
    remainingTime: hasDiscount ? remainingTime : undefined,
  };
}


