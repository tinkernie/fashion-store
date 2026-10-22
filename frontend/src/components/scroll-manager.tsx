"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollManager guarantees that page refreshes and initial visits always start
 * at the top of the viewport (0, 0), overriding the browser's default scroll restoration
 * which can cause awkward middle-page jumps during asynchronous data hydration.
 */
export default function ScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    // Disable browser automatic scroll restoration across reloads
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Reset scroll to top on initial mount
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // Ensure scroll position is reset to (0, 0) right before any page reload
    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Ensure route transitions reset scroll position to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
