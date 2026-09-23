import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Desktop uses one logical layout; mobile keeps its existing responsive layout. */
export default function ParkViewport({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = viewport.current!;
    const update = () => {
      const width = element.clientWidth;
      element.style.setProperty('--park-scale', String(width > 760 ? width / 1440 : 1));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="park-viewport" ref={viewport}>{children}</div>;
}
