"use client";

import { useEffect, useRef, useState } from 'react';

export function useInViewLocal(options?: IntersectionObserverInit): { ref: (node: any) => void; inView: boolean } {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setInView(entry.isIntersecting);
    }, options);

    if (nodeRef.current) observerRef.current.observe(nodeRef.current);
    return () => observerRef.current?.disconnect();
  }, [options]);

  const ref = (node: any) => {
    nodeRef.current = node as Element | null;
    if (node && observerRef.current) observerRef.current.observe(node);
  };

  return { ref, inView };
}

export default useInViewLocal;


