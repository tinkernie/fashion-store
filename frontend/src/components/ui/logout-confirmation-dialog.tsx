"use client"

import * as React from "react"
import { LogOut } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export interface LogoutConfirmationDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm?: () => void | Promise<void>
  trigger?: React.ReactNode
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  trigger,
  title = "خروج از حساب کاربری",
  description = "آیا برای خروج از حساب کاربری خود اطمینان دارید؟ در هر زمان می‌توانید مجدداً وارد شوید.",
  confirmText = "بله، خروج",
  cancelText = "انصراف",
  isLoading = false,
}: LogoutConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (onConfirm) {
      await onConfirm()
    }
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm rounded-2xl border border-border bg-card text-card-foreground shadow-2xl" dir="rtl">
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          {/* MAVi Mediterranean Azure Brand Icon Badge */}
          <div className="flex size-14 items-center justify-center rounded-full bg-mavi-50 text-mavi-600 border border-mavi-100 dark:bg-mavi-950/80 dark:text-mavi-400 dark:border-mavi-900 shadow-sm transition-transform duration-200">
            <LogOut className="size-6 rtl:rotate-180" />
          </div>
          <AlertDialogTitle className="text-center font-bold text-base md:text-lg text-foreground font-sans">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="p-0 text-center font-normal text-sm text-muted-foreground font-sans leading-relaxed">
            {description}
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter className="grid w-full flex-none grid-cols-2 gap-0 divide-x rtl:divide-x-reverse border-t border-border py-0">
          <AlertDialogCancel
            className="h-12 w-full rounded-none border-0 p-0 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors m-0"
            disabled={isLoading}
          >
            {cancelText}
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleConfirm}
            className="h-12 w-full rounded-none border-0 p-0 text-sm font-bold text-mavi-600 hover:bg-mavi-50 hover:text-mavi-700 dark:text-mavi-400 dark:hover:bg-mavi-950/50 dark:hover:text-mavi-300 transition-colors"
            variant="ghost"
            disabled={isLoading}
          >
            {isLoading ? "در حال خروج..." : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LogoutConfirmationDialog
