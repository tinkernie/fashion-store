import { create } from "zustand";

interface AuthModalStore {
  isOpen: boolean;
  message: string;
  redirectUrl?: string;
  openAuthModal: (message?: string, redirectUrl?: string) => void;
  closeAuthModal: () => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  message: "برای افزودن به علاقه مندی ها باید ابتدا وارد حساب کاربری خود شوید.",
  redirectUrl: undefined,
  openAuthModal: (
    message = "برای افزودن به علاقه مندی ها باید ابتدا وارد حساب کاربری خود شوید.",
    redirectUrl?: string
  ) =>
    set({
      isOpen: true,
      message,
      redirectUrl,
    }),
  closeAuthModal: () => set({ isOpen: false }),
}));
