import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Shield, Sword, Anchor, Compass, TreeDeciduous, Sprout, Target } from 'lucide-react';

export default function AstrolabePanel({ settings, onSettingsChange, isConnecting }) {
  const [wobble, setWobble] = useState({ x: 0, y: 0 });
  const [pulse, setPulse] = useState(0);

  // Dynamic wobble based on risk AND life anchors (nomads wobble more)
  useEffect(() => {
    const wobbleIntensity = settings.riskAppetite * (1 - settings.lifeAnchors * 0.7);
    const interval = setInterval(() => {
      if (wobbleIntensity > 0.3) {
        setWobble({
          x: (Math.random() - 0.5) * wobbleIntensity * 12,
          y: (Math.random() - 0.5) * wobbleIntensity * 8
        });
      } else {
        setWobble({ x: 0, y: 0 });
      }
    }, 80);
    return () => clearInterval(interval);
  }, [settings.riskAppetite, settings.lifeAnchors]);

  // Pulse effect for high risk seekers
  useEffect(() => {
    if (settings.riskAppetite > 0.7) {
      const interval = setInterval(() => {
        setPulse(p => (p + 1) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [settings.riskAppetite]);

  // Profile archetype detection
  const isNomad = settings.lifeAnchors < 0.4;
  const isProvider = settings.lifeAnchors > 0.6;
  const isSeedling = settings.careerStage < 0.4;
  const isOak = settings.careerStage > 0.6;
  const isRiskSeeker = settings.riskAppetite > 0.6;
  const isStabilitySeeker = settings.riskAppetite < 0.4;

  // Dynamic values based on combined profile
  const spinSpeed = isRiskSeeker 
    ? 8 + (1 - settings.riskAppetite) * 10 
    : 25 + (1 - settings.riskAppetite) * 35;
  
  const ringWeight = 0.3 + settings.lifeAnchors * 0.7;
  const ringThickness = 0.4 + settings.careerStage * 0.6;

  // Color schemes based on archetype
  const getOuterRingColor = () => {
    if (isOak && isProvider) return { main: 'rgba(34, 197, 94, 0.6)', glow: 'rgba(34, 197, 94, 0.3)' }; // Stable green
    if (isSeedling && isNomad) return { main: 'rgba(251, 146, 60, 0.7)', glow: 'rgba(251, 146, 60, 0.4)' }; // Energetic orange
    if (isRiskSeeker) return { main: 'rgba(239, 68, 68, 0.6)', glow: 'rgba(239, 68, 68, 0.3)' }; // Risk red
    return { main: 'rgba(70, 130, 180, 0.5)', glow: 'rgba(70, 130, 180, 0.2)' }; // Default teal
  };

  const getMiddleRingColor = () => {
    if (isProvider) return { main: 'rgba(143, 188, 143, 0.7)', glow: 'rgba(143, 188, 143, 0.3)' }; // Sage anchor
    if (isNomad) return { main: 'rgba(168, 85, 247, 0.6)', glow: 'rgba(168, 85, 247, 0.3)' }; // Purple freedom
    return { main: 'rgba(143, 188, 143, 0.5)', glow: 'rgba(143, 188, 143, 0.2)' };
  };

  const getInnerRingColor = () => {
    if (isRiskSeeker) return { main: 'rgba(239, 68, 68, 0.8)', glow: 'rgba(239, 68, 68, 0.5)' };
    if (isStabilitySeeker) return { main: 'rgba(34, 197, 94, 0.7)', glow: 'rgba(34, 197, 94, 0.4)' };
    return { main: 'rgba(70, 130, 180, 0.6)', glow: 'rgba(70, 130, 180, 0.3)' };
  };

  const getCoreColor = () => {
    if (isRiskSeeker && isNomad) return 'from-orange-600 via-red-600 to-rose-700';
    if (isProvider && isOak) return 'from-emerald-700 via-green-700 to-teal-800';
    if (isSeedling) return 'from-violet-600 via-purple-600 to-indigo-700';
    return 'from-slate-700 via-slate-800 to-slate-900';
  };

  const outerColors = getOuterRingColor();
  const middleColors = getMiddleRingColor();
  const innerColors = getInnerRingColor();

  return (
    <div className="h-full flex flex-col p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-800 tracking-tight">RoleLens</h1>
        <p className="text-sm text-slate-500 mt-1">Executive Decision Engine</p>
      </div>

      {/* Astrolabe Visualization */}
      <div className="relative flex items-center justify-center py-8">
        <div className="relative w-48 h-48">
          {/* Background Energy Field for Risk Seekers */}
          {isRiskSeeker && (
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.25, 0.1]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -inset-4 rounded-full"
              style={{
                background: `radial-gradient(circle, ${innerColors.glow} 0%, transparent 70%)`
              }}
            />
          )}

          {/* Stability Aura for Providers */}
          {isProvider && isStabilitySeeker && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 rounded-full opacity-30"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${middleColors.main}, transparent, ${middleColors.main}, transparent)`
              }}
            />
          )}

          {/* Outer Ring - Career Stage */}
          <motion.div
            animate={{ 
              rotate: isOak ? 360 : -360,
              x: wobble.x * 0.3,
              y: wobble.y * 0.3
            }}
            transition={{ 
              rotate: { duration: spinSpeed * (isOak ? 2 : 1), repeat: Infinity, ease: "linear" },
              x: { duration: 0.08 },
              y: { duration: 0.08 }
            }}
            className="absolute inset-0 rounded-full"
            style={{
              border: `${2 + ringThickness * 8}px solid`,
              borderColor: outerColors.main,
              boxShadow: `0 0 ${15 + ringThickness * 25}px ${outerColors.glow}, inset 0 0 ${10 + ringThickness * 10}px ${outerColors.glow}`
            }}
          >
            {/* Ring Markers - more for Oak, fewer for Seedling */}
            {[...Array(isOak ? 16 : isSeedling ? 6 : 12)].map((_, i) => (
              <motion.div
                key={i}
                animate={isSeedling ? { 
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.4, 0.9, 0.4]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="absolute rounded-full"
                style={{
                  width: isOak ? '6px' : '4px',
                  height: isOak ? '6px' : '4px',
                  backgroundColor: outerColors.main,
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * (360 / (isOak ? 16 : isSeedling ? 6 : 12))}deg) translateY(-96px) translateX(-50%)`,
                  boxShadow: `0 0 6px ${outerColors.glow}`
                }}
              />
            ))}
          </motion.div>

          {/* Middle Ring - Life Anchors */}
          <motion.div
            animate={{ 
              rotate: isNomad ? 360 : -360,
              x: wobble.x * (isNomad ? 1.2 : 0.4),
              y: wobble.y * (isNomad ? 1.2 : 0.4),
              scale: isProvider ? [1, 1.02, 1] : 1
            }}
            transition={{ 
              rotate: { duration: spinSpeed * (isNomad ? 0.6 : 1.2), repeat: Infinity, ease: "linear" },
              x: { duration: 0.08 },
              y: { duration: 0.08 },
              scale: { duration: 3, repeat: Infinity }
            }}
            className="absolute rounded-full"
            style={{
              inset: '18%',
              border: `${2 + ringWeight * 6}px ${isNomad ? 'dashed' : 'solid'}`,
              borderColor: middleColors.main,
              boxShadow: `0 0 ${12 + ringWeight * 15}px ${middleColors.glow}`
            }}
          >
            {/* Anchor points for Providers, Freedom sparks for Nomads */}
            {[...Array(isNomad ? 4 : 8)].map((_, i) => (
              <motion.div
                key={i}
                animate={isNomad ? {
                  scale: [0.5, 1.5, 0.5],
                  opacity: [0.3, 1, 0.3]
                } : {}}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                className="absolute rounded-full"
                style={{
                  width: isProvider ? '8px' : '4px',
                  height: isProvider ? '8px' : '4px',
                  backgroundColor: middleColors.main,
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * (isNomad ? 90 : 45)}deg) translateY(-48px) translateX(-50%)`,
                  boxShadow: isNomad ? `0 0 8px ${middleColors.main}` : 'none'
                }}
              />
            ))}
          </motion.div>

          {/* Inner Ring - Risk Appetite */}
          <motion.div
            animate={{ 
              rotate: isRiskSeeker ? [0, 360] : 360,
              scale: isConnecting ? [1, 1.15, 1] : isRiskSeeker ? [1, 1.05, 1] : 1,
              x: wobble.x,
              y: wobble.y * 0.7
            }}
            transition={{ 
              rotate: { 
                duration: isRiskSeeker ? spinSpeed * 0.4 : spinSpeed * 0.8, 
                repeat: Infinity, 
                ease: isRiskSeeker ? "easeInOut" : "linear" 
              },
              scale: { duration: isRiskSeeker ? 0.8 : 0.6, repeat: isRiskSeeker ? Infinity : 0 },
              x: { duration: 0.08 },
              y: { duration: 0.08 }
            }}
            className="absolute rounded-full"
            style={{
              inset: '32%',
              border: `${3 + (isRiskSeeker ? 2 : 0)}px solid`,
              borderColor: innerColors.main,
              boxShadow: `0 0 ${isRiskSeeker ? 35 : 20}px ${innerColors.glow}, inset 0 0 15px ${innerColors.glow}`
            }}
          >
            {/* Risk sparks */}
            {isRiskSeeker && [...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  backgroundColor: innerColors.main,
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 60 + pulse}deg) translateY(-28px) translateX(-50%)`,
                  boxShadow: `0 0 4px ${innerColors.main}`
                }}
              />
            ))}
          </motion.div>

          {/* Center Core - Dynamic based on archetype */}
          <motion.div
            animate={{ 
              scale: isConnecting ? [1, 1.2, 1] : isRiskSeeker ? [1, 1.08, 1] : 1,
              rotate: isNomad && isRiskSeeker ? [0, 10, -10, 0] : 0
            }}
            transition={{ 
              scale: { duration: isRiskSeeker ? 1.2 : 0.6, repeat: isRiskSeeker ? Infinity : 0 },
              rotate: { duration: 0.5, repeat: Infinity }
            }}
            className={`absolute rounded-full bg-gradient-to-br ${getCoreColor()} shadow-lg`}
            style={{
              inset: '40%',
              boxShadow: `0 0 30px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.15), 0 0 ${isRiskSeeker ? 20 : 0}px ${innerColors.glow}`
            }}
          >
            <motion.div 
              animate={isRiskSeeker ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className={`absolute inset-1.5 rounded-full bg-gradient-to-br ${getCoreColor()} opacity-80`} 
            />
            
            {/* Core symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isRiskSeeker && isNomad && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-white/40 border-t-white/80 rounded-full"
                />
              )}
              {isProvider && isOak && (
                <div className="w-2 h-2 rounded-full bg-white/50" />
              )}
            </div>
          </motion.div>

          {/* Connection Pulse */}
          {isConnecting && (
            <>
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.8, repeat: 2 }}
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${innerColors.main}` }}
              />
              <motion.div
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8, repeat: 2, delay: 0.2 }}
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${middleColors.main}` }}
              />
            </>
          )}
        </div>
      </div>
      
      {/* Archetype Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-4"
      >
        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{
          backgroundColor: isRiskSeeker && isNomad ? 'rgba(239, 68, 68, 0.1)' : 
                          isProvider && isOak ? 'rgba(34, 197, 94, 0.1)' : 
                          'rgba(100, 116, 139, 0.1)',
          color: isRiskSeeker && isNomad ? '#ef4444' : 
                 isProvider && isOak ? '#22c55e' : 
                 '#64748b'
        }}>
          {isRiskSeeker && isNomad && "🔥 Bold Explorer"}
          {isRiskSeeker && isProvider && "⚡ Calculated Risk-Taker"}
          {isStabilitySeeker && isNomad && "🌊 Flexible Steady"}
          {isStabilitySeeker && isProvider && "🛡️ Secure Foundation"}
          {!isRiskSeeker && !isStabilitySeeker && isNomad && "🧭 Free Spirit"}
          {!isRiskSeeker && !isStabilitySeeker && isProvider && "⚓ Balanced Anchor"}
          {!isRiskSeeker && !isStabilitySeeker && !isNomad && !isProvider && "⚖️ Balanced Seeker"}
        </span>
      </motion.div>

      {/* Tuner Sliders */}
      <div className="flex-1 space-y-8 mt-4">
        {/* Risk Appetite */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-slate-700">Risk Appetite</span>
            </div>
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-terracotta-500" style={{ color: '#E9967A' }} />
            </div>
          </div>
          <Slider
            value={[settings.riskAppetite * 100]}
            onValueChange={([v]) => onSettingsChange({ ...settings, riskAppetite: v / 100 })}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Stability Seeker</span>
            <span>Growth Hunter</span>
          </div>
        </div>

        {/* Life Anchors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Life Anchors</span>
            </div>
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-sage-600" style={{ color: '#8FBC8F' }} />
            </div>
          </div>
          <Slider
            value={[settings.lifeAnchors * 100]}
            onValueChange={([v]) => onSettingsChange({ ...settings, lifeAnchors: v / 100 })}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Nomad</span>
            <span>Provider</span>
          </div>
        </div>

        {/* Career Stage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-slate-700">Career Stage</span>
            </div>
            <div className="flex items-center gap-2">
              <TreeDeciduous className="w-4 h-4 text-green-700" />
            </div>
          </div>
          <Slider
            value={[settings.careerStage * 100]}
            onValueChange={([v]) => onSettingsChange({ ...settings, careerStage: v / 100 })}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Seedling</span>
            <span>Oak</span>
          </div>
        </div>

        {/* Honest Self-Reflection */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Honest Self-Reflection</span>
            </div>
          </div>
          <Slider
            value={[settings.honestSelfReflection * 100]}
            onValueChange={([v]) => onSettingsChange({ ...settings, honestSelfReflection: v / 100 })}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Underqualified</span>
            <span>Exceptional Fit</span>
          </div>
          <p className="text-xs text-slate-500 italic">
            Your honest assessment of skill match and experience level for this role
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-8 pt-6 border-t border-slate-200/50">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs text-slate-500">
            {isConnecting ? 'Recalibrating analysis...' : 'Profile active'}
          </span>
        </div>
      </div>
    </div>
  );
}