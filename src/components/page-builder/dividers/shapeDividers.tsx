import React from 'react';

export interface ShapeDividerProps {
  color?: string;
  height?: number;
  flip?: boolean;
  invert?: boolean;
}

// Wave-Style Dividers
export const SmoothWave: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 C300,120 600,0 900,60 C1050,90 1200,30 1200,60 L1200,120 L0,120 Z" />
  </svg>
);

export const DoubleWave: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 L1200,120 L0,120 Z" />
    <path d="M0,80 C200,40 400,120 600,80 C800,40 1000,120 1200,80 L1200,120 L0,120 Z" opacity="0.7" />
  </svg>
);

export const MountainWave: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 L200,20 L400,80 L600,10 L800,90 L1000,30 L1200,60 L1200,120 L0,120 Z" />
  </svg>
);

// Diagonal & Slant Dividers
export const AngleLeft: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,0 L1200,120 L1200,0 Z" />
  </svg>
);

export const AngleRight: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,120 L1200,0 L1200,120 Z" />
  </svg>
);

export const TiltedCut: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,40 L1200,80 L1200,120 L0,120 Z" />
  </svg>
);

// Curved Dividers
export const TopCurve: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 C300,0 600,0 900,60 C1050,90 1200,30 1200,60 L1200,120 L0,120 Z" />
  </svg>
);

export const BottomCurve: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,0 L1200,0 L1200,60 C1050,30 900,90 600,60 C300,0 0,0 0,60 Z" />
  </svg>
);

export const HalfCircle: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 C0,26.9 26.9,0 60,0 L1140,0 C1173.1,0 1200,26.9 1200,60 L1200,120 L0,120 Z" />
  </svg>
);

// Geometric Dividers
export const Triangle: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,0 L600,120 L1200,0 Z" />
  </svg>
);

export const Polygon: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 L200,20 L400,80 L600,10 L800,90 L1000,30 L1200,60 L1200,120 L0,120 Z" />
  </svg>
);

export const Chevron: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 L200,0 L400,60 L600,0 L800,60 L1000,0 L1200,60 L1200,120 L0,120 Z" />
  </svg>
);

// Organic/Creative Dividers
export const Clouds: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 C50,40 100,80 150,60 C200,40 250,80 300,60 C350,40 400,80 450,60 C500,40 550,80 600,60 C650,40 700,80 750,60 C800,40 850,80 900,60 C950,40 1000,80 1050,60 C1100,40 1150,80 1200,60 L1200,120 L0,120 Z" />
  </svg>
);

export const Drops: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 C100,20 200,100 300,60 C400,20 500,100 600,60 C700,20 800,100 900,60 C1000,20 1100,100 1200,60 L1200,120 L0,120 Z" />
  </svg>
);

export const Zigzag: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 L100,20 L200,80 L300,40 L400,100 L500,60 L600,20 L700,80 L800,40 L900,100 L1000,60 L1100,20 L1200,80 L1200,120 L0,120 Z" />
  </svg>
);

// Pattern & Texture Dividers
export const DotsLine: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <circle cx="100" cy="60" r="8" />
    <circle cx="300" cy="60" r="8" />
    <circle cx="500" cy="60" r="8" />
    <circle cx="700" cy="60" r="8" />
    <circle cx="900" cy="60" r="8" />
    <circle cx="1100" cy="60" r="8" />
    <rect x="0" y="60" width="1200" height="60" />
  </svg>
);

export const BrushStroke: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 C150,30 300,90 450,50 C600,10 750,70 900,40 C1050,10 1200,50 1200,60 L1200,120 L0,120 Z" />
  </svg>
);

export const GrungeTear: React.FC<ShapeDividerProps> = ({ color = 'currentColor', height = 100, flip = false, invert = false }) => (
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: `${height}px`,
      transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`,
      fill: color
    }}
  >
    <path d="M0,60 L50,40 L100,80 L150,20 L200,90 L250,30 L300,70 L350,10 L400,85 L450,25 L500,75 L550,15 L600,80 L650,35 L700,90 L750,45 L800,70 L850,20 L900,85 L950,40 L1000,75 L1050,25 L1100,80 L1150,30 L1200,60 L1200,120 L0,120 Z" />
  </svg>
);

// Divider registry for easy access
export const shapeDividers = {
  'smooth-wave': SmoothWave,
  'double-wave': DoubleWave,
  'mountain-wave': MountainWave,
  'angle-left': AngleLeft,
  'angle-right': AngleRight,
  'tilted-cut': TiltedCut,
  'top-curve': TopCurve,
  'bottom-curve': BottomCurve,
  'half-circle': HalfCircle,
  'triangle': Triangle,
  'polygon': Polygon,
  'chevron': Chevron,
  'clouds': Clouds,
  'drops': Drops,
  'zigzag': Zigzag,
  'dots-line': DotsLine,
  'brush-stroke': BrushStroke,
  'grunge-tear': GrungeTear,
} as const;

export type ShapeDividerType = keyof typeof shapeDividers;

// Divider categories for organization
export const dividerCategories = {
  'Wave-Style': ['smooth-wave', 'double-wave', 'mountain-wave'],
  'Diagonal & Slant': ['angle-left', 'angle-right', 'tilted-cut'],
  'Curved': ['top-curve', 'bottom-curve', 'half-circle'],
  'Geometric': ['triangle', 'polygon', 'chevron'],
  'Organic/Creative': ['clouds', 'drops', 'zigzag'],
  'Pattern & Texture': ['dots-line', 'brush-stroke', 'grunge-tear'],
} as const;
