import { useEffect, useRef } from 'react';
import { useDragLayer } from 'react-dnd';

export const useDragAutoscroll = (containerRef: React.RefObject<HTMLElement>) => {
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  const scrollTimeoutRef = useRef<number>();
  const isScrollingRef = useRef(false);
  const animationFrameRef = useRef<number>();
  const isAutoScrollingRef = useRef(false);
  const lastPointerYRef = useRef<number>(0);

  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    // Find the actual scrollable element - for Radix ScrollArea, it's the viewport
    const findScrollableElement = (element: HTMLElement): HTMLElement => {
      // Check if it's a Radix ScrollArea viewport
      const viewport = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) {
        return viewport;
      }
      
      // Fallback to the container itself
      return element;
    };

    const scrollableElement = findScrollableElement(containerRef.current);
    
    // Edge-based autoscroll using requestAnimationFrame
    const startAutoScroll = () => {
      if (isAutoScrollingRef.current) return;
      
      isAutoScrollingRef.current = true;
      
      const autoScroll = () => {
        if (!isAutoScrollingRef.current || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const pointerY = lastPointerYRef.current;
        const scrollZone = 100; // pixels from edge to trigger scroll
        const maxScrollSpeed = 18; // max pixels per frame
        const minScrollSpeed = 3; // min pixels per frame
        
        // Calculate distance from edges
        const distanceFromTop = pointerY - rect.top;
        const distanceFromBottom = rect.bottom - pointerY;
        
        let scrollDirection = 0;
        let scrollSpeed = 0;
        
        if (distanceFromTop < scrollZone && distanceFromTop > 0) {
          // Near top edge - scroll up
          const proximity = 1 - (distanceFromTop / scrollZone);
          scrollSpeed = minScrollSpeed + (proximity * (maxScrollSpeed - minScrollSpeed));
          scrollDirection = -1;
        } else if (distanceFromBottom < scrollZone && distanceFromBottom > 0) {
          // Near bottom edge - scroll down
          const proximity = 1 - (distanceFromBottom / scrollZone);
          scrollSpeed = minScrollSpeed + (proximity * (maxScrollSpeed - minScrollSpeed));
          scrollDirection = 1;
        }
        
        if (scrollDirection !== 0) {
          // Check scroll boundaries
          const canScrollUp = scrollableElement.scrollTop > 0;
          const canScrollDown = scrollableElement.scrollTop < scrollableElement.scrollHeight - scrollableElement.clientHeight;
          
          if ((scrollDirection === -1 && canScrollUp) || (scrollDirection === 1 && canScrollDown)) {
            scrollableElement.scrollBy({
              top: scrollDirection * scrollSpeed,
              behavior: 'auto'
            });
          }
          
          // Continue animation
          animationFrameRef.current = requestAnimationFrame(autoScroll);
        } else {
          // No scrolling needed, stop animation
          stopAutoScroll();
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(autoScroll);
    };
    
    const stopAutoScroll = () => {
      isAutoScrollingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };

    // Handle dragover events for edge-based autoscroll
    const handleDragOver = (e: DragEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      e.preventDefault();
      lastPointerYRef.current = e.clientY;
      
      const rect = containerRef.current.getBoundingClientRect();
      const isOverCanvas = e.clientX >= rect.left && 
                          e.clientX <= rect.right && 
                          e.clientY >= rect.top && 
                          e.clientY <= rect.bottom;
      
      if (isOverCanvas) {
        const scrollZone = 100;
        const distanceFromTop = e.clientY - rect.top;
        const distanceFromBottom = rect.bottom - e.clientY;
        
        if ((distanceFromTop < scrollZone && distanceFromTop > 0) || 
            (distanceFromBottom < scrollZone && distanceFromBottom > 0)) {
          startAutoScroll();
        } else {
          stopAutoScroll();
        }
      } else {
        stopAutoScroll();
      }
    };

    // Handle drag end events
    const handleDragEnd = () => {
      stopAutoScroll();
    };

    // Keep existing wheel handlers for non-drag scenarios
    const handleWheel = (e: WheelEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Clear any existing scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Scroll the scrollable element
      scrollableElement.scrollBy({
        top: e.deltaY,
        behavior: 'auto'
      });
      
      // Set scrolling flag
      isScrollingRef.current = true;
      
      // Reset scrolling flag after a short delay
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    };

    // Add event listeners
    document.addEventListener('dragover', handleDragOver, { passive: false });
    document.addEventListener('dragend', handleDragEnd, { passive: true });
    document.addEventListener('drop', handleDragEnd, { passive: true });
    containerRef.current.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      stopAutoScroll();
      
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
      
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isDragging, containerRef]);

  return { isDragging };
};