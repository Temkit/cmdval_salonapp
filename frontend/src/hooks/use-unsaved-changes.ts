"use client";

import { useEffect } from "react";

/**
 * Warns user before leaving page with unsaved changes.
 * Attaches beforeunload event when isDirty is true.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message = "Vous avez des modifications non enregistrees. Voulez-vous vraiment quitter?"
) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);
}
