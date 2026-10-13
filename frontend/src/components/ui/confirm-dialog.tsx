"use client"

import * as React from "react"
import { AlertTriangle, Trash2, HelpCircle } from "lucide-react"
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

export interface ConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm?: () => void | Promise<void>
  trigger?: React.ReactNode
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "mavi" | "warning"
  icon?: React.ReactNode
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  trigger,
  title,
  description,
  confirmText = "تأیید",
  cancelText = "انصراف",
  variant = "destructive",
  icon,
  isLoading = false,
}: ConfirmDialogProps) {
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

  const renderBadge = () => {
    if (icon) {
      return (
        <div className="flex size-14 items-center justify-center rounded-full bg-muted border border-border shadow-sm">
          {icon}
        </div>
      )
    }

    if (variant === "destructive") {
      return (
        <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900 shadow-sm">
          <Trash2 className="size-6" />
        </div>
      )
    }

    if (variant === "warning") {
      return (
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900 shadow-sm">
          <AlertTriangle className="size-6" />
        </div>
      )
    }

    // Default MAVi Azure
    return (
      <div className="flex size-14 items-center justify-center rounded-full bg-mavi-50 text-mavi-600 border border-mavi-100 dark:bg-mavi-950/80 dark:text-mavi-400 dark:border-mavi-900 shadow-sm">
        <HelpCircle className="size-6" />
      </div>
    )
  }

  const confirmButtonClass =
    variant === "destructive"
      ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
      : "text-mavi-600 hover:bg-mavi-50 hover:text-mavi-700 dark:text-mavi-400 dark:hover:bg-mavi-950/50 dark:hover:text-mavi-300"

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-sm rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
        dir="rtl"
      >
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          {renderBadge()}
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
            className={`h-12 w-full rounded-none border-0 p-0 text-sm font-bold transition-colors ${confirmButtonClass}`}
            variant="ghost"
            disabled={isLoading}
          >
            {isLoading ? "در حال انجام..." : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
