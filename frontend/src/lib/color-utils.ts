// Iranian Fashion Color Mapping & Helper Utility

export const COLOR_MAP: Record<string, string> = {
  // Blacks & Charcoals
  "مشکی": "#111111",
  "مشکی مات": "#1C1C1E",
  "سیاه": "#000000",
  "ذغالی": "#262626",
  "زغالی": "#262626",
  "دودی": "#3A3A3C",
  "نوک مدادی": "#2C3437",

  // Whites & Off-Whites
  "سفید": "#FFFFFF",
  "سفید استخوانی": "#F5F5F0",
  "شیری": "#FAF0E6",
  "عاجی": "#FFFFF0",

  // Creams, Beiges & Camels
  "کرم": "#E5D3B3",
  "کرم شتری": "#C8A97E",
  "شتری": "#C19A6B",
  "بژ": "#D1C7B7",
  "نسکافه‌ای": "#B8977E",
  "کاراملی": "#A77B57",
  "عسلی": "#D4A373",
  "گندمی": "#E2CAAC",

  // Browns & Chocolates
  "قهوه‌ای": "#5C3A21",
  "قهوه‌ای تیره": "#3D2314",
  "قهوه‌ای روشن": "#8B5A2B",
  "شکلاتی": "#4A2E18",
  "موکا": "#5D4037",
  "برنز": "#8C6239",

  // Greys & Melanges
  "طوسی": "#6B7280",
  "طوسی روشن": "#9CA3AF",
  "طوسی ملانژ": "#7E8590",
  "خاکستری": "#4B5563",
  "نقره‌ای": "#C0C0C0",
  "سربی": "#48494B",

  // Greens & Olives
  "سبز": "#10B981",
  "سبز زیتونی": "#556B2F",
  "زیتونی": "#556B2F",
  "سبز پاستلی": "#86EFAC",
  "سبز کله‌غازی": "#004D40",
  "سبز یشمی": "#1B4D3E",
  "سبز نعنایی": "#A7F3D0",
  "سبز سدری": "#6B7C59",
  "سبز ارتشی": "#4B5320",

  // Blues & Navies
  "سرمه‌ای": "#1E293B",
  "آبی": "#3B82F6",
  "آبی روشن": "#93C5FD",
  "آبی آسمانی": "#7DD3FC",
  "آبی کاربنی": "#1D4ED8",
  "آبی نفتی": "#0F172A",
  "نیلی": "#4F46E5",
  "جین": "#3B5998",

  // Pinks & Purples
  "صورتی": "#F472B6",
  "صورتی ملایم": "#F9A8D4",
  "صورتی کالباسی": "#D88A8A",
  "کالباسی": "#D88A8A",
  "گلبهی": "#F87171",
  "یاسی": "#C084FC",
  "بنفش": "#8B5CF6",
  "ارغوانی": "#6B21A8",
  "بادمجانی": "#4A0E4E",

  // Reds & Oranges
  "قرمز": "#EF4444",
  "زرشکی": "#881337",
  "شرابی": "#581C87",
  "عنابی": "#6B1D2F",
  "نارنجی": "#F97316",
  "آجری": "#C2410C",
  "مسی": "#B87333",
  "خردلی": "#EAB308",
  "زرد": "#FACC15",
  "لیمویی": "#FEF08A",
};

/**
 * Returns a CSS background value (hex color or linear-gradient) for any Persian color string.
 */
export function getColorBackground(colorName: string): string {
  if (!colorName || typeof colorName !== "string") return "#4B5563";
  const trimmed = colorName.trim();

  // Multi-tone colors like "سفید / مشکی" or "سفید / طوسی"
  if (trimmed.includes("/") || trimmed.includes(" و ") || trimmed.includes("-")) {
    const parts = trimmed.split(/[/و\-]/).map((s) => s.trim());
    if (parts.length >= 2) {
      const c1 = getColorBackground(parts[0]);
      const c2 = getColorBackground(parts[1]);
      return `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`;
    }
  }

  // Exact Match
  if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed];

  // Case-insensitive / Substring Match
  const lower = trimmed.toLowerCase();
  for (const [k, hex] of Object.entries(COLOR_MAP)) {
    if (lower === k.toLowerCase()) return hex;
  }

  // Heuristic Keyword Matching
  if (lower.includes("مشکی") || lower.includes("سیاه") || lower.includes("ذغالی") || lower.includes("زغالی") || lower.includes("دودی")) {
    return "#1A1A1A";
  }
  if (lower.includes("سفید") || lower.includes("شیری") || lower.includes("استخوانی")) {
    return "#F8F9FA";
  }
  if (lower.includes("کرم") || lower.includes("بژ") || lower.includes("شتری") || lower.includes("نسکافه") || lower.includes("عسلی")) {
    return "#D4A373";
  }
  if (lower.includes("شکلات") || lower.includes("قهوه") || lower.includes("موکا")) {
    return "#4A2E18";
  }
  if (lower.includes("طوسی") || lower.includes("خاکستری") || lower.includes("ملانژ") || lower.includes("نقره")) {
    return "#6B7280";
  }
  if (lower.includes("زیتون")) {
    return "#556B2F";
  }
  if (lower.includes("پاستلی")) {
    return "#86EFAC";
  }
  if (lower.includes("سبز") || lower.includes("یشمی") || lower.includes("کله‌غازی")) {
    return "#10B981";
  }
  if (lower.includes("سرمه") || lower.includes("نفتی")) {
    return "#1E293B";
  }
  if (lower.includes("آبی") || lower.includes("نیلی") || lower.includes("کاربنی")) {
    return "#2563EB";
  }
  if (lower.includes("صورتی") || lower.includes("کالباسی") || lower.includes("گلبهی")) {
    return "#F472B6";
  }
  if (lower.includes("یاسی") || lower.includes("بنفش") || lower.includes("بادمجان")) {
    return "#8B5CF6";
  }
  if (lower.includes("زرشک") || lower.includes("عناب") || lower.includes("شراب")) {
    return "#881337";
  }
  if (lower.includes("قرمز")) {
    return "#EF4444";
  }
  if (lower.includes("آجر") || lower.includes("نارنجی") || lower.includes("مسی")) {
    return "#EA580C";
  }
  if (lower.includes("خردل") || lower.includes("زرد") || lower.includes("لیمو")) {
    return "#EAB308";
  }

  return "#4B5563"; // Elegant default slate
}

/**
 * Determines whether text/icon should be dark or light on this color.
 */
export function isLightColor(colorName: string): boolean {
  if (!colorName) return false;
  const name = colorName.trim().toLowerCase();
  const lightKeywords = [
    "سفید", "شیری", "استخوانی", "کرم", "بژ", "عاجی",
    "لیمویی", "پاستلی", "صورتی ملایم", "طوسی روشن", "یاسی روشن", "گندمی"
  ];
  return lightKeywords.some((k) => name.includes(k));
}
