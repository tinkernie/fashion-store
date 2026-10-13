"use client";

import { DropdownRangeDatePicker } from "@/components/ui/dropdown-range-date-picker";

export default function DropdownRangeDatePickerDemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#0a0a0a]" dir="rtl">
      <div className="w-full max-w-sm">
        <DropdownRangeDatePicker />
      </div>
    </div>
  );
}
