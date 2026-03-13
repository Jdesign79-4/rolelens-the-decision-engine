import React from 'react';

const BUTTONS = [
  { label: 'Saved Lists', icon: '📁', color: 'var(--sk)', bg: 'var(--skp)', action: 'savedLists' },
  { label: 'Interview Prep', icon: '📝', color: 'var(--wa)', bg: 'var(--wap)', action: 'interviewPrep' },
  { label: 'Application Plan', icon: '🗓', color: 'var(--mo)', bg: 'var(--mop)', action: 'applicationStrategy' },
  { label: 'Negotiate Salary', icon: '💰', color: 'var(--ha)', bg: 'var(--hap)', action: 'salaryNegotiation' },
  { label: 'Mock Interview', icon: '🎤', color: 'var(--sk)', bg: 'var(--skp)', action: 'mockInterview' },
  { label: 'Compare', icon: '📊', color: 'var(--wa)', bg: 'var(--wap)', action: 'compare' },
];

export default function ZenFeatureButtons({ onAction }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {BUTTONS.map(btn => (
        <button key={btn.action} onClick={() => onAction(btn.action)}
          className="card-subtle px-4 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 zen-transition hover:shadow-lg"
          style={{ color: btn.color }}>
          <span>{btn.icon}</span>
          {btn.label}
        </button>
      ))}
    </div>
  );
}