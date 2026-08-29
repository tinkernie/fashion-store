// Persian Error Translation Utility for DRF and Frontend

const errorMap: Record<string, string> = {
  "A user with this email already exists.": "کاربری با این ایمیل قبلاً ثبت نام کرده است. لطفاً وارد شوید.",
  "Invalid credentials.": "ایمیل یا رمز عبور وارد شده نادرست است.",
  "Account not activated. Please verify your email.": "حساب کاربری شما فعال نیست. لطفاً ایمیل خود را تایید کنید.",
  "Current password is incorrect.": "رمز عبور فعلی اشتباه است.",
  "Invalid verification token.": "کد یا لینک تایید نامعتبر است.",
  "Token already used.": "این لینک تایید قبلاً استفاده شده است.",
  "Verification token expired.": "لینک تایید منقضی شده است. لطفاً درخواست لینک جدید دهید.",
  "Invalid or expired reset token.": "لینک بازیابی رمز عبور منقضی شده یا نامعتبر است.",
  "Invalid reset link.": "لینک بازیابی رمز عبور نامعتبر است.",
  "Password reset successful.": "رمز عبور با موفقیت تغییر کرد.",
  "Password changed successfully.": "رمز عبور با موفقیت تغییر کرد.",
  "User registered successfully.": "ثبت‌نام با موفقیت انجام شد.",
  "This field is required.": "تکمیل این فیلد الزامی است.",
  "Enter a valid email address.": "لطفاً یک ایمیل معتبر وارد کنید.",
  "Network Error": "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.",
  "Request failed with status code 401": "دسترسی غیرمجاز. لطفاً وارد حساب خود شوید.",
  "Request failed with status code 403": "شما دسترسی لازم برای این عملیات را ندارید.",
  "Request failed with status code 404": "موردی یافت نشد.",
  "Request failed with status code 500": "خطای داخلی سرور رخ داده است.",
  "email_exists": "این ایمیل قبلاً در سیستم ثبت شده است.",
  "invalid_credentials": "ایمیل یا رمز عبور نادرست است.",
  "inactive_account": "حساب کاربری فعال نیست.",
  "wrong_password": "رمز عبور فعلی اشتباه است.",
  "invalid_token": "کد تایید نامعتبر یا منقضی شده است.",
  "token_used": "این توکن قبلاً استفاده شده است.",
  "token_expired": "این توکن منقضی شده است.",
  "Authentication credentials were not provided.": "لطفاً ابتدا وارد حساب کاربری خود شوید.",
  "Given token not valid for any token type": "نشست کاربری شما منقضی شده است. لطفاً دوباره وارد شوید.",
  "Token is blacklisted": "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
  "Token is invalid or expired": "توکن نامعتبر یا منقضی شده است.",
  "Coupon not found or inactive.": "کد تخفیف یافت نشد یا غیرفعال است.",
  "Coupon has expired.": "مهلت استفاده از این کد تخفیف به پایان رسیده است.",
  "Coupon usage limit reached.": "سقف استفاده از این کد تخفیف تکمیل شده است.",
  "Cart minimum amount not met for this coupon.": "حداقل مبلغ سفارش برای این کد تخفیف رعایت نشده است.",
  "Coupon is not valid yet.": "زمان فعال‌سازی این کد تخفیف هنوز نرسیده است.",
  "Insufficient stock.": "موجودی انبار کافی نیست.",
  "Variant is out of stock.": "این تنوع در حال حاضر ناموجود است.",
};

export function translateError(msg: string): string {
  if (!msg || typeof msg !== "string") return "خطایی در انجام عملیات رخ داد.";
  const trimmed = msg.trim();
  
  if (errorMap[trimmed]) return errorMap[trimmed];
  
  // Partial matches
  for (const [key, val] of Object.entries(errorMap)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }

  if (trimmed.includes("already exists")) return "این مقدار قبلاً ثبت شده و تکراری است.";
  if (trimmed.includes("required")) return "تکمیل فیلدهای الزامی ضروری است.";
  if (trimmed.includes("permission") || trimmed.includes("forbidden") || trimmed.includes("not allowed")) return "شما مجوز انجام این عملیات را ندارید.";
  if (trimmed.includes("Network Error") || trimmed.includes("ERR_CONNECTION")) return "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
  if (trimmed.includes("password") && (trimmed.includes("10") || trimmed.includes("short"))) return "رمز عبور باید حداقل ۱۰ کاراکتر و شامل حروف بزرگ، عدد و نماد باشد.";

  return trimmed;
}

export function getApiErrorMessage(error: any, defaultMsg = "خطایی رخ داده است"): string {
  if (!error) return defaultMsg;
  if (typeof error === "string") return translateError(error);

  const data = error?.response?.data;
  if (!data) {
    if (error.message) return translateError(error.message);
    return defaultMsg;
  }

  if (typeof data === "string") return translateError(data);
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
