import React from 'react';
import { shapeDividers, ShapeDividerType } from './shapeDividers';

export interface DividerRendererProps {
  divider: {
    type: ShapeDividerType;
    color?: string;
    height?: number;
    flip?: boolean;
    invert?: boolean;
  };
  position: 'top' | 'bottom';
}

export const DividerRenderer: React.FC<DividerRendererProps> = ({ divider, position }) => {
  const { type, color, height = 100, flip = false, invert = false } = divider;
  
  const DividerComponent = shapeDividers[type];
  
  if (!DividerComponent) {
    console.warn(`Unknown divider type: ${type}`);
    return null;
  }

  const dividerStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    height: `${height}px`,
    zIndex: 1,
    pointerEvents: 'none',
    ...(position === 'top' ? { top: 0 } : { bottom: 0 }),
  };

  return (
    <div style={dividerStyle}>
      <DividerComponent
        color={color}
        height={height}
        flip={flip}
        invert={invert}
      />
    </div>
  );
};
