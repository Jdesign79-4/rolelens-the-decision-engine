import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Shield, Sword, Anchor, Compass, TreeDeciduous, Sprout, Target } from 'lucide-react';
import ProfileAnalysis from './ProfileAnalysis';
import { useDarkMode } from '@/components/DarkModeContext';
import AstrolabeVisualization from './AstrolabeVisualization';

export default function AstrolabePanel({ settings: rawSettings, onSettingsChange, isConnecting }) {
  const { isDark } = useDarkMode();

  const settings = rawSettings || { riskAppetite: 0.3, lifeAnchors: 0.5, careerStage: 0.6, honestSelfReflection: 0.7 };

  return (
    <div className="h-full flex flex-col p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">RoleLens</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Executive Decision Engine</p>
      </div>

      {/* Visualization — isolated from Radix Slider context */}
      <AstrolabeVisualization settings={settings} isConnecting={isConnecting} />

      {/* Tuner Sliders */}
      <div className="flex-1 mt-4">
        {/* Risk Appetite */}
        <div style={{ background: isDark ? '#1e293b' : '#F0EAE1', borderRadius: '16px', boxShadow: isDark ? '2px 2px 6px rgba(0,0,0,0.3), -1px -1px 4px rgba(30,41,59,0.3)' : '3px 3px 8px #C2BCB4, -2px -2px 6px #FEFAF4', padding: '14px 14px 12px', marginBottom: '10px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#786F6A' }}>Risk Appetite</span>
            </div>
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4" style={{ color: '#E9967A' }} />
            </div>
          </div>
          <Slider
            value={[settings.riskAppetite * 100]}
            onValueChange={([v]) => onSettingsChange({ ...settings, riskAppetite: v / 100 })}
            max={100}
            step={1}
            className="cursor-pointer"
            aria-label="Risk Appetite"
            trackStyle={{ height: '6px', borderRadius: '999px', background: '#E1D9CE', boxShadow: 'inset 2px 2px 5px #C2BCB4, inset -1px -1px 3px #FEFAF4', border: 'none', WebkitAppearance: 'none' }}
            thumbStyle={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F0EAE1', boxShadow: '3px 3px 7px #C2BCB4, -2px -2px 5px #FEFAF4, 0 0 0 2.5px #4A6741', border: 'none', cursor: 'pointer' }}
          />
          <div className="flex justify-between mt-3" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#A89E9A' }}>
            <span>Stability Seeker</span>
            <span>Growth Hunter</span>
          </div>
        </div>

        {/* Life Anchors */}
        <div style={{ background: isDark ? '#1e293b' : '#F0EAE1', borderRadius: '16px', boxShadow: isDark ? '2px 2px 6px rgba(0,0,0,0.3), -1px -1px 4px rgba(30,41,59,0.3)' : '3px 3px 8px #C2BCB4, -2px -2px 6px #FEFAF4', padding: '14px 14px 12px', marginBottom: '10px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-500" />
              <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#786F6A' }}>Life Anchors</span>
            </div>
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4" style={{ color: '#8FBC8F' }} />
            </div>
          </div>
          <Slider
            value={[settings.lifeAnchors * 100]}
            onValueChange={([v]) => onSettingsChange({ ...settings, lifeAnchors: v / 100 })}
            max={100}
            step={1}
            className="cursor-pointer"
            aria-label="Life Anchors"
            trackStyle={{ height: '6px', borderRadius: '999px', background: '#E1D9CE', boxShadow: 'inset 2px 2px 5px #C2BCB4, inset -1px -1px 3px #FEFAF4', border: 'none', WebkitAppearance: 'none' }}
            thumbStyle={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F0EAE1', boxShadow: '3px 3px 7px #C2BCB4, -2px -2px 5px #FEFAF4, 0 0 0 2.5px #C0706A', border: 'none', cursor: 'pointer' }}
          />
          <div className="flex justify-between mt-3" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#A89E9A' }}>
            <span>Nomad</span>
            <span>Provider</span>
          </div>
        </div>

        {/* Career Stage */}
        <div style={{ background: isDark ? '#1e293b' : '#F0EAE1', borderRadius: '16px', boxShadow: isDark ? '2px 2px 6px rgba(0,0,0,0.3), -1px -1px 4px rgba(30,41,59,0.3)' : '3px 3px 8px #C2BCB4, -2px -2px 6px #FEFAF4', padding: '14px 14px 12px', marginBottom: '10px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-green-500" />
              <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#786F6A' }}>Career Stage</span>
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
            aria-label="Career Stage"
            trackStyle={{ height: '6px', borderRadius: '999px', background: '#E1D9CE', boxShadow: 'inset 2px 2px 5px #C2BCB4, inset -1px -1px 3px #FEFAF4', border: 'none', WebkitAppearance: 'none' }}
            thumbStyle={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F0EAE1', boxShadow: '3px 3px 7px #C2BCB4, -2px -2px 5px #FEFAF4, 0 0 0 2.5px #3A4868', border: 'none', cursor: 'pointer' }}
          />
          
          <div className="mt-4 mb-2">
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', fontWeight: 500, color: isDark ? '#93a5cf' : '#3A4868', textAlign: 'center', display: 'block' }}>
              {settings.careerStage < 0.2 ? 'Seedling' : settings.careerStage < 0.4 ? 'Sapling' : settings.careerStage < 0.6 ? 'Grove' : settings.careerStage < 0.8 ? 'Oak' : 'Elder'}
            </div>
            <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? '#64748b' : '#A89E9A', textAlign: 'center' }}>
              {settings.careerStage < 0.2 ? 'ENTRY LEVEL' : settings.careerStage < 0.4 ? 'EARLY CAREER' : settings.careerStage < 0.6 ? 'MID-LEVEL' : settings.careerStage < 0.8 ? 'SENIOR' : 'EXECUTIVE / LEADERSHIP'}
            </div>
          </div>

          <div className="flex justify-between mt-3" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#A89E9A' }}>
            <span>Seedling</span>
            <span>Elder</span>
          </div>
        </div>

        {/* Honest Self-Reflection */}
        <div style={{ background: isDark ? '#1e293b' : '#F0EAE1', borderRadius: '16px', boxShadow: isDark ? '2px 2px 6px rgba(0,0,0,0.3), -1px -1px 4px rgba(30,41,59,0.3)' : '3px 3px 8px #C2BCB4, -2px -2px 6px #FEFAF4', padding: '14px 14px 12px', marginBottom: '10px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#786F6A' }}>Honest Self-Reflection</span>
            </div>
          </div>
          <Slider
            value={[settings.honestSelfReflection * 100]}
            onValueChange={([v]) => onSettingsChange({ ...settings, honestSelfReflection: v / 100 })}
            max={100}
            step={1}
            className="cursor-pointer"
            aria-label="Honest Self-Reflection"
            trackStyle={{ height: '6px', borderRadius: '999px', background: '#E1D9CE', boxShadow: 'inset 2px 2px 5px #C2BCB4, inset -1px -1px 3px #FEFAF4', border: 'none', WebkitAppearance: 'none' }}
            thumbStyle={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F0EAE1', boxShadow: '3px 3px 7px #C2BCB4, -2px -2px 5px #FEFAF4', border: 'none', cursor: 'pointer' }}
          />
          <div className="flex justify-between mt-3" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#A89E9A' }}>
            <span>Underqualified</span>
            <span>Exceptional Fit</span>
          </div>
          <p className="mt-2" style={{ fontSize: '10px', fontStyle: 'italic', color: isDark ? '#94a3b8' : '#786F6A' }}>
            Your honest assessment of skill match and experience level for this role
          </p>
        </div>
      </div>

      {/* Profile Analysis */}
      <ProfileAnalysis settings={settings} />

      {/* Status Indicator */}
      <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isConnecting ? 'Recalibrating analysis...' : 'Profile active'}
          </span>
        </div>
      </div>
    </div>
  );
}