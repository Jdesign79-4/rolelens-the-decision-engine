import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, X, Calendar, CheckCircle2, Circle, Trash2, Plus, Copy, Zap, Linkedin } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ApplicationStrategyPlanner({ job, onClose }) {
  const [strategy, setStrategy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [copiedText, setCopiedText] = useState(null);

  useEffect(() => {
    generateStrategy();
  }, [job]);

  const generateStrategy = async () => {
    setIsLoading(true);
    setError(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior HR recruiter at a large publicly traded company. You know how fast hiring actually moves today.

Create a realistic application strategy for this job opportunity:

Company: ${job.meta.company}
Position: ${job.meta.title || 'General roles at this company'}
Location: ${job.meta.location || 'Not specified'}
Posting Date: ${job.meta.date || 'Recent'}
Today's Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

CRITICAL HIRING TIMELINE REALITY CHECK:
- Most job postings at large companies stay open 10-21 days, NOT months
- Competitive roles (design, engineering, product) often close in 7-14 days once posted
- Many companies use rolling reviews — early applicants get priority
- "Open until filled" typically means 2-4 weeks in practice
- Internal recruiter KPIs target 30-45 days from posting to OFFER, not just to close applications
- The best candidates apply within the FIRST WEEK of a posting going live

REALISTIC TIME ESTIMATES PER TASK (from the perspective of a qualified applicant who already has relevant experience):
Given these realities, generate:
1. Estimated application deadline — be aggressive and realistic. If the posting date is recent, the window is likely 7-14 days. Factor in that early applications get more attention.
2. A compressed, actionable preparation timeline measured in DAYS (not weeks/months). Use "Day 1", "Day 2-3", "Day 4-5" format. Do NOT include estimated hours.
3. Customized checklist of application components. Do NOT include estimated hours or time estimates.
4. First-draft cover letter talking points (3-5 key points that match job requirements)
5. Specific LinkedIn networking suggestions (types of people to connect with at this company)

Be specific, actionable, and urgency-driven. Do NOT pad timelines.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          applicationDeadline: {
            type: "object",
            properties: {
              estimatedDate: { type: "string" },
              reasoning: { type: "string" }
            }
          },
          timeline: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "number" },
                milestone: { type: "string" },
                tasks: { type: "array", items: { type: "string" } },
              }
            }
          },
          checklist: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["critical", "important", "optional"] }
              }
            }
          },
          coverLetterTalkingPoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                point: { type: "string" },
                evidence: { type: "string" },
                relevance: { type: "string" }
              }
            }
          },
          networkingSuggestions: {
            type: "object",
            properties: {
              targetRoles: { type: "array", items: { type: "string" } },
              strategy: { type: "string" },
              searchQueries: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    });

    setStrategy(result);
    
    // Initialize checklist with unchecked items
    setChecklist((result.checklist || []).map(({ estimatedHours, ...item }) => ({
      ...item,
      completed: false
    })));

    // Initialize timeline
    setTimeline(result.timeline || []);
    setIsLoading(false);
  };

  const toggleChecklistItem = (index) => {
    setChecklist(prev => {
      const newList = [...prev];
      newList[index].completed = !newList[index].completed;
      return newList;
    });
  };

  const deleteChecklistItem = (index) => {
    setChecklist(prev => prev.filter((_, i) => i !== index));
  };

  const addChecklistItem = () => {
    setChecklist(prev => [...prev, {
      item: 'New item',
      description: '',
      priority: 'important',
      completed: false
    }]);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const completionPercentage = checklist.length > 0 ? Math.round((checklist.filter(c => c.completed).length / checklist.length) * 100) : 0;


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Application Strategy</h2>
            <p className="text-sm text-slate-500 mt-1">{job.meta.company} • {job.meta.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
                <Zap className="absolute inset-0 m-auto w-5 h-5 text-slate-600" />
              </div>
              <p className="mt-4 text-slate-600 font-medium">Crafting your application strategy...</p>
              <p className="text-sm text-slate-500 mt-1">Analyzing role requirements and timeline</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : strategy ? (
            <div className="p-6 space-y-6">
              {/* Key Deadline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border border-red-200"
              >
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-600 font-medium">Estimated Application Deadline</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{strategy.applicationDeadline?.estimatedDate}</p>
                    <p className="text-sm text-red-600 mt-2">
                      {(strategy.applicationDeadline?.reasoning || '').split(/(https?:\/\/[^\s)]+)/g).map((part, i) =>
                        /^https?:\/\//.test(part) ? (
                          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-red-800 break-all">
                            {(() => { try { return new URL(part).hostname.replace('www.', ''); } catch { return part; } })()}
                          </a>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Progress Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-800">Application Progress</p>
                  <p className="text-2xl font-bold text-slate-800">{completionPercentage}%</p>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  {checklist.filter(c => c.completed).length} of {checklist.length} items completed
                </p>
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Preparation Timeline</h3>
                <div className="space-y-3">
                  {timeline.map((week, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-sm flex-shrink-0">
                          W{week.week}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{week.milestone}</p>
                          <ul className="mt-2 space-y-1">
                            {week.tasks.map((task, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                {task}
                              </li>
                            ))}
                          </ul>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Checklist */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Application Checklist</h3>
                  <button
                    onClick={addChecklistItem}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {checklist.map((item, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        item.completed
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleChecklistItem(idx)}
                          className="mt-1 flex-shrink-0"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${item.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {item.item}
                          </p>
                          {item.description && (
                            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              item.priority === 'important' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {item.priority}
                            </span>

                          </div>
                        </div>
                        <button
                          onClick={() => deleteChecklistItem(idx)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Cover Letter Talking Points */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Cover Letter Talking Points</h3>
                <div className="space-y-3">
                  {(strategy.coverLetterTalkingPoints || []).map((point, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-slate-800">{idx + 1}. {point.point}</p>
                        <button
                          onClick={() => copyToClipboard(point.point, `point-${idx}`)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {copiedText === `point-${idx}` ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mb-2"><strong>Evidence:</strong> {point.evidence}</p>
                      <p className="text-xs text-slate-500"><strong>Relevance:</strong> {point.relevance}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Networking Suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Linkedin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">LinkedIn Networking Strategy</p>
                    <p className="text-sm text-slate-600 mt-1">{strategy.networkingSuggestions?.strategy}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Target roles to connect with:</p>
                  <div className="flex flex-wrap gap-2">
                    {(strategy.networkingSuggestions?.targetRoles || []).map((role, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Search queries to use on LinkedIn:</p>
                    {(strategy.networkingSuggestions?.searchQueries || []).map((query, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg mb-2">
                        <code className="text-xs text-slate-600">{query}</code>
                        <button
                          onClick={() => copyToClipboard(query, `search-${idx}`)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          {copiedText === `search-${idx}` ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {strategy && !isLoading && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">Ready to apply? Track your progress above.</p>
            <Button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}