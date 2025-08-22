import { elementRegistry } from './ElementRegistry';
import { CountdownTimerElement } from './CountdownTimerElement';
import { SocialLinksElement } from './SocialLinksElement';
import { Clock, Users } from 'lucide-react';

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

  elementRegistry.register({
    id: 'social-links',
    name: 'Social Links',
    category: 'marketing',
    icon: Users,
    component: SocialLinksElement,
    defaultContent: {
      title: '',
      platforms: {
        facebook: true,
        twitter: true,
        instagram: true,
        linkedin: true,
        youtube: false,
        github: false,
      },
      links: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        github: '',
      },
      layout: 'horizontal',
      buttonVariant: 'outline',
      buttonSize: 'default',
      showIcons: true,
      showLabels: false,
      iconSpacing: 'normal'
    },
    description: 'Add custom social media profile links with icons'
  });
};