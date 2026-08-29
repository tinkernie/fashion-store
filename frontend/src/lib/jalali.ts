// Solar Hijri (Jalali / Shamsi) Date Calculations and Formatting

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const JALALI_WEEK_DAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

export const JALALI_WEEK_DAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

/**
 * Converts Gregorian date to Jalali [year, month, day]
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

/**
 * Converts Jalali date to Gregorian [year, month, day]
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  jy += 1595;
  let days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 13 && gd > sal_a[gm]) {
    gd -= sal_a[gm];
    gm++;
  }
  return [gy, gm, gd];
}

/**
 * Returns the number of days in a given Jalali month (year, month 1-12)
 */
export function getJalaliMonthDays(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Is leap year in Jalali
  const isLeap = (((year - (year > 0 ? 474 : 473)) % 2820) + 474 + 38) * 682 % 2816 < 682;
  return isLeap ? 30 : 29;
}

/**
 * Returns the day of week (0 for شنبه, 6 for جمعه) for 1st of a Jalali month
 */
export function getJalaliFirstDayOfWeek(year: number, month: number): number {
  const [gy, gm, gd] = jalaliToGregorian(year, month, 1);
  const gDate = new Date(gy, gm - 1, gd);
  const day = gDate.getDay(); // 0 = Sunday, 6 = Saturday
  // Convert to Saturday = 0, Friday = 6
  return (day + 1) % 7;
}

/**
 * Formats any Date or ISO string to standard Persian Shamsi text
 * e.g. "۱۴۰۴/۰۶/۱۰" or "۱۰ شهریور ۱۴۰۴"
 */
export function formatShamsiDate(
  dateInput?: string | Date | number | null,
  options: { mode?: "numeric" | "full" | "time"; withTime?: boolean } = { mode: "numeric" }
): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "—";

    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());

    if (options.mode === "full") {
      const monthName = JALALI_MONTH_NAMES[jm - 1];
      const datePart = `${jd.toLocaleString("fa-IR")} ${monthName} ${jy.toLocaleString("fa-IR").replace(/٬|,/g, "")}`;
      if (options.withTime) {
        const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        return `${datePart}، ساعت ${timePart}`;
      }
      return datePart;
    }

    // Default numeric "۱۴۰۴/۰۶/۱۰"
    const mStr = jm < 10 ? `۰${jm.toLocaleString("fa-IR")}` : jm.toLocaleString("fa-IR");
    const dStr = jd < 10 ? `۰${jd.toLocaleString("fa-IR")}` : jd.toLocaleString("fa-IR");
    const yStr = jy.toLocaleString("fa-IR").replace(/٬|,/g, "");

    const base = `${yStr}/${mStr}/${dStr}`;
    if (options.withTime) {
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      return `${base} ${hours}:${mins}`;
    }
    return base;
  } catch {
    return "—";
  }
}
