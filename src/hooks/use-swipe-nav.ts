import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PAGE_ORDER = ["/", "/matches", "/scoring", "/teams", "/tournaments"];

interface UseSwipeNavOptions {
  threshold?: number;
}

export function useSwipeNav({ threshold = 100 }: UseSwipeNavOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = true;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX.current;
    const dy = endY - startY.current;

    // Only horizontal swipes (not diagonal)
    if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx) * 0.6) return;

    const currentIndex = PAGE_ORDER.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (dx < 0 && currentIndex < PAGE_ORDER.length - 1) {
      // Swipe left → next page
      navigate(PAGE_ORDER[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      // Swipe right → prev page
      navigate(PAGE_ORDER[currentIndex - 1]);
    }
  }, [navigate, location.pathname, threshold]);

  return { onTouchStart, onTouchEnd };
}
