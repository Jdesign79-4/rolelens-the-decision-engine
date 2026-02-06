import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, Droplets } from 'lucide-react';

// Animated water droplet for leak
function LeakDroplet({ delay, x }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 0, scale: 0 }}
      animate={{ 
        y: [0, 40, 80],
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.8]
      }}
      transition={{ 
        duration: 1.2,
        repeat: Infinity,
        delay,
        ease: "easeIn"
      }}
      className="absolute w-1.5 h-2 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"
      style={{ 
        right: -4 + x,
        top: '40%',
        filter: 'blur(0.5px)'
      }}
    />
  );
}

// Water ripple effect
function WaterRipple({ fillPercentage }) {
  return (
    <motion.div
      className="absolute inset-x-0 pointer-events-none"
      style={{ bottom: `${fillPercentage - 5}%` }}
    >
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.6, 0.2, 0.6]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeInOut"
          }}
          className="absolute left-1/2 -translate-x-1/2 w-16 h-2 rounded-full border border-white/30"
          style={{ top: i * 4 }}
        />
      ))}
    </motion.div>
  );
}

export default function CompensationCard({ data, tunerSettings }) {
  // If exact range provided from job posting, don't adjust it
  const hasExactRange = data.range_min && data.range_max;
  
  // Adjust headline based on self-reflection (0.5 = average, below = reduced offer, above = premium offer)
  const reflectionAdjustment = 0.7 + (tunerSettings.honestSelfReflection * 0.6); // Range: 0.7 to 1.3
  const adjustedHeadline = hasExactRange ? data.headline : Math.round(data.headline * reflectionAdjustment);
  
  // Water fills to real_feel level, but headline is the target capacity
  // If real_feel < headline, the excess overflows out the top
  const targetFillPercentage = 100; // Always aim for full capacity (headline)
  const actualFillPercentage = Math.min(100, Math.max(0, (data.real_feel / adjustedHeadline) * 100));
  const overflowPercentage = Math.max(0, 100 - actualFillPercentage);
  const isOverflowing = overflowPercentage > 5;
  
  const isProviderMode = tunerSettings.lifeAnchors > 0.5;
  const isUnderqualified = tunerSettings.honestSelfReflection < 0.4;
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getWaterColor = () => {
    if (fillPercentage > 70) return { main: 'from-teal-400 to-cyan-500', surface: 'rgba(45, 212, 191, 0.8)', isStormy: false };
    if (fillPercentage > 50) return { main: 'from-cyan-400 to-blue-500', surface: 'rgba(34, 211, 238, 0.8)', isStormy: false };
    if (fillPercentage > 35) return { main: 'from-amber-400 to-orange-500', surface: 'rgba(251, 191, 36, 0.8)', isStormy: false };
    return { main: 'from-slate-600 to-slate-800', surface: 'rgba(71, 85, 105, 0.9)', isStormy: true };
  };
  
  const waterColors = getWaterColor();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Compensation Reality</p>
          <h3 className="text-lg font-semibold text-slate-800">The Water Basin</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Water Basin Visualization */}
      <div className="relative mb-6">
        <div className="relative h-40 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner">
          {/* Basin Glass Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 pointer-events-none" />
          
          {/* Water Fill with fluid animation */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${fillPercentage}%` }}
            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${waterColors.main}`}
            style={{ opacity: 0.85 }}
          >
            {/* Animated Wave Surface - Choppy when stormy */}
            <svg className="absolute -top-3 left-0 w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
              <motion.path
                d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10 L100,20 L0,20 Z"
                fill={waterColors.surface}
                animate={waterColors.isStormy ? {
                  d: [
                    "M0,10 Q10,2 20,12 T40,8 T60,14 T80,6 T100,10 L100,20 L0,20 Z",
                    "M0,12 Q10,16 20,8 T40,14 T60,6 T80,12 T100,8 L100,20 L0,20 Z",
                    "M0,8 Q10,14 20,6 T40,12 T60,8 T80,14 T100,10 L100,20 L0,20 Z",
                    "M0,10 Q10,2 20,12 T40,8 T60,14 T80,6 T100,10 L100,20 L0,20 Z"
                  ]
                } : {
                  d: [
                    "M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10 L100,20 L0,20 Z",
                    "M0,10 Q10,15 20,10 T40,10 T60,10 T80,10 T100,10 L100,20 L0,20 Z",
                    "M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10 L100,20 L0,20 Z"
                  ]
                }}
                transition={{ duration: waterColors.isStormy ? 0.8 : 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>
            
            {/* Underwater shimmer or murky particles */}
            {waterColors.isStormy ? (
              <>
                {/* Murky particles floating */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -20, 0],
                      x: [(i % 2 === 0 ? -5 : 5), (i % 2 === 0 ? 5 : -5), (i % 2 === 0 ? -5 : 5)],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: 2 + i * 0.3,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="absolute w-2 h-2 rounded-full bg-slate-900/40"
                    style={{ left: `${10 + i * 12}%`, bottom: `${20 + (i % 3) * 15}%` }}
                  />
                ))}
              </>
            ) : (
              <motion.div
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 100%']
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                  backgroundSize: '200% 200%'
                }}
              />
            )}
            
            {/* Rising bubbles - fewer in stormy water */}
            {!waterColors.isStormy && [...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 100, opacity: 0 }}
                animate={{ 
                  y: [-10, -60],
                  opacity: [0, 0.6, 0],
                  x: [0, (i % 2 === 0 ? 5 : -5)]
                }}
                transition={{ 
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
                className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
                style={{ left: `${15 + i * 15}%`, bottom: '20%' }}
              />
            ))}
            
            {/* Water Ripples */}
            <WaterRipple fillPercentage={fillPercentage} />
          </motion.div>

          {/* Leak Hole and Dripping Animation */}
          {isLeaking && (
            <div className="absolute right-0 top-1/3">
              {/* Leak hole */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 border-2 border-slate-400 shadow-inner flex items-center justify-center"
              >
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </motion.div>
              
              {/* Dripping droplets */}
              <LeakDroplet delay={0} x={0} />
              <LeakDroplet delay={0.4} x={3} />
              <LeakDroplet delay={0.8} x={-2} />
              
              {/* Leak label */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -right-1 top-8 text-[9px] text-red-500 font-semibold whitespace-nowrap"
              >
                -{Math.round(leakPercentage)}%
              </motion.div>
            </div>
          )}

          {/* Water Level Markers */}
          {[25, 50, 75].map((level) => (
            <div
              key={level}
              className="absolute left-2 right-8 border-t border-dashed border-slate-300/40"
              style={{ bottom: `${level}%` }}
            >
              <span className="absolute -top-2.5 left-1 text-[9px] text-slate-400 font-medium">{level}%</span>
            </div>
          ))}

          {/* Real Feel Indicator floating on water */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -3, 0]
            }}
            transition={{ 
              opacity: { delay: 1.2 },
              scale: { delay: 1.2 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute left-3 right-10 flex items-center justify-between px-2 py-1 bg-white/30 backdrop-blur-sm rounded-full"
            style={{ bottom: `${fillPercentage}%`, transform: 'translateY(50%)' }}
          >
            <Droplets className="w-3 h-3 text-white drop-shadow-md" />
            <span className="text-[10px] font-bold text-white drop-shadow-md">Real Feel</span>
          </motion.div>
        </div>
      </div>

      {/* Compensation Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
          <span className="text-sm text-slate-600">Offer</span>
          <span className="text-lg font-bold text-slate-800">
            {data.range_min && data.range_max ? (
              `${formatCurrency(data.range_min)} - ${formatCurrency(data.range_max)}`
            ) : (
              formatCurrency(adjustedHeadline)
            )}
          </span>
        </div>
        
        {!hasExactRange && tunerSettings.honestSelfReflection !== 0.7 && (
          <div className={`flex justify-between items-center p-3 rounded-xl border ${
            tunerSettings.honestSelfReflection > 0.7 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <span className="text-xs text-slate-600">Skill Match Adjustment</span>
            <span className={`text-sm font-medium ${
              tunerSettings.honestSelfReflection > 0.7 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {tunerSettings.honestSelfReflection > 0.7 ? '+' : ''}{Math.round((reflectionAdjustment - 1) * 100)}%
            </span>
          </div>
        )}
        
        {leakPercentage > 0 && (
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-600">{data.leak_label}</span>
            </div>
            <span className="text-sm font-medium text-red-500">-{Math.round(leakPercentage)}%</span>
          </div>
        )}

        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
          <span className="text-sm font-medium text-teal-700">Real Feel Salary</span>
          <span className="text-xl font-bold text-teal-700">{formatCurrency(data.real_feel)}</span>
        </div>
      </div>

      {/* Provider Mode Insight */}
      {isProviderMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50"
        >
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Provider Alert:</span> This real feel may be {data.real_feel < 100000 ? 'tight' : 'comfortable'} for family obligations
          </p>
        </motion.div>
      )}
      
      {/* Underqualified Warning */}
      {isUnderqualified && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 rounded-xl border border-dashed border-red-300 bg-red-50/50"
        >
          <p className="text-xs text-red-700">
            <span className="font-semibold">Reality Check:</span> Lower offers typical when lacking key qualifications. Focus on skill development to command higher compensation.
          </p>
        </motion.div>
      )}
    </div>
  );
}