import React from "react";
import { cn } from "@/lib/utils";

interface MaviWordmarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  badge?: boolean;
}

/**
 * MAVi Signature Geometric Wordmark
 * Exact architectural typography:
 * - Straight vertical stem 'M' with 50% apex
 * - Crossbarless Lambda 'Λ'
 * - Inverted chevron 'V'
 * - Lowercase 'i' with detached square tittle aligned to cap-height
 */
export function MaviWordmark({ className, badge = false, ...props }: MaviWordmarkProps) {
  if (badge) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-2xl bg-[#0082CA] p-2 sm:p-2.5 shadow-md shadow-[#0082CA]/25 shrink-0",
          className
        )}
      >
        <svg
          viewBox="0 0 146 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto text-white overflow-visible"
          aria-label="MAVi"
          role="img"
          {...props}
        >
          {/* M */}
          <path
            d="M 0 0 L 0 40 L 7.1 40 L 7.1 14.5 L 19.7 24.5 L 32.3 14.5 L 32.3 40 L 39.4 40 L 39.4 0 L 32.3 0 L 19.7 10.5 L 7.1 0 Z"
            fill="currentColor"
          />
          {/* Λ (Crossbarless A) */}
          <path
            d="M 50.5 40 L 70.6 0 L 90.7 40 L 83.6 40 L 70.6 15.5 L 57.6 40 Z"
            fill="currentColor"
          />
          {/* V */}
          <path
            d="M 88.2 0 L 95.3 0 L 108.2 24.5 L 121.1 0 L 128.2 0 L 108.2 40 Z"
            fill="currentColor"
          />
          {/* i (Square dot + lowercase vertical stem) */}
          <rect x="138.8" y="0" width="7.1" height="7.1" fill="currentColor" />
          <rect x="138.8" y="13.5" width="7.1" height="26.5" fill="currentColor" />
        </svg>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 146 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-auto inline-block select-none overflow-visible shrink-0", className)}
      aria-label="MAVi"
      role="img"
      {...props}
    >
      {/* M */}
      <path
        d="M 0 0 L 0 40 L 7.1 40 L 7.1 14.5 L 19.7 24.5 L 32.3 14.5 L 32.3 40 L 39.4 40 L 39.4 0 L 32.3 0 L 19.7 10.5 L 7.1 0 Z"
        fill="currentColor"
      />
      {/* Λ (Crossbarless A) */}
      <path
        d="M 50.5 40 L 70.6 0 L 90.7 40 L 83.6 40 L 70.6 15.5 L 57.6 40 Z"
        fill="currentColor"
      />
      {/* V */}
      <path
        d="M 88.2 0 L 95.3 0 L 108.2 24.5 L 121.1 0 L 128.2 0 L 108.2 40 Z"
        fill="currentColor"
      />
      {/* i (Square dot + lowercase vertical stem) */}
      <rect x="138.8" y="0" width="7.1" height="7.1" fill="currentColor" />
      <rect x="138.8" y="13.5" width="7.1" height="26.5" fill="currentColor" />
    </svg>
  );
}

export default MaviWordmark;
