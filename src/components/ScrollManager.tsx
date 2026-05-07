import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const positions = new Map<string, number>();

export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType(); // POP | PUSH | REPLACE
  const prevKey = useRef<string>(location.key);

  // Save scroll position before leaving the current location
  useEffect(() => {
    const handler = () => {
      positions.set(prevKey.current, window.scrollY);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    // Save the previous one explicitly too
    if (navType === "POP") {
      const y = positions.get(location.key) ?? 0;
      requestAnimationFrame(() => window.scrollTo(0, y));
    } else {
      window.scrollTo(0, 0);
    }
    prevKey.current = location.key;
  }, [location.key, navType]);

  return null;
}
