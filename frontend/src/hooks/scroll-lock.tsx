"use client";

import { useEffect } from "react";

// WeakMap to track number of active locks per element
// This ensures multiple locks on the same container don’t interfere with each other
const counter = new WeakMap<HTMLElement, number>();

// Currently, this only toggles `overflow: hidden` on the target container.
// Ideally, we could support locking any scrollable container and handle scoped overlays or popups.
// However, emulating `position: fixed` relative to non-body containers is tricky.
// To keep the API simple, the hook currently only accepts a raw HTMLElement.
export function useScrollLock(active: boolean, container?: HTMLElement) {
  useEffect(() => {
    if (!active) return;
    const target = container ?? document.body;

    // Increment lock count
    const count = (counter.get(target) ?? 0) + 1;
    counter.set(target, count);
    // Apply overflow: hidden only if this is the first lock
    if (count === 1) target.style.overflow = "hidden";

    return () => {
      // Decrement lock count
      const count = (counter.get(target) ?? 1) - 1;
      counter.set(target, count);
      // Last lock released → reset styles
      if (count <= 0) target.style.overflow = "";
    };
  }, [active, container]);
}
