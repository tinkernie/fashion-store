import React from "react";
import { cn } from "@/lib/utils";

export interface HoneycombLoaderProps {
  className?: string;
  color?: string;
  size?: "sm" | "default" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export const HoneycombLoader: React.FC<HoneycombLoaderProps> = ({
  className,
  color = "text-white",
  size = "default",
  text,
  fullScreen = false,
}) => {
  const scaleMap = {
    sm: "scale-75",
    default: "scale-100",
    lg: "scale-125",
  };

  const loader = (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      <div className={cn("honeycomb", color, scaleMap[size])}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && (
        <p className="text-xs md:text-sm font-medium text-zinc-400 animate-pulse tracking-wide mt-2">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md">
        {loader}
      </div>
    );
  }

  return loader;
};

// Aliased export as requested in component snippet
export const Component = HoneycombLoader;
export default HoneycombLoader;
