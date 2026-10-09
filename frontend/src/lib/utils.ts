import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePersianDigits(str: string = ""): string {
  if (!str) return "";
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persian[i], String(i)).replaceAll(arabic[i], String(i));
  }
  return res.trim();
}

