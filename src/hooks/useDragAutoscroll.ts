import { useEffect, useRef } from 'react';
import { useDragLayer } from 'react-dnd';

export const useDragAutoscroll = (containerRef: React.RefObject<HTMLElement>) => {
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const isScrollingRef = useRef(false);

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
    
    const handleWheel = (e: WheelEvent) => {
      if (isDragging) {
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
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 100);
      }
    };

    const handleDocumentWheel = (e: WheelEvent) => {
      if (!isDragging) return;
      
      // Check if mouse is over the canvas area
      const rect = containerRef.current!.getBoundingClientRect();
      const isOverCanvas = e.clientX >= rect.left && 
                          e.clientX <= rect.right && 
                          e.clientY >= rect.top && 
                          e.clientY <= rect.bottom;
      
      if (isOverCanvas) {
        e.preventDefault();
        e.stopPropagation();
        
        scrollableElement.scrollBy({
          top: e.deltaY,
          behavior: 'auto'
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isScrollingRef.current) return;

      const rect = containerRef.current!.getBoundingClientRect();
      const scrollZone = 100; // pixels from edge to trigger scroll
      const scrollSpeed = 5;
      
      // Check if mouse is near edges
      const nearTop = e.clientY - rect.top < scrollZone;
      const nearBottom = rect.bottom - e.clientY < scrollZone;
      
      if (nearTop && scrollableElement.scrollTop > 0) {
        scrollableElement.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
      } else if (nearBottom && scrollableElement.scrollTop < scrollableElement.scrollHeight - scrollableElement.clientHeight) {
        scrollableElement.scrollBy({ top: scrollSpeed, behavior: 'auto' });
      }
    };

    // Add event listeners
    containerRef.current.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('wheel', handleDocumentWheel, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel);
      }
      document.removeEventListener('wheel', handleDocumentWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isDragging, containerRef]);

  return { isDragging };
};