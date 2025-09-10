import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const element = document.getElementById(location.hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  return null;
};