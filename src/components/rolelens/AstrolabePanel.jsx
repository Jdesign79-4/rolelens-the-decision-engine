import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Shield, Sword, Anchor, Compass, TreeDeciduous, Sprout } from 'lucide-react';

export default function AstrolabePanel({ settings, onSettingsChange, isConnecting }) {
  const [wobble, setWobble] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (settings.riskAppetite > 0.6) {
        setWobble(Math.random() * 4 - 2);
      } else {
        setWobble(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [settings.riskAppetite]);

  const spinSpeed = 20 + (1 - settings.riskAppetite) * 40;
  const ringWeight = 0.5 + settings.lifeAnchors * 0.5;
  const ringThickness = settings.careerStage;

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
          {/* Outer Ring - Career Stage */}
          <motion.div
            animate={{ 
              rotate: 360,
              x: wobble * 0.5,
              y: wobble * 0.3
            }}
            transition={{ 
              rotate: { duration: spinSpeed * 1.5, repeat: Infinity, ease: "linear" },
              x: { duration: 0.1 },
              y: { duration: 0.1 }
            }}
            className="absolute inset-0 rounded-full"
            style={{
              border: `${3 + ringThickness * 6}px solid`,
              borderColor: `rgba(70, 130, 180, ${0.2 + ringThickness * 0.3})`,
              boxShadow: `0 0 ${20 + ringThickness * 20}px rgba(70, 130, 180, 0.1)`
            }}
          >
            {/* Ring Markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-teal-400/50 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 30}deg) translateY(-96px) translateX(-50%)`
                }}
              />
            ))}
          </motion.div>

          {/* Middle Ring - Life Anchors */}
          <motion.div
            animate={{ 
              rotate: -360,
              x: wobble * 0.8,
              y: wobble * 0.5
            }}
            transition={{ 
              rotate: { duration: spinSpeed, repeat: Infinity, ease: "linear" },
              x: { duration: 0.1 },
              y: { duration: 0.1 }
            }}
            className="absolute rounded-full"
            style={{
              inset: '20%',
              border: `${2 + ringWeight * 4}px solid`,
              borderColor: `rgba(143, 188, 143, ${0.3 + ringWeight * 0.4})`,
              boxShadow: `inset 0 0 20px rgba(143, 188, 143, ${0.1 * ringWeight})`
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-sage-400/60 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-58px) translateX(-50%)`,
                  backgroundColor: 'rgba(143, 188, 143, 0.6)'
                }}
              />
            ))}
          </motion.div>

          {/* Inner Ring - Risk Appetite */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: isConnecting ? [1, 1.1, 1] : 1,
              x: wobble,
              y: wobble * 0.7
            }}
            transition={{ 
              rotate: { duration: spinSpeed * 0.7, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.6 },
              x: { duration: 0.1 },
              y: { duration: 0.1 }
            }}
            className="absolute rounded-full"
            style={{
              inset: '35%',
              border: `3px solid`,
              borderColor: settings.riskAppetite > 0.6 
                ? `rgba(233, 150, 122, ${0.5 + settings.riskAppetite * 0.5})`
                : `rgba(70, 130, 180, ${0.5 + (1 - settings.riskAppetite) * 0.3})`,
              boxShadow: settings.riskAppetite > 0.6
                ? `0 0 30px rgba(233, 150, 122, ${settings.riskAppetite * 0.4})`
                : `0 0 20px rgba(70, 130, 180, 0.2)`
            }}
          />

          {/* Center Core */}
          <motion.div
            animate={{ 
              scale: isConnecting ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg"
            style={{
              inset: '42%',
              boxShadow: '0 0 30px rgba(0,0,0,0.2), inset 0 2px 10px rgba(255,255,255,0.1)'
            }}
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-600 to-slate-800" />
          </motion.div>

          {/* Connection Pulse */}
          {isConnecting && (
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.8, repeat: 2 }}
              className="absolute inset-0 rounded-full border-2 border-teal-400"
            />
          )}
        </div>
      </div>

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