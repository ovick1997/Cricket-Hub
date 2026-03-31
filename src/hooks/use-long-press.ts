import { useRef, useCallback } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const firedRef = useRef(false);
  const activeRef = useRef(false);

  const start = useCallback(() => {
    firedRef.current = false;
    activeRef.current = true;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!firedRef.current && activeRef.current && onClick) {
      onClick();
    }
    activeRef.current = false;
  }, [onClick]);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activeRef.current = false;
    },
  };
}
