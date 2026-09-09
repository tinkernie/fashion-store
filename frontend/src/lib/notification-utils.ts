/**
 * Notification localization and formatting utilities for Persian (Farsi) users.
 * Automatically translates and standardizes backend English notification templates
 * and status transitions into natural, polite Persian text.
 */

import { formatPrice, formatPriceNumber, parsePrice } from "@/lib/price-utils";

export const ORDER_STATUS_MAP_FA: Record<string, string> = {
  pending: "در انتظار پرداخت",
  awaiting_payment: "در انتظار پرداخت",
  paid: "پرداخت تایید شده",
  packing: "در حال آماده‌سازی و بسته‌بندی",
  processing: "در حال پردازش در انبار",
  shipping: "تحویل به شرکت پست / در حال ارسال",
  shipped: "تحویل به شرکت پست",
  delivered: "تحویل داده شده به مشتری",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
  refunded: "مسترد شده",
};

export const NOTIFICATION_TYPE_MAP_FA: Record<string, string> = {
  order_status_change: "تغییر وضعیت سفارش",
  order_confirmation: "ثبت سفارش جدید",
  shipping_update: "ارسال مرسوله",
  password_reset: "بازیابی رمز عبور",
  welcome: "خوش‌آمدگویی",
  wishlist_discount: "تخفیف کالای مورد علاقه",
  generic: "پیام سیستم",
};

export interface LocalizedNotification {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  body: string;
  orderNumber?: string;
  productId?: string;
  productUrl?: string;
  productName?: string;
  discountPercent?: number;
  newPrice?: number;
  remainingTime?: string;
  statusLabel?: string;
  is_read: boolean;
  created_at: string;
  user_email?: string;
  [key: string]: any;
}

/**
 * Normalizes English or mixed status string into natural Persian
 */
export function getPersianStatus(status?: string): string {
  if (!status) return "";
  const key = status.trim().toLowerCase();
  return ORDER_STATUS_MAP_FA[key] || status;
}

/**
 * Translates and formats customer notifications into 100% Persian
 */
export function localizeNotification(notif: any): LocalizedNotification {
  if (!notif) {
    return {
      id: "unknown",
      type: "generic",
      typeLabel: "پیام سیستم",
      title: "پیام جدید",
      body: "",
      is_read: true,
      created_at: new Date().toISOString(),
    };
  }

  const id = String(notif.id || `notif-${Date.now()}`);
  const rawType = String(notif.type || "generic").toLowerCase();
  const rawSubject = String(notif.subject || notif.title || "").trim();
  const rawBody = String(notif.body || notif.message || "").trim();
  const is_read = Boolean(notif.is_read);
  const created_at = notif.created_at || new Date().toISOString();
  const context = notif.context_json || notif.context || {};

  // Extract order number from context or text regex
  let orderNumber =
    context.order_number ||
    context.orderNumber ||
    context.order_id ||
    "";

  if (!orderNumber) {
    const match = `${rawSubject} ${rawBody}`.match(/(?:ORD-|LUXE-|order\s+|سفارش\s+)([A-Za-z0-9-]+)/i);
    if (match) {
      orderNumber = match[1].trim();
    }
  }

  // Extract old & new status if present
  let oldStatus = context.old_status || "";
  let newStatus = context.new_status || "";

  if (!newStatus) {
    // Regex matches like "is now PAID (was pending)" or "is now shipping" or "changed from X to Y"
    const statusChangeMatch = rawBody.match(/changed from\s+([a-zA-Z_]+)\s+to\s+([a-zA-Z_]+)/i);
    if (statusChangeMatch) {
      oldStatus = statusChangeMatch[1];
      newStatus = statusChangeMatch[2];
    } else {
      const nowMatch = rawBody.match(/is now\s+([a-zA-Z_]+)(?:\s+\(was\s+([a-zA-Z_]+)\))?/i);
      if (nowMatch) {
        newStatus = nowMatch[1];
        oldStatus = nowMatch[2] || "";
      } else {
        const subjectStatusMatch = rawSubject.match(/is now\s+([a-zA-Z_]+)/i);
        if (subjectStatusMatch) {
          newStatus = subjectStatusMatch[1];
        }
      }
    }
  }

  const typeLabel = NOTIFICATION_TYPE_MAP_FA[rawType] || "پیام سیستم";
  const newStatusFa = getPersianStatus(newStatus);
  const oldStatusFa = getPersianStatus(oldStatus);

  let title = rawSubject;
  let body = rawBody;
  let statusLabel = newStatusFa || "";

  // 1. Order status change localization
  if (rawType === "order_status_change" || (rawSubject.toLowerCase().includes("order") && (newStatus || rawSubject.toLowerCase().includes("status") || rawSubject.toLowerCase().includes("is now")))) {
    if (newStatusFa) {
      title = orderNumber
        ? `وضعیت سفارش ${orderNumber}: ${newStatusFa}`
        : `وضعیت سفارش شما: ${newStatusFa}`;

      body = orderNumber
        ? oldStatusFa
          ? `کاربر گرامی، وضعیت سفارش ${orderNumber} از «${oldStatusFa}» به «${newStatusFa}» تغییر یافت.`
          : `کاربر گرامی، سفارش شما به شماره ${orderNumber} اکنون در وضعیت «${newStatusFa}» قرار دارد.`
        : `کاربر گرامی، وضعیت سفارش شما به «${newStatusFa}» تغییر یافت.`;
    } else {
      title = orderNumber ? `بروزرسانی وضعیت سفارش ${orderNumber}` : "بروزرسانی وضعیت سفارش";
      body = "کاربر گرامی، وضعیت یکی از سفارش‌های شما تغییر کرده است. لطفاً بخش سفارش‌ها را بررسی فرمایید.";
    }
  }

  // 2. Order confirmation localization
  else if (rawType === "order_confirmation" || rawSubject.toLowerCase().includes("confirmed") || rawSubject.includes("ثبت شد")) {
    title = orderNumber
      ? `سفارش ${orderNumber} با موفقیت ثبت شد`
      : "سفارش شما با موفقیت ثبت شد";
    body = orderNumber
      ? `کاربر گرامی، سفارش شما با شماره ${orderNumber} با موفقیت در سیستم ثبت گردید و جهت آماده‌سازی به واحد انبارداری تحویل داده شد.`
      : "کاربر گرامی، سفارش شما با موفقیت در سیستم ثبت گردید و در حال آماده‌سازی است.";
    statusLabel = "ثبت شده";
  }

  // 3. Shipping update localization
  else if (rawType === "shipping_update" || rawSubject.toLowerCase().includes("shipped") || rawSubject.includes("ارسال شد")) {
    title = orderNumber
      ? `مرسوله سفارش ${orderNumber} تحویل پست شد`
      : "سفارش شما تحویل پست شد";
    body = orderNumber
      ? `خبر خوب! سفارش شماره ${orderNumber} با موفقیت بسته‌بندی شد و جهت ارسال سریع به آدرس شما تحویل شرکت پست گردید.`
      : "سفارش شما با موفقیت بسته‌بندی و جهت ارسال به شرکت پست تحویل داده شد.";
    statusLabel = "تحویل به پست";
  }

  // 4. Welcome message localization
  else if (rawType === "welcome" || rawSubject.toLowerCase().includes("welcome")) {
    title = "به فروشگاه لوکس فشن خوش آمدید";
    body = "از اینکه به جمع مشتریان خاص ما پیوستید بسیار خوشحالیم. برای مشاهده جدیدترین استایل‌ها و کالکشن‌های فصلی به بخش کاتالوگ سر بزنید.";
  }

  // 5. Wishlist product discount notification
  else if (
    rawType === "wishlist_discount" ||
    rawType.includes("discount") ||
    rawSubject.includes("تخفیف") ||
    rawSubject.toLowerCase().includes("discount") ||
    rawSubject.toLowerCase().includes("sale")
  ) {
    const rawProdId =
      context.product_id ||
      context.productId ||
      notif.productId ||
      notif.product_id ||
      "";
    const rawProdName =
      context.product_name ||
      context.productName ||
      context.product_title ||
      notif.productName ||
      notif.product_title ||
      "کالای مورد علاقه";
    const discPercent =
      context.discount_percent ||
      context.discountPercent ||
      notif.discountPercent ||
      notif.discount_percent;
    const finalNewPrice =
      context.new_price ||
      context.newPrice ||
      context.discount_price ||
      notif.newPrice ||
      notif.discount_price;
    const remainTime =
      context.remaining_time ||
      context.remainingTime ||
      notif.remainingTime ||
      "۴۸ ساعت";

    const percentFormatted = discPercent ? `${formatPriceNumber(discPercent)}٪` : "ویژه";
    title = `تخفیف استثنایی: «${rawProdName}» تخفیف خورد!`;
    body = `خبر خوب! محصول «${rawProdName}» که در لیست علاقه‌مندی‌های شما قرار دارد، مشمول ${percentFormatted} تخفیف شد.${
      finalNewPrice ? ` قیمت جدید: ${formatPrice(finalNewPrice)}.` : ""
    } مهلت استفاده: ${remainTime}. جهت مشاهده و ثبت سفارش کلیک کنید.`;

    statusLabel = discPercent ? `٪${formatPriceNumber(discPercent)} تخفیف` : "تخفیف ویژه";

    return {
      ...notif,
      id,
      type: "wishlist_discount",
      typeLabel: "تخفیف کالای مورد علاقه",
      title,
      body,
      productId: rawProdId || notif.productId || undefined,
      productUrl: rawProdId ? `/products/${rawProdId}` : notif.productUrl || undefined,
      productName: rawProdName,
      discountPercent: discPercent ? Number(discPercent) : undefined,
      newPrice: finalNewPrice ? parsePrice(finalNewPrice) : undefined,
      remainingTime: remainTime,
      orderNumber: orderNumber || undefined,
      statusLabel,
      is_read,
      created_at,
    };
  }

  // 6. Password reset
  else if (rawType === "password_reset" || rawSubject.toLowerCase().includes("password")) {
    title = "درخواست بازیابی رمز عبور";
    body = "لینک تغییر رمز عبور حساب کاربری شما با موفقیت صادر گردید.";
  }

  // Fallback: If text still contains dominant English characters and generic fallback fits
  else if (/^[A-Za-z0-9\s.,!?:;'"()—_-]+$/.test(rawSubject)) {
    title = "اطلاعیه فروشگاه";
    body = "کاربر گرامی، یک پیام سیستمی جدید برای حساب کاربری شما ارسال شده است.";
  }

  const resolvedProductId =
    context.product_id || context.productId || notif.productId || undefined;

  return {
    ...notif,
    id,
    type: rawType,
    typeLabel,
    title,
    body,
    productId: resolvedProductId,
    productUrl: resolvedProductId ? `/products/${resolvedProductId}` : notif.productUrl || undefined,
    orderNumber: orderNumber || undefined,
    statusLabel: statusLabel || undefined,
    is_read,
    created_at,
  };
}
