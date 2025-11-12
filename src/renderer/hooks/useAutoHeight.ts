import { useEffect, useRef, useState } from "react";

/**
 * Smoothly animates a container's height to match its content using ResizeObserver.
 * Returns container props and a ref for the content element whose height should drive the container.
 */
export function useAutoHeight(initialHeight = 140) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>(initialHeight);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const update = () => {
      const next = contentEl.getBoundingClientRect().height;
      setHeight(Math.max(initialHeight, Math.ceil(next)));
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(contentEl);

    return () => {
      ro.disconnect();
    };
  }, [initialHeight]);

  const containerStyle: React.CSSProperties = {
    height,
    transition: "height 200ms ease",
  };

  return { containerRef, contentRef, height, containerStyle };
}


