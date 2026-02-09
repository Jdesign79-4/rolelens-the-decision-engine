import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, AlertTriangle } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

function WaveSurface({ isStormy, color }) {
  return (
    <svg className="absolute -top-3 left-0 w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
      <motion.path
        d={isStormy
          ? "M0,10 Q10,2 20,12 T40,8 T60,14 T80,6 T100,10 L100,20 L0,20 Z"
          : "M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10 L100,20 L0,20 Z"}
        fill={color}
        animate={isStormy ? {
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
        transition={{ duration: isStormy ? 0.8 : 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

function Bubbles() {
  return [...Array(5)].map((_, i) => (
    <motion.div
      key={i}
      animate={{ y: [-10, -50], opacity: [0, 0.5, 0], x: [0, (i % 2 === 0 ? 4 : -4)] }}
      transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
      className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
      style={{ left: `${15 + i * 15}%`, bottom: '20%' }}
    />
  ));
}

function MurkyParticles() {
  return [...Array(6)].map((_, i) => (
    <motion.div
      key={i}
      animate={{ y: [0, -15, 0], x: [(i % 2 === 0 ? -4 : 4), (i % 2 === 0 ? 4 : -4), (i % 2 === 0 ? -4 : 4)], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
      className="absolute w-2 h-2 rounded-full bg-slate-900/30"
      style={{ left: `${10 + i * 14}%`, bottom: `${20 + (i % 3) * 15}%` }}
    />
  ));
}

export default function WaterBasinViz({ basin }) {
  if (!basin) return null;

  const { waterPct, basinPct, realFeelPct, isUnderwater, deficit, zones, labels, status, severity } = basin;

  // Color scheme based on status
  const getColors = () => {
    if (severity === 'critical') return { gradient: 'from-red-500 to-red-700', surface: 'rgba(239,68,68,0.8)', isStormy: true };
    if (severity === 'high') return { gradient: 'from-amber-500 to-orange-600', surface: 'rgba(251,191,36,0.8)', isStormy: true };
    if (severity === 'medium') return { gradient: 'from-amber-400 to-yellow-500', surface: 'rgba(251,191,36,0.7)', isStormy: false };
    if (severity === 'low') return { gradient: 'from-teal-400 to-cyan-500', surface: 'rgba(45,212,191,0.8)', isStormy: false };
    return { gradient: 'from-emerald-400 to-teal-500', surface: 'rgba(52,211,153,0.8)', isStormy: false };
  };

  const colors = getColors();

  return (
    <div className="relative">
      {/* Basin Container */}
      <div className="relative h-52 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner">
        {/* Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 pointer-events-none z-10" />

        {/* Living Wage Line (Basin Depth) */}
        <div
          className="absolute left-0 right-0 z-20 border-t-2 border-dashed"
          style={{
            bottom: `${basinPct}%`,
            borderColor: isUnderwater ? 'rgba(239,68,68,0.6)' : 'rgba(100,116,139,0.4)'
          }}
        >
          <span className="absolute right-2 -top-4 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/80 text-slate-600 whitespace-nowrap">
            Living Wage: {fmt(labels.basin)}
          </span>
        </div>

        {/* Water Fill */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${waterPct}%` }}
          transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${colors.gradient}`}
          style={{ opacity: 0.85 }}
        >
          <WaveSurface isStormy={colors.isStormy} color={colors.surface} />
          {colors.isStormy ? <MurkyParticles /> : <Bubbles />}

          {/* Shimmer */}
          {!colors.isStormy && (
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
              style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)', backgroundSize: '200% 200%' }}
            />
          )}
        </motion.div>

        {/* Percentage Markers */}
        {[25, 50, 75].map((level) => (
          <div key={level} className="absolute left-2 right-8 border-t border-dashed border-slate-300/30" style={{ bottom: `${level}%` }}>
            <span className="absolute -top-2.5 left-1 text-[8px] text-slate-400">{level}%</span>
          </div>
        ))}

        {/* Real Feel Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
          transition={{ opacity: { delay: 1.4 }, scale: { delay: 1.4 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute left-3 right-3 flex items-center justify-between px-2.5 py-1 bg-slate-800/70 backdrop-blur-sm rounded-full z-20 border border-white/20"
          style={{ bottom: `${Math.min(waterPct, 90)}%`, transform: 'translateY(50%)' }}
        >
          <Droplets className="w-3 h-3 text-teal-300" />
          <span className="text-[10px] font-bold text-white">Real Feel: {fmt(labels.realFeel)}</span>
        </motion.div>

        {/* Underwater Warning Overlay */}
        {isUnderwater && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-x-0 top-2 flex items-center justify-center gap-2 z-30"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-bold text-white">UNDERWATER BY {fmt(deficit)}</span>
            </div>
          </motion.div>
        )}

        {/* Zone Legend */}
        <div className="absolute bottom-2 left-2 z-20 flex gap-1">
          {zones.filter(z => z.active && z.pct > 3).map((z, i) => (
            <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/60 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: z.color }} />
              <span className="text-[8px] font-medium text-slate-600">{z.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center -mt-3 relative z-30">
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${
          severity === 'critical' ? 'bg-red-600 text-white' :
          severity === 'high' ? 'bg-amber-500 text-white' :
          severity === 'medium' ? 'bg-amber-400 text-amber-900' :
          severity === 'low' ? 'bg-teal-500 text-white' :
          'bg-emerald-500 text-white'
        }`}>
          {status}
        </div>
      </div>
    </div>
  );
}