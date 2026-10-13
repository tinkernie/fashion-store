"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuthModal } from "@/store/auth-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AuthRequiredDialog() {
  const router = useRouter();
  const { isOpen, message, redirectUrl, closeAuthModal } = useAuthModal();

  const handleConfirm = () => {
    closeAuthModal();
    const targetRedirect =
      redirectUrl ||
      (typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/");
    router.push(`/auth?redirect=${encodeURIComponent(targetRedirect)}`);
  };

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeAuthModal();
      }}
      title="ورود به حساب کاربری"
      description={message}
      confirmText="ورود به حساب کاربری"
      cancelText="لغو"
      variant="mavi"
      icon={<Heart className="size-6 text-[#0082CA]" />}
      onConfirm={handleConfirm}
    />
  );
}

export default AuthRequiredDialog;
