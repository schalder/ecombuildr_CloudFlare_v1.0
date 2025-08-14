import { 
  Check, 
  Circle, 
  Square, 
  Star, 
  Heart, 
  Home, 
  User, 
  Settings, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Search, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  ShoppingCart, 
  Bookmark,
  Pin,
  Flame,
  Leaf,
  Bell
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type IconOption = {
  name: string;
  label: string;
  icon: LucideIcon;
};

export const ICON_OPTIONS: IconOption[] = [
  { name: 'check', label: 'Check', icon: Check },
  { name: 'circle', label: 'Circle', icon: Circle },
  { name: 'square', label: 'Square', icon: Square },
  { name: 'star', label: 'Star', icon: Star },
  { name: 'heart', label: 'Heart', icon: Heart },
  { name: 'home', label: 'Home', icon: Home },
  { name: 'user', label: 'User', icon: User },
  { name: 'settings', label: 'Settings', icon: Settings },
  { name: 'mail', label: 'Mail', icon: Mail },
  { name: 'phone', label: 'Phone', icon: Phone },
  { name: 'map-pin', label: 'Location', icon: MapPin },
  { name: 'calendar', label: 'Calendar', icon: Calendar },
  { name: 'clock', label: 'Clock', icon: Clock },
  { name: 'search', label: 'Search', icon: Search },
  { name: 'plus', label: 'Plus', icon: Plus },
  { name: 'minus', label: 'Minus', icon: Minus },
  { name: 'x', label: 'Close', icon: X },
  { name: 'chevron-right', label: 'Arrow Right', icon: ChevronRight },
  { name: 'shopping-cart', label: 'Shopping Cart', icon: ShoppingCart },
  { name: 'bookmark', label: 'Bookmark', icon: Bookmark },
  { name: 'pin', label: 'Pin', icon: Pin },
  { name: 'flame', label: 'Fire', icon: Flame },
  { name: 'leaf', label: 'Leaf', icon: Leaf },
  { name: 'bell', label: 'Bell', icon: Bell }
];

export const ICONS_MAP: Record<string, LucideIcon> = ICON_OPTIONS.reduce((acc, option) => {
  acc[option.name] = option.icon;
  return acc;
}, {} as Record<string, LucideIcon>);