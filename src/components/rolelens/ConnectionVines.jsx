import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Use for-loop instead of [...Array(n)].map() to avoid Radix Collection context hijacking .map()
function useIndexArray(count) {
  return useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) arr.push(i);
    return arr;
  }, [count]);
}

export default function ConnectionVines({ isActive, settings }) {
  const vineColor = settings?.riskAppetite > 0.6 
    ? 'rgba(233, 150, 122, 0.6)' 
    : 'rgba(143, 188, 143, 0.6)';

  const indices = useIndexArray(5);

  return (
    <div className="hidden lg:block fixed left-80 xl:left-96 top-0 bottom-0 w-8 pointer-events-none z-20 overflow-hidden">
      {/* Vine Lines */}
      {indices.map(i => (
        <motion.div
          key={`vine-${i}`}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: isActive ? 1 : 0,
            opacity: isActive ? 1 : 0
          }}
          transition={{ 
            duration: 0.4, 
            delay: i * 0.08,
            ease: "easeOut"
          }}
          className="absolute h-0.5 origin-left"
          style={{
            top: `${20 + i * 15}%`,
            left: 0,
            right: 0,
            background: `linear-gradient(90deg, ${vineColor}, transparent)`,
          }}
        />
      ))}

      {/* Vertical Stem */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: isActive ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute left-1 w-0.5 origin-top"
        style={{
          top: '15%',
          bottom: '15%',
          background: `linear-gradient(180deg, transparent, ${vineColor}, transparent)`,
        }}
      />

      {/* Node Points */}
      {indices.map(i => (
        <motion.div
          key={`node-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: isActive ? 1 : 0 }}
          transition={{ 
            duration: 0.3, 
            delay: 0.2 + i * 0.08,
            type: "spring",
            stiffness: 300
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            top: `${20 + i * 15}%`,
            left: 0,
            transform: 'translateY(-50%)',
            background: vineColor,
            boxShadow: `0 0 8px ${vineColor}`
          }}
        />
      ))}

      {/* Pulse Effect */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.5, 0],
            x: [0, 100]
          }}
          transition={{ 
            duration: 0.8,
            repeat: 2,
            ease: "easeOut"
          }}
          className="absolute top-1/2 left-0 w-4 h-4 rounded-full -translate-y-1/2"
          style={{
            background: `radial-gradient(circle, ${vineColor}, transparent)`,
          }}
        />
      )}
    </div>
  );
}