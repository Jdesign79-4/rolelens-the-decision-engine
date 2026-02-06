import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Flame, Scale, Sparkles, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Zen Garden Stone Component
function ZenStone({ x, y, size, index, harmony }) {
  const isOrganized = harmony > 0.6;
  const randomness = isOrganized ? 5 : 30;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1,
        opacity: 1,
        x: isOrganized ? 0 : [0, Math.random() * randomness - randomness/2, 0],
        y: isOrganized ? 0 : [0, Math.random() * randomness - randomness/2, 0]
      }}
      transition={{ 
        scale: { duration: 0.5, delay: index * 0.1 },
        opacity: { duration: 0.5, delay: index * 0.1 },
        x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }}
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: isOrganized 
          ? 'linear-gradient(135deg, #78716c 0%, #57534e 100%)'
          : 'linear-gradient(135deg, #a8a29e 0%, #78716c 100%)',
        boxShadow: isOrganized 
          ? '0 2px 8px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(0,0,0,0.1)'
          : '0 1px 4px rgba(0,0,0,0.15)'
      }}
    >
      {/* Stone texture */}
      <div className="absolute inset-0 rounded-full" 
        style={{ 
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent)',
          opacity: 0.6
        }} 
      />
    </motion.div>
  );
}

// Zen Garden Pattern Lines
function ZenPattern({ harmony, index }) {
  const isOrganized = harmony > 0.6;
  const pathVariants = isOrganized ? [
    "M10,50 Q30,30 50,50 T90,50",
    "M10,30 Q30,10 50,30 T90,30",
    "M10,70 Q30,50 50,70 T90,70"
  ] : [
    "M10,45 Q25,55 40,35 Q55,65 70,40 L85,60",
    "M15,25 Q35,15 50,40 Q65,20 85,35",
    "M10,80 Q30,70 45,85 Q60,75 80,80"
  ];
  
  return (
    <motion.path
      d={pathVariants[index]}
      stroke={isOrganized ? "rgba(120, 113, 108, 0.25)" : "rgba(168, 162, 158, 0.15)"}
      strokeWidth={isOrganized ? "1.5" : "1"}
      fill="none"
      strokeDasharray={isOrganized ? "4 8" : "2 6"}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ 
        pathLength: 1, 
        opacity: isOrganized ? 0.6 : 0.3,
        strokeDashoffset: isOrganized ? [0, -12] : [0, -8]
      }}
      transition={{ 
        pathLength: { duration: 1.5, delay: index * 0.3 },
        opacity: { duration: 1.5, delay: index * 0.3 },
        strokeDashoffset: { duration: 8, repeat: Infinity, ease: "linear" }
      }}
    />
  );
}

// Zen Garden Component - Shows Red Flags
function ZenGarden({ postingHealthScore }) {
  // Calculate harmony based on posting health (red flags)
  // High score (75-100) = organized garden (few red flags)
  // Low score (0-50) = chaotic garden (many red flags)
  const harmonyScore = postingHealthScore / 100;
  const hasAnalysis = postingHealthScore !== 50; // 50 is default/no data
  
  // Generate stone positions - more organized when harmony is high
  const stones = harmonyScore > 0.6 ? [
    { x: 20, y: 30, size: 28 },
    { x: 35, y: 55, size: 22 },
    { x: 50, y: 35, size: 32 },
    { x: 65, y: 60, size: 26 },
    { x: 80, y: 40, size: 24 }
  ] : [
    { x: 15 + Math.random() * 10, y: 25 + Math.random() * 15, size: 24 },
    { x: 35 + Math.random() * 10, y: 50 + Math.random() * 15, size: 28 },
    { x: 50 + Math.random() * 10, y: 30 + Math.random() * 15, size: 20 },
    { x: 65 + Math.random() * 10, y: 55 + Math.random() * 15, size: 26 },
    { x: 75 + Math.random() * 10, y: 35 + Math.random() * 15, size: 22 }
  ];

  return (
    <div className="relative h-48 bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 rounded-2xl overflow-hidden border border-stone-200">
      {!hasAnalysis && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50/50 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <p className="text-xs text-stone-500 font-medium">Paste job posting for red flag analysis</p>
          </div>
        </div>
      )}
      {/* Sand texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'3\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: '100px 100px'
        }} 
      />

      {/* Zen patterns (raked sand) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[0, 1, 2].map((i) => (
          <ZenPattern key={i} harmony={harmonyScore} index={i} />
        ))}
      </svg>

      {/* Stones */}
      {stones.map((stone, index) => (
        <ZenStone 
          key={index}
          x={stone.x}
          y={stone.y}
          size={stone.size}
          index={index}
          harmony={harmonyScore}
        />
      ))}

      {/* Red Flags Indicator Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm"
      >
        <p className="text-[10px] text-stone-500 font-medium">Red Flags</p>
        <p className={`text-lg font-bold ${
          harmonyScore > 0.75 ? 'text-emerald-600' :
          harmonyScore > 0.5 ? 'text-amber-600' :
          'text-red-600'
        }`}>
          {harmonyScore > 0.75 ? 'Low' : harmonyScore > 0.5 ? 'Medium' : 'High'}
        </p>
      </motion.div>

      {/* Status Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-stone-800/80 backdrop-blur-sm"
      >
        <p className="text-[10px] text-stone-100 font-medium leading-tight">
          {harmonyScore > 0.75 ? '🧘 Professional Posting - Few Red Flags' :
           harmonyScore > 0.5 ? '⚠️ Some Concerns - Review Carefully' :
           '🚨 Multiple Red Flags - Proceed with Caution'}
        </p>
      </motion.div>
    </div>
  );
}

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

export default function CultureCard({ data, tunerSettings, postingHealthScore }) {
  const stressLevel = data.stress_level;
  const isSenior = tunerSettings.careerStage > 0.5;
  const isRiskAverse = tunerSettings.riskAppetite < 0.4;
  
  // Existential risk based on growth + stability
  const existentialRisk = stressLevel > 0.6 && data.growth_score < 6 ? 0.6 : 0;

  // Bamboo heights based on various metrics
  const bambooData = [
    { height: data.wlb_score * 10, label: 'Balance', healthy: data.wlb_score > 6 },
    { height: data.growth_score * 10, label: 'Growth', healthy: data.growth_score > 7 },
    { height: (1 - stressLevel) * 100, label: 'Low Stress', healthy: stressLevel < 0.5 },
    { height: isSenior ? 80 : 50, label: 'Stage Fit', healthy: true },
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
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Company Fit</p>
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
        <div className="relative p-2 rounded-xl bg-slate-50 text-center">
          <Popover>
            <PopoverTrigger asChild>
              <button className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-slate-200 transition-colors">
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs">
              <p className="font-semibold mb-1">Work-Life Balance Score</p>
              <p className="text-slate-600">Calculated from employee reviews, average work hours, PTO policies, flexibility options, and remote work availability. Higher scores indicate better balance.</p>
            </PopoverContent>
          </Popover>
          <p className="text-lg font-bold text-slate-800">{data.wlb_score}</p>
          <p className="text-[10px] text-slate-500">Work-Life Balance</p>
          <p className="text-[8px] text-slate-400">out of 10</p>
        </div>
        <div className="relative p-2 rounded-xl bg-slate-50 text-center">
          <Popover>
            <PopoverTrigger asChild>
              <button className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-slate-200 transition-colors">
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs">
              <p className="font-semibold mb-1">Career Growth Score</p>
              <p className="text-slate-600">Based on promotion rates, learning opportunities, mentorship programs, skill development resources, and internal mobility. Higher scores indicate stronger growth potential.</p>
            </PopoverContent>
          </Popover>
          <p className="text-lg font-bold text-slate-800">{data.growth_score}</p>
          <p className="text-[10px] text-slate-500">Career Growth</p>
          <p className="text-[8px] text-slate-400">out of 10</p>
        </div>
        <div className="relative p-2 rounded-xl bg-slate-50 text-center">
          <Popover>
            <PopoverTrigger asChild>
              <button className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-slate-200 transition-colors">
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs">
              <p className="font-semibold mb-1">Office Politics Level</p>
              <p className="text-slate-600">Derived from employee sentiment about bureaucracy, decision-making transparency, and organizational dynamics. Lower levels indicate clearer, merit-based environments.</p>
            </PopoverContent>
          </Popover>
          <p className="text-lg font-bold text-slate-800">{data.politics_level}</p>
          <p className="text-[10px] text-slate-500">Office Politics</p>
          <p className="text-[8px] text-slate-400">intensity</p>
        </div>
      </div>

      {/* Culture Deep Dive Text */}
      <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Culture Deep Dive</h4>
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            <span className="font-medium">Work Environment:</span> {data.type} with {
              stressLevel < 0.3 ? 'minimal stress and calm atmosphere' :
              stressLevel < 0.5 ? 'moderate pressure and steady pace' :
              stressLevel < 0.7 ? 'high intensity and fast-moving environment' :
              'extreme pressure and burnout risk'
            }.
          </p>
          <p>
            <span className="font-medium">Work-Life Balance:</span> {
              data.wlb_score >= 8 ? 'Excellent boundaries with strong respect for personal time' :
              data.wlb_score >= 6 ? 'Good balance with occasional overtime expected' :
              data.wlb_score >= 4 ? 'Challenging balance with frequent late hours' :
              'Poor boundaries with consistent overwork culture'
            }.
          </p>
          <p>
            <span className="font-medium">Career Growth:</span> {
              data.growth_score >= 8 ? 'Exceptional opportunities with clear advancement paths and strong mentorship' :
              data.growth_score >= 6 ? 'Solid growth potential with standard progression timelines' :
              data.growth_score >= 4 ? 'Limited advancement with slow promotion cycles' :
              'Minimal growth prospects with stagnant career paths'
            }.
          </p>
          <p>
            <span className="font-medium">Office Politics:</span> {
              data.politics_level === 'Low' ? 'Merit-based culture with transparent decision-making and minimal bureaucracy' :
              data.politics_level === 'Medium' ? 'Moderate navigation required with some relationship management needed' :
              'High political complexity requiring significant stakeholder management'
            }.
          </p>
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
              ? "As a seasoned employee, this culture offers " + (stressLevel < 0.4 ? "sustainable pace" : "potential burnout risk")
              : "As early career, " + (data.growth_score > 7 ? "strong growth environment" : "limited acceleration")
            }
          </p>
        </div>
      </motion.div>

      {/* Zen Garden - Red Flags Indicator */}
      <div className="mt-4">
        <ZenGarden postingHealthScore={postingHealthScore ?? 50} />
      </div>
    </div>
  );
}