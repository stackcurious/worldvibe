// src/hooks/use-intersection-observer.ts

import { RefObject, useEffect, useState } from 'react';

interface UseIntersectionObserverOptions {
  /**
   * The element to observe
   */
  target: RefObject<Element>;
  
  /**
   * Callback fired when the element intersects with the viewport
   */
  onIntersect: () => void;
  
  /**
   * The minimum ratio of the target's visibility to consider it visible
   * @default 0.1
   */
  threshold?: number | number[];
  
  /**
   * Margin around the root. Can have values similar to the CSS margin property
   * @default '0px'
   */
  rootMargin?: string;
  
  /**
   * The element that is used as the viewport for checking visibility
   * @default null (browser viewport)
   */
  root?: RefObject<Element> | null;
  
  /**
   * Whether the intersection observer should be enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Only trigger onIntersect once
   * @default false 
   */
  once?: boolean;
}

/**
 * A React hook that uses the Intersection Observer API to detect when an element
 * is visible in the viewport.
 * 
 * @example
 * ```tsx
 * const bottomRef = useRef<HTMLDivElement>(null);
 * const isVisible = useIntersectionObserver({
 *   target: bottomRef,
 *   onIntersect: loadMoreItems,
 *   threshold: 0.5,
 * });
 * 
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} data={item} />)}
 *     <div ref={bottomRef}>Loading more...</div>
 *   </div>
 * );
 * ```
 */
export function useIntersectionObserver({
  target,
  onIntersect,
  threshold = 0.1,
  rootMargin = '0px',
  root = null,
  enabled = true,
  once = false,
}: UseIntersectionObserverOptions): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    // Don't observe if hook is disabled or target doesn't exist
    if (!enabled || !target.current) {
      return;
    }

    let observer: IntersectionObserver;
    let hasTriggered = false;

    // Check if IntersectionObserver is available (for SSR and old browsers)
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsIntersecting(entry.isIntersecting);
            
            if (entry.isIntersecting) {
              // Trigger the callback
              if (!once || (once && !hasTriggered)) {
                onIntersect();
                hasTriggered = true;
              }
              
              // If once is true, unobserve the target after it intersects
              if (once && target.current) {
                observer.unobserve(target.current);
              }
            }
          });
        },
        { 
          threshold, 
          rootMargin,
          root: root?.current || null 
        }
      );

      if (target.current) {
        observer.observe(target.current);
      }
    } else {
      // Fallback behavior for environments without IntersectionObserver
      console.warn('IntersectionObserver is not supported in this environment. Consider using a polyfill.');
      // Simulate visibility to ensure functionality continues
      setIsIntersecting(true);
      onIntersect();
    }

    return () => {
      if (observer) {
        if (target.current) {
          observer.unobserve(target.current);
        }
        observer.disconnect();
      }
    };
  }, [target, enabled, onIntersect, threshold, rootMargin, root, once]);

  return isIntersecting;
}