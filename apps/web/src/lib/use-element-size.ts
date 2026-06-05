import { useEffect, useState, type RefObject } from "react";

type ElementSize = {
  width: number;
  height: number;
};

export function useElementSize<T extends HTMLElement>(
  ref: RefObject<T | null>,
  aspectRatio = 5 / 3,
): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 640, height: Math.round(640 / aspectRatio) });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const width = Math.max(Math.round(element.clientWidth), 280);
      setSize({ width, height: Math.round(width / aspectRatio) });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, aspectRatio]);

  return size;
}
