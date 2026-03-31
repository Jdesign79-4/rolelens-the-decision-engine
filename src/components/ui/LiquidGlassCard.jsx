import React from 'react';
import { cn } from '@/lib/utils';

/**
 * LiquidGlassCard - A subtle glass morphism card wrapper
 * Blends with the existing warm neumorphic aesthetic
 * 
 * Usage: <LiquidGlassCard className="p-4">Content</LiquidGlassCard>
 */
export default function LiquidGlassCard({ 
  children, 
  className,
  intensity = 'subtle', // 'subtle' | 'medium' | 'strong'
  glowColor = 'neutral', // 'neutral' | 'success' | 'warning' | 'info'
  isDark = false,
  style,
  ...props 
}) {
  const intensityClasses = {
    subtle: 'liquid-glass-subtle',
    medium: 'liquid-glass-medium',
    strong: 'liquid-glass-strong'
  };

  const glowClasses = {
    neutral: '',
    success: 'liquid-glass-glow-success',
    warning: 'liquid-glass-glow-warning',
    info: 'liquid-glass-glow-info'
  };

  return (
    <div
      className={cn(
        'liquid-glass-card',
        intensityClasses[intensity],
        glowClasses[glowColor],
        isDark && 'liquid-glass-dark',
        className
      )}
      style={style}
      {...props}
    >
      {/* Inner glass reflection layer */}
      <div className="liquid-glass-reflection" aria-hidden="true" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* SVG Filter for subtle distortion - only rendered once */}
      <LiquidGlassFilter />
    </div>
  );
}

/**
 * Inline wrapper for existing cards - applies glass overlay without restructuring
 */
export function LiquidGlassOverlay({ intensity = 'subtle' }) {
  const opacityMap = {
    subtle: 0.03,
    medium: 0.06,
    strong: 0.10
  };

  return (
    <>
      <div 
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,${opacityMap[intensity]}) 0%, transparent 50%, rgba(255,255,255,${opacityMap[intensity] * 0.5}) 100%)`,
          backdropFilter: 'blur(0.5px)',
        }}
      />
      <div 
        className="absolute top-0 left-0 right-0 h-px rounded-t-[inherit] pointer-events-none z-0"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.4) 50%, transparent 90%)'
        }}
      />
    </>
  );
}

function LiquidGlassFilter() {
  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <defs>
        <filter
          id="liquid-glass-filter"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.02"
            numOctaves="1"
            seed="2"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="1" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.3" result="finalBlur" />
          <feComposite in="finalBlur" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}