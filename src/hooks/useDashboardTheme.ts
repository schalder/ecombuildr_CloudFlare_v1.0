import { useTheme } from '@/contexts/ThemeContext';

export const useDashboardTheme = () => {
  const { theme } = useTheme();
  
  return {
    theme,
    dashboardThemeClass: theme === 'dark' ? 'dark' : '',
  };
};
