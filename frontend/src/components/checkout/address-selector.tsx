"use client";

import React, { useState } from "react";
import {
  MapPin,
  Plus,
  Check,
  Building,
  Phone,
  User,
  Trash2,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IranGeoSelect } from "@/components/ui/iran-geo-select";
import {
  UserAddress,
  Province,
  City,
  createUserAddress,
  deleteUserAddress,
} from "@/lib/address-shipping-api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-utils";

interface AddressSelectorProps {
  addresses: UserAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (address: UserAddress) => void;
  onAddressCreated: (address: UserAddress) => void;
  onAddressDeleted: (addressId: string) => void;
  isLoading?: boolean;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddressCreated,
  onAddressDeleted,
  isLoading = false,
}: AddressSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new address
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [street, setStreet] = useState("");
  const [buildingNo, setBuildingNo] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isLimitReached = addresses.length >= 3;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!recipientName.trim()) {
      errors.recipientName = "نام تحویل‌گیرنده الزامی است.";
    }
    const cleanPhone = recipientPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
      errors.recipientPhone = "شماره تماس معتبر نیست (حداقل ۸ و حداکثر ۱۵ رقم).";
    }
    if (!selectedProvince) {
      errors.province = "انتخاب استان الزامی است.";
    }
    if (!selectedCity) {
      errors.city = "انتخاب شهر الزامی است.";
    }
    if (!street.trim()) {
      errors.street = "نشانی و خیابان الزامی است.";
    }
    if (!buildingNo.trim()) {
      errors.buildingNo = "پلاک الزامی است.";
    }
    const cleanPostal = postalCode.replace(/\D/g, "");
    if (cleanPostal.length !== 10) {
      errors.postalCode = "کد پستی باید دقیقاً ۱۰ رقم باشد.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLimitReached) {
      toast.error("حداکثر ۳ آدرس در دفترچه مجاز است. لطفاً یکی از آدرس‌های قبلی را حذف کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createUserAddress({
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        province_id: selectedProvince!.id,
        city_id: selectedCity!.id,
        street: street.trim(),
        building_no: buildingNo.trim(),
        postal_code: postalCode.trim(),
        is_default: isDefault,
      });
      toast.success("آدرس جدید با موفقیت ذخیره شد");
      onAddressCreated(created);
      setIsAddingNew(false);
      resetForm();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در ثبت آدرس جدید"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRecipientName("");
    setRecipientPhone("");
    setSelectedProvince(null);
    setSelectedCity(null);
    setStreet("");
    setBuildingNo("");
    setPostalCode("");
    setIsDefault(false);
    setFormErrors({});
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteUserAddress(id);
      toast.success("آدرس حذف شد");
      onAddressDeleted(id);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در حذف آدرس"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#0082CA]" />
          <h3 className="text-base font-bold text-slate-900">آدرس تحویل سفارش</h3>
          <span className="text-xs text-slate-500 font-normal">
            ({addresses.length.toLocaleString("fa-IR")} از ۳ آدرس مجاز)
          </span>
        </div>

        {!isAddingNew && (
          <Button
            type="button"
            onClick={() => {
              if (isLimitReached) {
                toast.error("حداکثر ۳ آدرس مجاز است. برای ثبت آدرس جدید، ابتدا یکی از آدرس‌ها را حذف کنید.");
              } else {
                setIsAddingNew(true);
              }
            }}
            disabled={isLimitReached}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isLimitReached
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-sky-50 text-[#0082CA] border border-sky-200 hover:bg-[#0082CA] hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن آدرس جدید
          </Button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-8 text-center bg-sky-50/50 rounded-2xl border border-sky-100 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#0082CA]" />
          در حال بارگذاری دفترچه آدرس...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && addresses.length === 0 && !isAddingNew && (
        <div className="text-center py-10 px-4 bg-sky-50/40 border border-dashed border-sky-200 rounded-3xl space-y-3">
          <Home className="w-10 h-10 text-sky-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            هنوز آدرسی در حساب خود ثبت نکرده‌اید
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            برای ادامه خرید و محاسبه دقیق هزینه ارسال، آدرس تحویل سفارش را ثبت کنید.
          </p>
          <Button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="h-10 px-5 rounded-xl bg-[#0082CA] text-white hover:bg-[#006CA8] text-xs font-bold shadow-md shadow-[#0082CA]/20"
          >
            <Plus className="w-4 h-4 ml-1.5" />
            ثبت اولین آدرس تحویل
          </Button>
        </div>
      )}

      {/* Saved Addresses Grid */}
      {!isLoading && addresses.length > 0 && !isAddingNew && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const isSelected = addr.id === selectedAddressId;
            return (
              <div
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className={`relative p-5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-sky-50/80 border-[#0082CA] shadow-md shadow-[#0082CA]/10 ring-2 ring-[#0082CA]/30"
                    : "bg-white border-sky-100 hover:border-sky-300 shadow-sm"
                }`}
              >
                {/* Card Header: Recipient & Selection Radio */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {addr.recipient_name}
                      </span>
                      {addr.is_default && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-sans" dir="ltr">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {addr.recipient_phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(addr.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="حذف این آدرس"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "border-[#0082CA] bg-[#0082CA] text-white"
                          : "border-sky-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Address Body */}
                <p className="text-xs text-slate-700 leading-relaxed">
                  {addr.province_name}، {addr.city_name} — {addr.street}، پلاک {addr.building_no}
                </p>

                {/* Postal Code Footer */}
                <div className="pt-2 border-t border-sky-100/70 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>کد پستی:</span>
                  <span className="font-mono text-slate-700 font-semibold" dir="ltr">
                    {addr.postal_code}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Address Form (inline) */}
      {isAddingNew && (
        <form
          onSubmit={handleSaveNewAddress}
          className="p-6 bg-sky-50/50 border border-sky-200 rounded-3xl space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#0082CA]" />
              مشخصات آدرس تحویل جدید
            </h4>
            {addresses.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsAddingNew(false);
                  resetForm();
                }}
                className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-800"
              >
                انصراف و انتخاب از لیست
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                نام و نام خانوادگی تحویل‌گیرنده
              </label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="مثال: علی رضایی"
                className="h-11 text-sm bg-white border-sky-200 focus-visible:ring-2 focus-visible:ring-[#0082CA]"
              />
              {formErrors.recipientName && (
                <p className="text-rose-500 text-xs">{formErrors.recipientName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                شماره تماس تحویل‌گیرنده
              </label>
              <Input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="h-11 text-sm bg-white border-sky-200 text-left font-sans focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                dir="ltr"
              />
              {formErrors.recipientPhone && (
                <p className="text-rose-500 text-xs">{formErrors.recipientPhone}</p>
              )}
            </div>
          </div>

          {/* Cascading Iran Geo Select */}
          <IranGeoSelect
            provinceId={selectedProvince?.id}
            cityId={selectedCity?.id}
            onProvinceChange={(p) => setSelectedProvince(p)}
            onCityChange={(c) => setSelectedCity(c)}
            provinceError={formErrors.province}
            cityError={formErrors.city}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نشانی دقیق پستی (خیابان، کوچه، طبقه، واحد)</label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="خیابان اصلی، کوچه فرعی، طبقه ۲، واحد ۴"
                className="h-11 text-sm bg-white border-sky-200 focus-visible:ring-2 focus-visible:ring-[#0082CA]"
              />
              {formErrors.street && (
                <p className="text-rose-500 text-xs">{formErrors.street}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">پلاک</label>
              <Input
                value={buildingNo}
                onChange={(e) => setBuildingNo(e.target.value)}
                placeholder="۱۲"
                className="h-11 text-sm bg-white border-sky-200 focus-visible:ring-2 focus-visible:ring-[#0082CA]"
              />
              {formErrors.buildingNo && (
                <p className="text-rose-500 text-xs">{formErrors.buildingNo}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">کد پستی (۱۰ رقمی)</label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="1234567890"
                maxLength={10}
                className="h-11 text-sm bg-white border-sky-200 text-left font-sans focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                dir="ltr"
              />
              {formErrors.postalCode && (
                <p className="text-rose-500 text-xs">{formErrors.postalCode}</p>
              )}
            </div>

            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="default-address-chk"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-[#0082CA] border-sky-300 focus:ring-[#0082CA] cursor-pointer"
              />
              <label
                htmlFor="default-address-chk"
                className="text-xs font-bold text-slate-700 cursor-pointer select-none"
              >
                تنظیم به عنوان آدرس پیش‌فرض حساب
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {addresses.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false);
                  resetForm();
                }}
                className="h-11 px-5 rounded-xl border-sky-200 text-slate-700 text-xs font-bold"
              >
                انصراف
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 rounded-xl bg-[#0082CA] text-white hover:bg-[#006CA8] text-xs font-bold shadow-md shadow-[#0082CA]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  در حال ذخیره آدرس...
                </>
              ) : (
                "ذخیره و استفاده از این آدرس"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
