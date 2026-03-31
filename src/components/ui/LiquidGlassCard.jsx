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
  const config = {
    subtle: { gradient: 0.15, highlight: 0.8, glow: 0.12 },
    medium: { gradient: 0.22, highlight: 0.9, glow: 0.18 },
    strong: { gradient: 0.30, highlight: 1, glow: 0.25 }
  };
  const { gradient, highlight, glow } = config[intensity] || config.subtle;

  return (
    <>
      {/* Gradient overlay - top-left bright corner */}
      <div 
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,${gradient}) 0%, rgba(255,255,255,${gradient * 0.3}) 30%, transparent 60%)`,
          zIndex: 1
        }}
      />
      {/* Top edge highlight - prominent "glass shine" */}
      <div 
        className="absolute top-0 left-[5%] right-[5%] h-[2px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${highlight}) 25%, rgba(255,255,255,1) 50%, rgba(255,255,255,${highlight}) 75%, transparent 100%)`,
          zIndex: 2
        }}
      />
      {/* Inner edge glow */}
      <div 
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          boxShadow: `inset 0 2px 4px rgba(255,255,255,${glow}), inset 0 0 20px rgba(255,255,255,${glow * 0.5})`,
          zIndex: 1
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