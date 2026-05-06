import { useEffect, useState } from "react";

/**
 * Returns true while the user is actively scrolling DOWN past the threshold.
 * Returns false at the top of the page or while scrolling up.
 */
export function useHideOnScroll(threshold = 32) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const dy = y - lastY;

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
