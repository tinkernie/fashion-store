"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error loading users:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await adminApi.toggleUserActive(userId, !currentActive);
      toast.success(currentActive ? "کاربر غیرفعال شد" : "کاربر مجدداً فعال شد");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
    } catch {
      toast.error("خطا در تغییر وضعیت حساب کاربری");
    }
  };

  const filteredUsers = users.filter((u) => {
    const email = (u.email || "").toLowerCase();
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return email.includes(searchQuery.toLowerCase()) || name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            مشتریان و حساب‌های کاربری
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            مشاهده اطلاعات کاربران ثبت‌نامی، خریداران و مدیریت دسترسی‌های مدیریتی
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو بر اساس نام، نام خانوادگی یا آدرس ایمیل..."
          className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold">نام و نام خانوادگی</th>
                <th className="p-4 md:p-5 font-bold">ایمیل</th>
                <th className="p-4 md:p-5 font-bold">نقش کاربری</th>
                <th className="p-4 md:p-5 font-bold">تاریخ عضویت</th>
                <th className="p-4 md:p-5 font-bold">وضعیت حساب</th>
                <th className="p-4 md:p-5 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    هیچ کاربری یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "کاربر مهمان";
                  const isStaff = user.is_staff || user.is_superuser;
                  const isActive = user.is_active !== false;

                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 md:p-5 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {fullName[0]}
                          </div>
                          <span>{fullName}</span>
                        </div>
                      </td>

                      <td className="p-4 md:p-5 text-gray-300 font-mono" dir="ltr">
                        {user.email}
                      </td>

                      <td className="p-4 md:p-5">
                        {isStaff ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Shield className="w-3 h-3" />
                            مدیر سیستم
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">مشتری عادی</span>
                        )}
                      </td>

                      <td className="p-4 md:p-5 text-gray-400">
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString("fa-IR") : "—"}
                      </td>

                      <td className="p-4 md:p-5">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {isActive ? "فعال" : "مسدود شده"}
                        </span>
                      </td>

                      <td className="p-4 md:p-5 text-left">
                        <Button
                          onClick={() => handleToggleStatus(user.id, isActive)}
                          variant="ghost"
                          className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              : "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5 ml-1" />
                              مسدودسازی
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 ml-1" />
                              فعال‌سازی مجدد
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
