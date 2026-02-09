import React from 'react';

const OPTIONS = [
  { id: 'single_0', label: 'Single, no kids', short: 'Single' },
  { id: 'single_1', label: 'Single, 1 child', short: '1 child' },
  { id: 'single_2', label: 'Single, 2 children', short: '2 kids' },
  { id: '2adults_0', label: '2 adults, no kids', short: 'Couple' },
  { id: '2adults_1', label: '2 adults, 1 child', short: 'Family (1)' },
  { id: '2adults_2', label: '2 adults, 2 children', short: 'Family (2)' },
];

export default function FamilySelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
            value === opt.id
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {opt.short}
        </button>
      ))}
    </div>
  );
}

export function getFamilyLabel(id) {
  return OPTIONS.find(o => o.id === id)?.label || 'Single, no kids';
}