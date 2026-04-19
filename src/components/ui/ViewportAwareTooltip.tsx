import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

interface ViewportAwareTooltipProps {
  children: ReactNode;
  className: string;
  margin?: number;
}

export function ViewportAwareTooltip({
  children,
  className,
  margin = 16,
}: ViewportAwareTooltipProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shiftRef = useRef({ x: 0, y: 0 });
  const [shift, setShift] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    let animationFrame = 0;
    const timers: number[] = [];

    const updateShift = () => {
      const element = ref.current;
      if (!element) return;

      const previousTransform = element.style.transform;
      element.style.transform = "translate3d(0, 0, 0)";
      const rect = element.getBoundingClientRect();
      element.style.transform = previousTransform;

      let x = 0;
      let y = 0;

      if (rect.right > window.innerWidth - margin) {
        x = window.innerWidth - margin - rect.right;
      }
      if (rect.left + x < margin) {
        x += margin - (rect.left + x);
      }
      if (rect.bottom > window.innerHeight - margin) {
        y = window.innerHeight - margin - rect.bottom;
      }
      if (rect.top + y < margin) {
        y += margin - (rect.top + y);
      }

      const current = shiftRef.current;
      if (Math.abs(current.x - x) >= 1 || Math.abs(current.y - y) >= 1) {
        shiftRef.current = { x, y };
        setShift({ x, y });
      }
    };

    updateShift();
    animationFrame = window.requestAnimationFrame(updateShift);
    [50, 150, 300, 450].forEach((delay) => {
      timers.push(window.setTimeout(updateShift, delay));
    });
    window.addEventListener("resize", updateShift);
    window.addEventListener("scroll", updateShift, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", updateShift);
      window.removeEventListener("scroll", updateShift, true);
    };
  }, [children, margin]);

  return (
    <div
      ref={ref}
      className={`chart-tooltip ${className}`}
      style={{
        maxWidth: `calc(100vw - ${margin * 2}px)`,
        transform: `translate3d(${shift.x}px, ${shift.y}px, 0)`,
      }}
    >
      {children}
    </div>
  );
}
