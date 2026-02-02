"use client";

import { useCallback } from "react";

/**
 * Scrolls to the first element with aria-invalid="true" and focuses it.
 */
export function useScrollToError() {
  const scrollToFirstError = useCallback(() => {
    const firstInvalid = document.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalid.focus({ preventScroll: true });
    }
  }, []);

  return { scrollToFirstError };
}
