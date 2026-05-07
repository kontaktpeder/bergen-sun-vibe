import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Returns true while the user is actively scrolling DOWN past the threshold.
 * Returns false at the top of the page or while scrolling up.
 * Resets to hidden on every route change so the nav reveals only after the user scrolls.
 */
export function useHideOnScroll(threshold = 32, resetOnRoute = false) {
  const [hidden, setHidden] = useState(resetOnRoute);
  const location = useLocation();

  useEffect(() => {
    if (resetOnRoute) setHidden(true);
  }, [location.pathname, resetOnRoute]);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    let interacted = false;

    const update = () => {
      const y = window.scrollY;
      const dy = y - lastY;

      if (!interacted) {
        if (Math.abs(dy) > 2) {
          interacted = true;
        } else {
          lastY = y;
          ticking = false;
          return;
        }
      }

      if (dy > 4) {
        setHidden(true);
      } else if (dy < -4 || y < threshold) {
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
