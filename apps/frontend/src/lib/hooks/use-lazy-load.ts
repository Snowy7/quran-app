import { useRef, useState, useEffect } from 'react';

interface UseLazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

/**
 * Hook that uses IntersectionObserver to detect when an element
 * enters the viewport. Once visible, stays visible (no unloading).
 */
export function useLazyLoad(options: UseLazyLoadOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin ?? '200px 0px',
        threshold: options.threshold ?? 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, options.rootMargin, options.threshold]);

  return { ref, isVisible };
}
