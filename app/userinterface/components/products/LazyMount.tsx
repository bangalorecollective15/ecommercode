// app/userinterface/components/products/LazyMount.tsx
"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface LazyMountProps {
  children: ReactNode;
  placeholder: ReactNode;
  rootMargin?: string;
}

// Defers mounting `children` (and therefore hydrating/wiring up its handlers)
// until it's within `rootMargin` of the viewport. First N cards (priority ones)
// should skip this entirely and mount immediately.
export default function LazyMount({ children, placeholder, rootMargin = "600px" }: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender, rootMargin]);

  return <div ref={ref}>{shouldRender ? children : placeholder}</div>;
}