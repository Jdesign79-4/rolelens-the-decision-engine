import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Check } from 'lucide-react';

export default function BenefitCard({ benefit, isEligible = true }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = (type) => {
    const icons = {
      health: '🏥',
      dental: '🦷',
      vision: '👁️',
      retirement: '🏦',
      pto: '🏖️',
      stock: '📈',
      insurance: '🛡️',
      wellness: '💪',
      education: '📚',
      commuter: '🚗',
      childcare: '👶',
      mental_health: '🧠'
    };
    return icons[type] || '✨';
  };

  const getValueColor = (type) => {
    const colors = {
      health: 'from-red-500 to-pink-500',
      dental: 'from-blue-500 to-cyan-500',
      vision: 'from-purple-500 to-indigo-500',
      retirement: 'from-amber-500 to-orange-500',
      pto: 'from-green-500 to-emerald-500',
      stock: 'from-violet-500 to-purple-500',
      insurance: 'from-slate-500 to-stone-500',
      wellness: 'from-teal-500 to-cyan-500',
      education: 'from-indigo-500 to-blue-500',
      commuter: 'from-yellow-500 to-amber-500',
      childcare: 'from-pink-500 to-rose-500',
      mental_health: 'from-green-500 to-teal-500'
    };
    return colors[type] || 'from-slate-500 to-slate-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
          isExpanded
            ? 'border-slate-300 bg-slate-50'
            : 'border-slate-100 bg-white hover:border-slate-200'
        } ${!isEligible ? 'opacity-60' : ''}`}
        disabled={!isEligible}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl">{getIcon(benefit.type)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-800">{benefit.name}</h4>
              {!isEligible && (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Not Eligible
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{benefit.description}</p>
            {benefit.estimatedValue && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs font-bold bg-gradient-to-r ${getValueColor(benefit.type)} bg-clip-text text-transparent`}>
                  Est. Value: ${benefit.estimatedValue.toLocaleString()}/year
                </span>
              </div>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
              {/* Coverage Details */}
              {benefit.coverageDetails && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Coverage</h5>
                  <p className="text-sm text-slate-600 leading-relaxed">{benefit.coverageDetails}</p>
                </div>
              )}

              {/* Eligibility */}
              {benefit.eligibility && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Eligibility</h5>
                  <ul className="space-y-1">
                    {benefit.eligibility.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enrollment Period */}
              {benefit.enrollmentPeriod && (
                <div className="p-3 rounded-lg bg-white border border-amber-200">
                  <p className="text-xs font-medium text-amber-700 mb-1">📅 Enrollment Period</p>
                  <p className="text-sm text-amber-600">{benefit.enrollmentPeriod}</p>
                </div>
              )}

              {/* Key Highlights */}
              {benefit.highlights && benefit.highlights.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Key Highlights</h5>
                  <ul className="space-y-1">
                    {benefit.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-base">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Provider Links */}
              {benefit.providerLinks && benefit.providerLinks.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Resources</h5>
                  <div className="space-y-2">
                    {benefit.providerLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Employee Contribution */}
              {benefit.employeeContribution && (
                <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
                  <p className="text-xs font-medium text-teal-700 mb-1">Your Cost</p>
                  <p className="text-sm font-semibold text-teal-900">{benefit.employeeContribution}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}