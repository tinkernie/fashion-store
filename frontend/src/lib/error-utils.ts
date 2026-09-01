// Persian Error Translation Utility for DRF, Axios, and Frontend Form Validation

const errorMap: Record<string, string> = {
  // Coupon & Discount Errors & Codes
  "Invalid or expired coupon code.": "کد تخفیف وارد شده نامعتبر است یا مهلت استفاده از آن به پایان رسیده است.",
  "You have reached the usage limit for this coupon.": "شما قبلاً به سقف مجاز استفاده از این کد تخفیف رسیده‌اید.",
  "Coupon usage limit reached.": "ظرفیت و سقف استفاده از این کد تخفیف تکمیل شده است.",
  "Coupon not applicable to items in your cart.": "این کد تخفیف برای اقلام موجود در سبد خرید شما قابل اعمال نیست.",
  "A coupon with this code already exists.": "کد تخفیفی با این عنوان قبلاً در سیستم ثبت شده است.",
  "Percentage discount must be between 0 and 100.": "درصد تخفیف باید عددی بین ۱ تا ۱۰۰ باشد.",
  "Invalid discount percentage.": "درصد تخفیف نامعتبر است.",
  "Coupon not found or inactive.": "کد تخفیف یافت نشد یا در حال حاضر غیرفعال است.",
  "Coupon has expired.": "مهلت استفاده از این کد تخفیف به پایان رسیده است.",
  "Cart minimum amount not met for this coupon.": "حداقل مبلغ خرید مورد نیاز برای اعمال این تخفیف رعایت نشده است.",
  "Coupon is not valid yet.": "زمان فعال‌سازی و شروع این کد تخفیف هنوز فرا نرسیده است.",
  "Coupon not found.": "کد تخفیف مورد نظر یافت نشد.",
  "coupon_limit_reached": "سقف استفاده از این کد تخفیف تکمیل شده است.",
  "invalid_coupon": "کد تخفیف وارد شده نامعتبر یا منقضی است.",

  // Authentication & User Accounts (Messages & Codes)
  "Password is incorrect.": "رمز عبور وارد شده نادرست است.",
  "first_name cannot be blank or whitespace.": "نام نمی‌تواند خالی یا فقط فاصله باشد.",
  "last_name cannot be blank or whitespace.": "نام خانوادگی نمی‌تواند خالی یا فقط فاصله باشد.",
  "first_name is required.": "وارد کردن نام الزامی است.",
  "last_name is required.": "وارد کردن نام خانوادگی الزامی است.",
  "first_name contains invalid characters.": "نام وارد شده شامل کاراکترهای غیرمجاز است.",
  "last_name contains invalid characters.": "نام خانوادگی شامل کاراکترهای غیرمجاز است.",
  "Search query too long (max 100).": "عبارت جستجو بیش از حد طولانی است (حداکثر ۱۰۰ کاراکتر).",
  "Verification email sent to new address.": "ایمیل تایید به آدرس ایمیل جدید ارسال شد.",
  "Email changed successfully. Please log in again.": "ایمیل با موفقیت تغییر یافت. لطفاً دوباره وارد حساب خود شوید.",
  "A user with this email already exists.": "کاربری با این آدرس ایمیل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.",
  "User with this email already exists.": "کاربری با این آدرس ایمیل قبلاً ثبت‌نام کرده است.",
  "email_exists": "کاربری با این آدرس ایمیل قبلاً ثبت‌نام کرده است. لطفاً وارد حساب خود شوید.",
  "Invalid credentials.": "ایمیل یا رمز عبور وارد شده نادرست است.",
  "invalid_credentials": "ایمیل یا رمز عبور وارد شده نادرست است.",
  "Account not activated. Please verify your email.": "حساب کاربری شما هنوز فعال نشده است. لطفاً ایمیل فعال‌سازی را تایید کنید.",
  "inactive_account": "حساب کاربری شما هنوز فعال نشده است. لطفاً ایمیل فعال‌سازی را تایید نمایید.",
  "Current password is incorrect.": "رمز عبور فعلی وارد شده نادرست است.",
  "wrong_password": "رمز عبور فعلی وارد شده نادرست است.",
  "Invalid verification token.": "لینک یا کد تایید حساب نامعتبر است.",
  "invalid_token": "لینک یا کد تایید حساب نامعتبر است.",
  "Token already used.": "این لینک تایید قبلاً استفاده شده است.",
  "token_used": "این لینک تایید قبلاً استفاده شده است.",
  "Verification token expired.": "لینک تایید منقضی شده است. لطفاً درخواست لینک جدید ارسال نمایید.",
  "token_expired": "لینک تایید منقضی شده است. لطفاً درخواست لینک جدید ارسال نمایید.",
  "Invalid or expired reset token.": "لینک بازیابی رمز عبور منقضی شده یا نامعتبر است.",
  "Invalid reset link.": "لینک بازیابی رمز عبور نامعتبر است.",
  "invalid_link": "لینک بازیابی رمز عبور نامعتبر یا منقضی است.",
  "Password reset successful.": "رمز عبور با موفقیت تغییر یافت.",
  "Password changed successfully.": "رمز عبور جدید با موفقیت ذخیره شد.",
  "User registered successfully.": "ثبت‌نام شما با موفقیت انجام شد.",
  "Authentication credentials were not provided.": "لطفاً ابتدا وارد حساب کاربری خود شوید.",
  "Given token not valid for any token type": "نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد شوید.",
  "Token is blacklisted": "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
  "Token is invalid or expired": "نشست کاربری نامعتبر یا منقضی شده است.",
  "User not found.": "کاربری با این مشخصات یافت نشد.",
  "Email not found.": "این ایمیل در سیستم ثبت نشده است.",
  "not_found": "مورد درخواستی یافت نشد.",
  "self_deactivate": "امکان غیرفعال‌سازی حساب کاربری خود وجود ندارد.",

  // Cart & Inventory (Messages & Codes)
  "Item not in cart.": "این کالا در سبد خرید شما یافت نشد.",
  "Insufficient stock.": "موجودی انبار برای این کالا کافی نیست.",
  "insufficient_stock": "موجودی انبار برای این کالا کافی نیست.",
  "Variant is out of stock.": "این تنوع محصول در حال حاضر ناموجود است.",
  "variant_out_of_stock": "این تنوع محصول در حال حاضر ناموجود است.",
  "Product is not available.": "این محصول در دسترس نیست.",
  "Variant not available.": "این تنوع کالا در حال حاضر در دسترس نیست.",
  "No user or session provided.": "شناسه سبد خرید نامعتبر است.",
  "Cannot adjust reservation": "امکان رزرو موجودی این کالا برای شما وجود ندارد.",
  "Item is out of stock": "موجودی این کالا به پایان رسیده است.",
  "Reservation has expired.": "مهلت رزرو موجودی این کالا به پایان رسیده است.",
  "reservation_expired": "مهلت رزرو موجودی این کالا به پایان رسیده است. لطفاً سبد خرید را به‌روزرسانی نمایید.",
  "Price has changed.": "قیمت محصول تغییر کرده است. لطفاً سبد خرید را بازبینی نمایید.",
  "price_changed": "قیمت محصول تغییر کرده است. لطفاً سبد خرید را بازبینی نمایید.",
  "Cart is empty.": "سبد خرید شما خالی است.",

  // Orders & Payment
  "Order not found.": "سفارش مورد نظر یافت نشد.",
  "Payment failed.": "عملیات پرداخت ناموفق بود.",
  "payment_failed": "عملیات پرداخت با خطا مواجه شد.",
  "Order already paid.": "این سفارش قبلاً پرداخت شده است.",
  "Order already has a successful payment.": "این سفارش قبلاً با موفقیت پرداخت شده است.",
  "Order cannot be paid in its current status.": "وضعیت سفارش برای پرداخت نامعتبر است.",
  "Invalid order state.": "وضعیت سفارش برای این عملیات نامعتبر است.",
  "Shipping address is required.": "ثبت آدرس و اطلاعات تحویل‌گیرنده الزامی است.",

  // Forms & Validation
  "This field is required.": "تکمیل این فیلد الزامی است.",
  "Enter a valid email address.": "لطفاً یک آدرس ایمیل معتبر وارد کنید.",
  "This field may not be blank.": "این فیلد نباید خالی باشد.",
  "Ensure this field has no more than": "تعداد کاراکترهای وارد شده بیش از حد مجاز است.",
  "Ensure this field has at least": "طول این فیلد کمتر از حد مجاز است.",
  "A valid number is required.": "لطفاً یک عدد معتبر وارد کنید.",

  // Rate Limiting & Throttling
  "throttled": "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً دقایقی صبر کنید.",
  "Request was throttled.": "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.",

  // System & Network
  "Network Error": "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.",
  "Request failed with status code 400": "اطلاعات ارسال شده نامعتبر است. لطفاً ورودی‌ها را بررسی کنید.",
  "Request failed with status code 401": "دسترسی غیرمجاز. لطفاً وارد حساب خود شوید.",
  "Request failed with status code 403": "شما دسترسی و مجوز لازم برای این بخش را ندارید.",
  "Request failed with status code 404": "مورد درخواستی در سرور یافت نشد.",
  "Request failed with status code 429": "تعداد درخواست‌های ارسالی بیش از حد مجاز است. لطفاً کمی صبر کنید.",
  "Request failed with status code 500": "خطای داخلی سرور رخ داده است. لطفاً دقایقی دیگر تلاش کنید.",
  "Internal Server Error": "خطای سرور. لطفاً بعداً دوباره امتحان کنید.",
};

export function translateError(msg: string): string {
  if (!msg || typeof msg !== "string") return "خطایی در انجام عملیات رخ داد.";
  const trimmed = msg.trim();

  // Exact match
  if (errorMap[trimmed]) return errorMap[trimmed];

  // Case-insensitive & partial matches
  for (const [key, val] of Object.entries(errorMap)) {
    if (trimmed.toLowerCase() === key.toLowerCase()) {
      return val;
    }
  }

  for (const [key, val] of Object.entries(errorMap)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }

  // Smart keyword recognizers
  const lower = trimmed.toLowerCase();
  if (lower.includes("throttled") || lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("429")) {
    return "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً دقایقی صبر کنید.";
  }
  if (lower.includes("inactive") || lower.includes("not activated") || lower.includes("verify your email")) {
    return "حساب کاربری شما هنوز فعال نشده است. لطفاً ایمیل خود را تایید کنید.";
  }
  if (lower.includes("reservation") && (lower.includes("expired") || lower.includes("expire"))) {
    return "مهلت رزرو موجودی کالا به پایان رسیده است. لطفاً سبد خرید را به‌روزرسانی نمایید.";
  }
  if (lower.includes("minimum purchase") || lower.includes("min_purchase")) {
    return "حداقل مبلغ خرید برای استفاده از این کد تخفیف رعایت نشده است.";
  }
  if (lower.includes("coupon") && (lower.includes("invalid") || lower.includes("expired") || lower.includes("not found"))) {
    return "کد تخفیف نامعتبر است یا مهلت استفاده از آن به پایان رسیده است.";
  }
  if (lower.includes("coupon") && lower.includes("limit")) {
    return "سقف استفاده از این کد تخفیف تکمیل شده است.";
  }
  if (lower.includes("coupon") && lower.includes("exists")) {
    return "کد تخفیفی با این عنوان قبلاً ثبت شده است.";
  }
  if (lower.includes("already exists") || lower.includes("unique")) {
    return "این مقدار قبلاً در سیستم ثبت شده و تکراری است.";
  }
  if (lower.includes("required") || lower.includes("blank")) {
    return "تکمیل فیلدهای الزامی ضروری است.";
  }
  if (lower.includes("permission") || lower.includes("forbidden") || lower.includes("not allowed") || lower.includes("403")) {
    return "شما مجوز لازم برای انجام این عملیات را ندارید.";
  }
  if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("not authenticated")) {
    return "لطفاً ابتدا وارد حساب کاربری خود شوید.";
  }
  if (lower.includes("network error") || lower.includes("err_connection") || lower.includes("econnrefused")) {
    return "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
  }
  if (lower.includes("password") && (lower.includes("10") || lower.includes("short") || lower.includes("common") || lower.includes("weak"))) {
    return "رمز عبور باید حداقل ۱۰ کاراکتر و شامل حروف بزرگ، عدد و نماد باشد.";
  }
  if (lower.includes("stock") || lower.includes("inventory") || lower.includes("quantity")) {
    return "موجودی کالای مورد نظر در انبار کافی نمی‌باشد.";
  }
  if (lower.includes("email") && (lower.includes("invalid") || lower.includes("valid"))) {
    return "لطفاً یک آدرس ایمیل معتبر وارد کنید.";
  }

  // If text contains latin characters and not translated, return a clean Persian fallback
  if (/[a-zA-Z]/.test(trimmed)) {
    return "خطایی در انجام عملیات رخ داد. لطفاً دوباره تلاش کنید.";
  }

  return trimmed;
}

export function getApiErrorMessage(error: any, defaultMsg = "خطایی در انجام عملیات رخ داد"): string {
  if (!error) return defaultMsg;
  if (typeof error === "string") return translateError(error);

  const data = error?.response?.data;
  if (!data) {
    if (error.message) return translateError(error.message);
    return defaultMsg;
  }

  if (typeof data === "string") return translateError(data);
  if (data.code && errorMap[data.code]) return errorMap[data.code];
  if (data.error?.code && errorMap[data.error.code]) return errorMap[data.error.code];
  if (typeof data.error === "string") return translateError(data.error);
  if (data.error?.message) return translateError(data.error.message);
  if (data.detail) return translateError(data.detail);
  if (data.message) return translateError(data.message);

  if (data.error?.errors && typeof data.error.errors === "object") {
    const firstKey = Object.keys(data.error.errors)[0];
    const val = data.error.errors[firstKey];
    const raw = Array.isArray(val) ? val[0] : String(val);
    return translateError(raw);
  }

  if (typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const val = data[firstKey];
    const raw = Array.isArray(val) ? val[0] : String(val);
    return translateError(raw);
  }

  return defaultMsg;
}

