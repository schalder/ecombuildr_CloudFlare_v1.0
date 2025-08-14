import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faCircle,
  faSquare,
  faChevronRight,
  faAngleRight,
  faAnglesRight,
  faArrowRight,
  faArrowRightLong,
  faCaretRight,
  faStar,
  faHeart,
  faPlus,
  faMinus,
  faBolt,
  faCircleCheck,
  faSquareCheck,
  faCircleDot,
  faTriangleExclamation,
  faThumbtack,
  faFire,
  faLeaf,
  faBell,
} from '@fortawesome/free-solid-svg-icons';

export type IconOption = {
  name: string;
  label: string;
  icon: IconDefinition;
};

export const ICON_OPTIONS: IconOption[] = [
  { name: 'check', label: 'Check', icon: faCheck },
  { name: 'circle', label: 'Circle', icon: faCircle },
  { name: 'square', label: 'Square', icon: faSquare },
  { name: 'chevron-right', label: 'Chevron Right', icon: faChevronRight },
  { name: 'angle-right', label: 'Angle Right', icon: faAngleRight },
  { name: 'angles-right', label: 'Angles Right', icon: faAnglesRight },
  { name: 'arrow-right', label: 'Arrow Right', icon: faArrowRight },
  { name: 'arrow-right-long', label: 'Arrow Right Long', icon: faArrowRightLong },
  { name: 'caret-right', label: 'Caret Right', icon: faCaretRight },
  { name: 'star', label: 'Star', icon: faStar },
  { name: 'heart', label: 'Heart', icon: faHeart },
  { name: 'plus', label: 'Plus', icon: faPlus },
  { name: 'minus', label: 'Minus', icon: faMinus },
  { name: 'bolt', label: 'Bolt', icon: faBolt },
  { name: 'circle-check', label: 'Circle Check', icon: faCircleCheck },
  { name: 'square-check', label: 'Square Check', icon: faSquareCheck },
  { name: 'circle-dot', label: 'Circle Dot', icon: faCircleDot },
  { name: 'triangle-exclamation', label: 'Warning', icon: faTriangleExclamation },
  { name: 'thumbtack', label: 'Pin', icon: faThumbtack },
  { name: 'fire', label: 'Fire', icon: faFire },
  { name: 'leaf', label: 'Leaf', icon: faLeaf },
  { name: 'bell', label: 'Bell', icon: faBell },
];

export const ICONS_MAP: Record<string, IconDefinition> = ICON_OPTIONS.reduce((acc, opt) => {
  acc[opt.name] = opt.icon;
  return acc;
}, {} as Record<string, IconDefinition>);
