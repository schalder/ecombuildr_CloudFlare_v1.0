import { elementRegistry } from './ElementRegistry';
import { CountdownTimerElement } from './CountdownTimerElement';
import { Clock } from 'lucide-react';

// Register Marketing Elements
export const registerMarketingElements = () => {
  elementRegistry.register({
    id: 'countdown-timer',
    name: 'Countdown Timer',
    category: 'marketing',
    icon: Clock,
    component: CountdownTimerElement,
    defaultContent: {
      mode: 'evergreen',
      duration: { days: 0, hours: 0, minutes: 30, seconds: 0 },
      layout: 'boxes',
      alignment: 'center',
      separator: ':',
      showLabels: true,
      labels: {
        days: 'Days',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds'
      },
      redirectType: 'url',
      target: '_self'
    },
    description: 'Customizable countdown timer with redirect options'
  });
};