import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Flame, Scale, Sparkles } from 'lucide-react';

// Animated Bamboo Leaf component
function BambooLeaf({ side, delay, healthy, turmoil, withering }) {
  const baseColor = withering ? '#92400e' : healthy ? '#22c55e' : '#eab308';
  const swayIntensity = turmoil ? 25 : 8;
  const swaySpeed = turmoil ? 0.5 : 2;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: healthy ? 1 : 0.4,
        opacity: healthy ? 1 : 0.5,
        rotate: side === 'left' 
          ? [-45 - swayIntensity, -45 + swayIntensity, -45 - swayIntensity]
          : [45 - swayIntensity, 45 + swayIntensity, 45 - swayIntensity]
      }}
      transition={{ 
        scale: { delay, duration: 0.4 },
        opacity: { delay, duration: 0.4 },
        rotate: { duration: swaySpeed, repeat: Infinity, ease: "easeInOut" }
      }}
      className="absolute w-5 h-1.5 rounded-full origin-center"
      style={{
        background: `linear-gradient(${side === 'left' ? '90deg' : '-90deg'}, ${baseColor}, transparent)`,
        [side]: '-8px',
        top: '-2px',
        filter: withering ? 'saturate(0.5)' : 'none'
      }}
    />
  );
}

// Animated Bamboo Stalk
function BambooStalk({ bamboo, index, stressLevel, existentialRisk }) {
  const turmoil = stressLevel > 0.5;
  const withering = existentialRisk > 0.4;
  const swayAmount = turmoil ? 8 : 2;
  const leafCount = bamboo.healthy ? Math.floor(bamboo.height / 25) + 2 : 1;
  
  const stalkColor = withering 
    ? 'from-amber-700 via-amber-600 to-amber-800'
    : bamboo.healthy 
      ? 'from-emerald-500 via-green-500 to-emerald-600'
      : 'from-amber-500 via-yellow-500 to-amber-600';

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: `${bamboo.height * 1.2}px`,
          opacity: 1,
          x: turmoil ? [0, swayAmount, -swayAmount, 0] : 0
        }}
        transition={{ 
          height: { duration: 0.8, delay: index * 0.1 },
          opacity: { duration: 0.8, delay: index * 0.1 },
          x: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative w-3 rounded-t-full overflow-visible"
        style={{ maxHeight: '120px' }}
      >
        {/* Stalk Body */}
        <div className={`absolute inset-0 bg-gradient-to-t ${stalkColor} rounded-t-full`}>
          {/* Segments with crack effect for withering */}
          {[...Array(Math.floor(bamboo.height / 20))].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full"
              style={{ bottom: `${(i + 1) * 20}px` }}
            >
              <div className={`h-0.5 ${withering ? 'bg-amber-900/40' : 'bg-black/10'}`} />
              {withering && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute w-full h-1 bg-gradient-to-r from-transparent via-amber-900/20 to-transparent"
                />
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Leaves - multiple at different heights */}
        {[...Array(leafCount)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full"
            style={{ top: `${Math.max(0, (i * 25) - 5)}px` }}
          >
            <BambooLeaf 
              side="left" 
              delay={0.8 + index * 0.1 + i * 0.05} 
              healthy={bamboo.healthy}
              turmoil={turmoil}
              withering={withering}
            />
            <BambooLeaf 
              side="right" 
              delay={0.9 + index * 0.1 + i * 0.05}
              healthy={bamboo.healthy}
              turmoil={turmoil}
              withering={withering}
            />
          </div>
        ))}
        
        {/* Withering particles */}
        {withering && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  y: [0, 30],
                  x: [0, (i - 1) * 10]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.7
                }}
                className="absolute top-1/3 left-1/2 w-1 h-1 rounded-full bg-amber-600"
              />
            ))}
          </>
        )}
      </motion.div>
      
      <span className="mt-2 text-[10px] text-slate-500 font-medium">{bamboo.label}</span>
    </div>
  );
}

export default function CultureCard({ data, tunerSettings }) {
  const stressLevel = data.stress_level;
  const isSenior = tunerSettings.careerStage > 0.5;
  const isRiskAverse = tunerSettings.riskAppetite < 0.4;
  
  // Existential risk based on growth + stability
  const existentialRisk = stressLevel > 0.6 && data.growth_score < 6 ? 0.6 : 0;

  // Bamboo heights based on various metrics
  const bambooData = [
    { height: data.wlb_score * 10, label: 'WLB', healthy: data.wlb_score > 6 },
    { height: data.growth_score * 10, label: 'Growth', healthy: data.growth_score > 7 },
    { height: (1 - stressLevel) * 100, label: 'Calm', healthy: stressLevel < 0.5 },
    { height: isSenior ? 80 : 50, label: 'Fit', healthy: true },
  ];

  const getGroveHealth = () => {
    const avgHealth = bambooData.filter(b => b.healthy).length / bambooData.length;
    if (avgHealth > 0.7) return { label: 'Thriving Grove', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (avgHealth > 0.4) return { label: 'Mixed Conditions', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Stressed Environment', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const groveHealth = getGroveHealth();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Culture Scan</p>
          <h3 className="text-lg font-semibold text-slate-800">{data.type}</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500">
          <Heart className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Bamboo Grove Visualization */}
      <div className="relative h-44 bg-gradient-to-t from-amber-100/50 via-transparent to-transparent rounded-2xl overflow-hidden mb-6">
        {/* Atmospheric wind lines for turmoil */}
        {stressLevel > 0.5 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 0.3, 0] }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
                className="absolute h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"
                style={{ top: `${20 + i * 20}%`, width: '50%' }}
              />
            ))}
          </div>
        )}
        
        {/* Ground with stress cracks */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-200 to-amber-100">
          {existentialRisk > 0 && (
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 10">
              <motion.path
                d="M10,5 L15,3 L20,6 L25,2"
                stroke="#78350f"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
              <motion.path
                d="M60,5 L65,7 L70,4 L75,8"
                stroke="#78350f"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </svg>
          )}
        </div>
        
        {/* Bamboo Stalks */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-around items-end px-4">
          {bambooData.map((bamboo, index) => (
            <BambooStalk 
              key={index}
              bamboo={bamboo}
              index={index}
              stressLevel={stressLevel}
              existentialRisk={existentialRisk}
            />
          ))}
        </div>

        {/* Stress Indicator - Sun/Heat */}
        {stressLevel > 0.5 && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-3 right-3"
          >
            <Flame className="w-6 h-6 text-orange-500 drop-shadow-lg" />
          </motion.div>
        )}
        
        {/* Existential Crisis Warning */}
        {existentialRisk > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-3 left-3 px-2 py-1 rounded-full bg-red-100 border border-red-200"
          >
            <span className="text-[9px] font-medium text-red-600">⚠ Crisis Risk</span>
          </motion.div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-xl bg-slate-50 text-center">
          <p className="text-lg font-bold text-slate-800">{data.wlb_score}</p>
          <p className="text-[10px] text-slate-500">WLB Score</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 text-center">
          <p className="text-lg font-bold text-slate-800">{data.growth_score}</p>
          <p className="text-[10px] text-slate-500">Growth</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 text-center">
          <p className="text-lg font-bold text-slate-800">{data.politics_level}</p>
          <p className="text-[10px] text-slate-500">Politics</p>
        </div>
      </div>

      {/* Grove Health Status */}
      <div className={`flex items-center gap-3 p-3 rounded-xl ${groveHealth.bg}`}>
        <Sparkles className={`w-5 h-5 ${groveHealth.color}`} />
        <div>
          <p className="text-xs text-slate-500">Grove Assessment</p>
          <p className={`text-sm font-medium ${groveHealth.color}`}>{groveHealth.label}</p>
        </div>
      </div>

      {/* Career Stage Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 p-3 rounded-xl border border-dashed border-slate-200"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-slate-400" />
          <p className="text-xs text-slate-600">
            {isSenior 
              ? "As a senior, this culture offers " + (stressLevel < 0.4 ? "sustainable pace" : "potential burnout risk")
              : "As early career, " + (data.growth_score > 7 ? "strong growth environment" : "limited acceleration")
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
}