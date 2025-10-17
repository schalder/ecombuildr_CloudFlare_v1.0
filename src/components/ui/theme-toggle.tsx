import React, { useContext } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeContext } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const themeContext = useContext(ThemeContext);
  
  // If theme context is not available, don't render anything
  if (!themeContext) {
    return null;
  }

  const { theme, toggleTheme } = themeContext;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
