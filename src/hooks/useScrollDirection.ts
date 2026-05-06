import { useEffect, useState } from "react";

/**
 * Returns true while the user is actively scrolling DOWN past the threshold.
 * Returns false at the top of the page or while scrolling up.
 */
export function useHideOnScroll(threshold = 32) {
  // Start hidden so the nav doesn't compete with Safari's address bar on first paint.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    let interacted = false;

    const update = () => {
      const y = window.scrollY;
      const dy = y - lastY;

      if (!interacted) {
        // Wait for the first real scroll gesture before revealing the nav.
        if (Math.abs(dy) > 2) {
          interacted = true;
        } else {
          lastY = y;
          ticking = false;
          return;
        }
      }

      if (y < threshold) {
        setHidden(false);
      } else if (dy > 4) {
        setHidden(true);
      } else if (dy < -4) {
        setHidden(false);
      }

      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
