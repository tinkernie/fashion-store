"use client";
import { type HTMLAttributes, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const bannerButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type BannerVariant = "rainbow" | "normal";

export function Banner({
  id,
  xColor,
  variant = "normal",
  changeLayout = true,
  height = "3rem",
  persistDismiss = false,
  rainbowColors = [
    "rgba(255,255,255,0.12)",
    "rgba(255,255,255,0.35)",
    "transparent",
    "rgba(255,255,255,0.18)",
    "transparent",
    "rgba(255,255,255,0.28)",
  ],
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  height?: string;
  xColor?: string;
  variant?: BannerVariant;
  rainbowColors?: string[];
  changeLayout?: boolean;
  persistDismiss?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const globalKey = id && persistDismiss ? `nd-banner-${id}` : null;

  useEffect(() => {
    if (globalKey) {
      const isDismissed = localStorage.getItem(globalKey) === "true";
      if (isDismissed) {
        setOpen(false);
      }
    }
  }, [globalKey]);

  if (!open) return null;

  return (
    <div
      id={id}
      {...props}
      className={cn(
        "relative z-40 flex flex-row items-center justify-center px-4 text-center text-sm font-medium overflow-hidden transition-all duration-300",
        variant === "normal" && "bg-zinc-900 text-zinc-100 border-b border-white/10",
        variant === "rainbow" && "bg-black/60 text-white backdrop-blur-md border-b border-white/10",
        props.className,
      )}
      style={{
        height,
      }}
    >
      {variant === "rainbow"
        ? flow({
            colors: rainbowColors,
          })
        : null}
      {props.children}
      {id ? (
        <button
          type="button"
          aria-label="Close Banner"
          onClick={() => {
            setOpen(false);
            if (globalKey) {
              localStorage.setItem(globalKey, "true");
              window.dispatchEvent(new Event("banner-status-changed"));
            }
          }}
          className={cn(
            bannerButtonVariants({
              variant: "ghost",
              className:
                "absolute cursor-pointer end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full",
              size: "icon",
            }),
          )}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function flow({
  colors,
}: {
  colors: string[];
}) {
  return (
    <div
      className="absolute inset-0 -z-10 animate-banner-flow pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export default Banner;
