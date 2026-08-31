"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  arrowDirection?: "left" | "right";
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export const FlowButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, FlowButtonProps>(
  (
    {
      children,
      href,
      arrowDirection = "right",
      icon,
      className,
      size = "default",
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "h-9 px-4 text-xs gap-0 rounded-full",
      default: "h-12 px-6 text-sm md:text-base gap-0 rounded-full",
      lg: "h-14 px-8 text-base md:text-lg gap-0 rounded-full",
    };

    const ArrowIcon =
      icon ||
      (arrowDirection === "left" ? (
        <ArrowLeft className="w-4 h-4 shrink-0" />
      ) : (
        <ArrowRight className="w-4 h-4 shrink-0" />
      ));

    const content = (
      <>
        {/* Left Arrow: hidden initially, slides in and pushes text to the right on hover */}
        <span className="inline-flex items-center justify-center overflow-hidden w-0 opacity-0 -translate-x-3 transition-all duration-300 ease-out group-hover:w-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:mr-2">
          {ArrowIcon}
        </span>

        {/* Text */}
        <span className="whitespace-nowrap transition-transform duration-300 ease-out font-bold">
          {children}
        </span>

        {/* Right Arrow: visible initially, flies to the right and fades out on hover */}
        <span className="inline-flex items-center justify-center overflow-hidden w-4 opacity-100 translate-x-0 ml-2 transition-all duration-300 ease-out group-hover:w-0 group-hover:opacity-0 group-hover:translate-x-3 group-hover:ml-0">
          {ArrowIcon}
        </span>
      </>
    );

    const baseClasses = cn(
      "group relative inline-flex items-center justify-center select-none overflow-hidden border border-white/20 bg-[#0a0a0a] text-white shadow-md transition-all duration-300 ease-out hover:border-white hover:bg-white hover:text-black hover:shadow-2xl hover:shadow-white/10 active:scale-[0.98] cursor-pointer",
      sizeClasses[size],
      className,
    );

    if (href) {
      return (
        <Link
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={baseClasses}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={baseClasses}
        {...props}
      >
        {content}
      </button>
    );
  },
);

FlowButton.displayName = "FlowButton";

export default FlowButton;
