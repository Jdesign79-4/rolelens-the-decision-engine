import React, { useState } from 'react';
import LensAnimation from './LensAnimation';
import { Link, useLocation } from 'react-router-dom';

const CAREER_STAGES = ['Seedling', 'Sapling', 'Grove', 'Oak', 'Elder'];

const NAV_ITEMS = [
  { icon: '🌿', label: 'My Applications', path: '/ApplicationTracker' },
  { icon: '🔍', label: 'Analyze Role', path: '/RoleLens' },
  { icon: '📋', label: 'Saved Lists', action: 'savedLists' },
  { icon: '🗂', label: 'Compare', action: 'compare' },
];

export default function ZenLeftPanel({ settings, onSettingsChange, onAction }) {
  const location = useLocation();
  const stageIdx = Math.min(4, Math.floor(settings.careerStage * 5));
  const stageName = CAREER_STAGES[stageIdx === 5 ? 4 : stageIdx];

  const handleSliderChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value / 100 });
  };

  return (
    <div className="h-full flex flex-col px-6 py-6 overflow-y-auto" style={{ background: 'var(--bg)' }}>
      {/* Logo Bar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="card-subtle w-9 h-9 flex items-center justify-center rounded-full">
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--sk)' }} />
        </div>
        <div>
          <h1 className="font-serif-zen text-xl font-semibold tracking-tight" style={{ color: 'var(--t1)' }}>
            Role<span style={{ color: 'var(--sk)' }}>Lens</span>
          </h1>
          <p className="text-[9px] font-semibold tracking-[0.25em] uppercase" style={{ color: 'var(--t3)' }}>
            The Decision Engine
          </p>
        </div>
      </div>

      {/* Lens Animation */}
      <LensAnimation />

      {/* Sliders */}
      <div className="space-y-7 mt-2 flex-1">
        {/* Risk Appetite */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>Risk Appetite</span>
          </div>
          <input type="range" className="nr mo w-full" min="0" max="100" value={settings.riskAppetite * 100}
            onChange={e => handleSliderChange('riskAppetite', +e.target.value)} />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Cautious</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Bold</span>
          </div>
        </div>

        {/* Life Anchors */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>Life Anchors</span>
          </div>
          <input type="range" className="nr w-full" min="0" max="100" value={settings.lifeAnchors * 100}
            onChange={e => handleSliderChange('lifeAnchors', +e.target.value)} />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Stability</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Growth</span>
          </div>
        </div>

        {/* Career Stage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>Career Stage</span>
          </div>
          <input type="range" className="nr wa w-full" min="0" max="100" value={settings.careerStage * 100}
            onChange={e => handleSliderChange('careerStage', +e.target.value)} />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Seedling</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Elder</span>
          </div>
          <p className="font-serif-zen text-center text-sm mt-2 font-medium" style={{ color: 'var(--wa)' }}>
            {stageName}
          </p>
        </div>

        {/* Self-Reflection */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--sf2)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>Self-Reflection</span>
          </div>
          <input type="range" className="nr w-full" min="0" max="100" value={settings.honestSelfReflection * 100}
            onChange={e => handleSliderChange('honestSelfReflection', +e.target.value)} />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Learning</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Expert</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 pt-5 space-y-1.5" style={{ borderTop: '1px solid var(--sf2)' }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.path && location.pathname === item.path;
          if (item.path) {
            return (
              <Link key={item.label} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium zen-transition ${isActive ? 'card-raised' : 'hover:opacity-80'}`}
                style={{ color: isActive ? 'var(--sk)' : 'var(--t2)' }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          }
          return (
            <button key={item.label}
              onClick={() => onAction?.(item.action)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left zen-transition hover:opacity-80"
              style={{ color: 'var(--t2)' }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Status */}
      <div className="mt-5 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid var(--sf2)' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--mo)' }} />
        <span className="text-[11px]" style={{ color: 'var(--t3)' }}>Profile active</span>
      </div>
    </div>
  );
}