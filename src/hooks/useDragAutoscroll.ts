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

    const container = containerRef.current;
    
    const handleWheel = (e: WheelEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        
        // Clear any existing scroll timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Scroll the container
        container.scrollBy({
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

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isScrollingRef.current) return;

      const rect = container.getBoundingClientRect();
      const scrollZone = 100; // pixels from edge to trigger scroll
      const scrollSpeed = 5;
      
      // Check if mouse is near edges
      const nearTop = e.clientY - rect.top < scrollZone;
      const nearBottom = rect.bottom - e.clientY < scrollZone;
      
      if (nearTop && container.scrollTop > 0) {
        container.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
      } else if (nearBottom && container.scrollTop < container.scrollHeight - container.clientHeight) {
        container.scrollBy({ top: scrollSpeed, behavior: 'auto' });
      }
    };

    // Add event listeners
    container.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isDragging, containerRef]);

  return { isDragging };
};