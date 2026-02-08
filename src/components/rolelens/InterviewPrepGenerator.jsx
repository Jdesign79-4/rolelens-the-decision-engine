import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, X, Download, FileText, ClipboardList, Lightbulb, BookOpen, MessageSquare, Shield, AlertTriangle, ChevronDown, ChevronUp, Copy, CheckCircle2, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InterviewPrepGenerator({ job, onClose }) {
  const [prepData, setPrepData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cheatsheet');
  const [error, setError] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [expandedStars, setExpandedStars] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const companyName = job?.meta?.company || '';
  const jobTitle = job?.meta?.title || '';

  useEffect(() => {
    generatePrepKit();
  }, [job]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const generatePrepKit = async () => {
    setIsLoading(true);
    setError(null);

    // Split into two parallel LLM calls for better reliability
    const [questionsResult, strategyResult] = await Promise.all([
      // Call 1: Interview questions, STAR frameworks, and technical topics
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior hiring manager and interview coach with 15+ years of experience. Create a comprehensive, role-specific interview preparation kit.

COMPANY: ${companyName}
POSITION: ${jobTitle}
LOCATION: ${job?.meta?.location || 'Not specified'}

CRITICAL INSTRUCTIONS — Based on Indeed's latest interview research (Dec 2025):

QUESTION GENERATION RULES:
Generate 12 interview questions using this EXACT distribution tailored to the SPECIFIC role type:
- 4 behavioral questions (using STAR method — Situation, Task, Action, Result)
- 3 technical/role-specific questions (deeply specific to ${jobTitle} skills and tools)
- 2 situational/hypothetical questions ("What would you do if...")
- 1 "Tell me about yourself" opener (role-specific framing)
- 1 "Why do you want to work here?" question (company-specific)
- 1 weakness/growth question ("What is your greatest weakness?")

ROLE-SPECIFIC TAILORING:
Adapt questions based on the role type:
- For ENGINEERING roles: include system design, debugging scenarios, code review questions, tech stack depth
- For DESIGN roles: include portfolio walkthrough, design process, stakeholder feedback, design systems
- For SALES roles: include pipeline management, objection handling, quota achievement, territory strategy
- For MARKETING roles: include campaign metrics, channel strategy, brand voice, ROI measurement
- For FINANCE roles: include financial modeling, risk assessment, regulatory knowledge, forecasting
- For MANAGEMENT roles: include team building, conflict resolution, performance management, strategic planning
- For ENTRY-LEVEL roles: focus on transferable skills, academic projects, eagerness to learn, growth mindset
- For CREATIVE roles: include creative process, collaboration, feedback handling, inspiration sources
- For HEALTHCARE roles: include patient care scenarios, compliance, team coordination, stress management
- For CUSTOMER-FACING roles: include de-escalation, empathy, communication style, problem resolution

For EACH question provide:
- The question text
- Category (behavioral/technical/situational/opener/motivation/weakness)
- difficulty (easy/medium/hard)
- A detailed tip on how to answer (2-3 sentences, actionable)
- Why the interviewer asks this (what they're really assessing)
- A common mistake candidates make when answering
- For behavioral questions: A complete STAR framework example tailored to ${jobTitle}

STAR METHOD GUIDANCE (from Indeed):
- Situation: Set the stage with 2-3 key details. Spend the LEAST time here.
- Task: Describe YOUR specific responsibility. Keep brief.
- Action: This is the MOST important part. Use "I" not "we". Be specific about YOUR contributions.
- Result: Quantify outcomes when possible. Mention what you learned.

TECHNICAL TOPICS:
Generate 6-8 technical topics specific to ${jobTitle} at ${companyName}. For each:
- Topic name
- Importance level (critical/important/nice-to-have)
- A specific study guide (what to review, resources to check)
- How it might come up in the interview (sample question or scenario)

WEAKNESS GUIDANCE (from Indeed):
Use the formula: Weakness + Context + Improvement Measures
- Choose a REAL weakness that is NOT an essential trait for this role
- Show self-awareness and active improvement
- Never say you have no weaknesses
- Frame positively but authentically
- Include 3 weakness examples appropriate for ${jobTitle} with sample answers`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            interviewQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  category: { type: "string" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  tips: { type: "string" },
                  whatTheyAssess: { type: "string" },
                  commonMistake: { type: "string" },
                  starFramework: {
                    type: "object",
                    properties: {
                      situation: { type: "string" },
                      task: { type: "string" },
                      action: { type: "string" },
                      result: { type: "string" }
                    }
                  }
                }
              }
            },
            technicalTopics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  importance: { type: "string", enum: ["critical", "important", "nice-to-have"] },
                  reviewGuide: { type: "string" },
                  howItComesUp: { type: "string" }
                }
              }
            },
            weaknessExamples: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  weakness: { type: "string" },
                  sampleAnswer: { type: "string" },
                  whyItWorks: { type: "string" }
                }
              }
            }
          }
        }
      }),

      // Call 2: Company cheat sheet, candidate questions, interview format, do's/don'ts, follow-up
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a career coach preparing a candidate for an interview at ${companyName} for the ${jobTitle} role.

Based on Indeed's interview preparation guide (Dec 2025), generate:

1. COMPANY CHEAT SHEET — Research ${companyName} thoroughly and provide:
   - Mission statement and core values (from their website)
   - Recent news and developments (last 3-6 months)
   - Products/services overview (what they make/do)
   - Company culture insights (from Glassdoor, Blind, reviews)
   - Growth trajectory and market position
   - Key competitors and how ${companyName} differentiates
   - Leadership team (CEO, relevant VPs)
   - Interview process overview (what to expect — phone screen, technical, panel, etc.)

2. SMART QUESTIONS TO ASK (7-8 questions):
   For each provide the question and WHY it's smart to ask.
   Questions should demonstrate:
   - Research about ${companyName} specifically
   - Interest in team dynamics and culture
   - Understanding of the role's challenges
   - Forward-thinking about growth and impact
   DO NOT include generic questions. Every question should reference something specific about ${companyName} or ${jobTitle}.

3. INTERVIEW FORMAT GUIDE:
   - Expected interview stages for ${jobTitle} at ${companyName}
   - Typical duration of each stage
   - Who you'll likely meet (recruiter, hiring manager, team, cross-functional)
   - Format tips (phone vs video vs in-person best practices)

4. DO'S AND DON'TS specific to this role:
   - 5 do's (specific actions to take)
   - 5 don'ts (specific things to avoid)
   Based on Indeed's interview advice and ${companyName}'s culture.

5. POST-INTERVIEW FOLLOW-UP PLAN:
   - When to send a thank-you email (within 24 hours)
   - Template for the thank-you email (personalized to ${companyName})
   - How to follow up if you don't hear back (timeline + script)
   - What to do while waiting

6. TELL ME ABOUT YOURSELF — Framework:
   Using Indeed's Past-Present-Future technique:
   - Past: Brief relevant background
   - Present: Current situation and why this opportunity
   - Future: How this role fits career trajectory
   Provide a sample 60-90 second answer tailored to ${jobTitle} at ${companyName}.

7. WHY DO YOU WANT TO WORK HERE — Framework:
   Using Indeed's research-based approach:
   - Reference company mission/values you genuinely connect with
   - Mention specific products, projects, or initiatives
   - Connect your career goals to the company's direction
   Provide a sample answer.

Be specific to ${companyName}. No generic advice.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            cheatSheet: {
              type: "object",
              properties: {
                companyMission: { type: "string" },
                recentNews: { type: "string" },
                productsServices: { type: "string" },
                companyCulture: { type: "string" },
                growthTrajectory: { type: "string" },
                competitors: { type: "string" },
                leadership: { type: "string" },
                interviewProcessOverview: { type: "string" }
              }
            },
            candidateQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            interviewFormat: {
              type: "object",
              properties: {
                stages: { type: "array", items: { type: "object", properties: { stage: { type: "string" }, duration: { type: "string" }, who: { type: "string" }, tips: { type: "string" } } } }
              }
            },
            dosAndDonts: {
              type: "object",
              properties: {
                dos: { type: "array", items: { type: "string" } },
                donts: { type: "array", items: { type: "string" } }
              }
            },
            followUpPlan: {
              type: "object",
              properties: {
                thankYouTemplate: { type: "string" },
                followUpTimeline: { type: "string" },
                followUpScript: { type: "string" },
                whileWaiting: { type: "string" }
              }
            },
            tellMeAboutYourself: {
              type: "object",
              properties: {
                framework: { type: "string" },
                sampleAnswer: { type: "string" }
              }
            },
            whyWorkHere: {
              type: "object",
              properties: {
                framework: { type: "string" },
                sampleAnswer: { type: "string" }
              }
            }
          }
        }
      })
    ]);

    // Merge both results
    setPrepData({
      ...questionsResult,
      ...strategyResult
    });
    setIsLoading(false);
  };

  const exportAsMarkdown = () => {
    if (!prepData) return;
    let md = `# Interview Prep Kit\n## ${companyName} - ${jobTitle}\n\n`;

    if (prepData.cheatSheet) {
      md += `### Company Cheat Sheet\n`;
      md += `**Mission:** ${prepData.cheatSheet.companyMission}\n\n`;
      md += `**Recent News:** ${prepData.cheatSheet.recentNews}\n\n`;
      md += `**Products/Services:** ${prepData.cheatSheet.productsServices || ''}\n\n`;
      md += `**Culture:** ${prepData.cheatSheet.companyCulture}\n\n`;
      md += `**Growth:** ${prepData.cheatSheet.growthTrajectory || ''}\n\n`;
    }

    md += `### Interview Questions\n\n`;
    (prepData.interviewQuestions || []).forEach((q, i) => {
      md += `${i + 1}. **${q.question}** (${q.category})\n`;
      md += `   *Tip:* ${q.tips}\n`;
      if (q.starFramework?.situation) {
        md += `   **STAR:** S: ${q.starFramework.situation} | T: ${q.starFramework.task} | A: ${q.starFramework.action} | R: ${q.starFramework.result}\n`;
      }
      md += `\n`;
    });

    md += `### Technical Topics\n\n`;
    (prepData.technicalTopics || []).forEach(t => {
      md += `- **${t.topic}** (${t.importance}): ${t.reviewGuide}\n`;
    });

    md += `\n### Questions to Ask\n\n`;
    (prepData.candidateQuestions || []).forEach((q, i) => {
      md += `${i + 1}. ${q.question}\n   *Why:* ${q.rationale}\n\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md));
    element.setAttribute('download', `${companyName}_interview_prep.md`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportAsPDF = async () => {
    if (!prepData) return;
    const element = document.getElementById('prep-content');
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    pdf.save(`${companyName}_interview_prep.pdf`);
  };

  const tabs = [
    { id: 'cheatsheet', label: 'Cheat Sheet', icon: BookOpen },
    { id: 'questions', label: 'Q&A Prep', icon: ClipboardList },
    { id: 'technical', label: 'Technical', icon: FileText },
    { id: 'openers', label: 'Key Openers', icon: Zap },
    { id: 'candidate', label: 'Your Questions', icon: MessageSquare },
    { id: 'format', label: 'Format & Tips', icon: Shield },
    { id: 'followup', label: 'Follow-Up', icon: Lightbulb }
  ];

  const difficultyColor = (d) => {
    if (d === 'easy') return 'bg-emerald-100 text-emerald-700';
    if (d === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const categoryColor = (c) => {
    const map = {
      behavioral: 'bg-purple-100 text-purple-700',
      technical: 'bg-blue-100 text-blue-700',
      situational: 'bg-amber-100 text-amber-700',
      opener: 'bg-teal-100 text-teal-700',
      motivation: 'bg-emerald-100 text-emerald-700',
      weakness: 'bg-rose-100 text-rose-700'
    };
    return map[c] || 'bg-slate-100 text-slate-700';
  };

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
            <h2 className="text-2xl font-bold text-slate-800">Interview Prep Kit</h2>
            <p className="text-sm text-slate-500 mt-1">{companyName} • {jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
                <Lightbulb className="absolute inset-0 m-auto w-5 h-5 text-indigo-600" />
              </div>
              <p className="mt-4 text-slate-600 font-medium">Generating your interview prep kit...</p>
              <p className="text-sm text-slate-500 mt-1">Researching {companyName}, crafting role-specific questions, and building STAR frameworks</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : prepData ? (
            <div id="prep-content" className="p-6 space-y-6">
              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2.5 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-indigo-600 text-indigo-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* === CHEAT SHEET TAB === */}
              {activeTab === 'cheatsheet' && prepData.cheatSheet && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {[
                    { title: 'Mission & Values', content: prepData.cheatSheet.companyMission, emoji: '🎯' },
                    { title: 'Products & Services', content: prepData.cheatSheet.productsServices, emoji: '📦' },
                    { title: 'Recent News', content: prepData.cheatSheet.recentNews, emoji: '📰' },
                    { title: 'Company Culture', content: prepData.cheatSheet.companyCulture, emoji: '❤️' },
                    { title: 'Growth & Market Position', content: prepData.cheatSheet.growthTrajectory, emoji: '📈' },
                    { title: 'Competitors', content: prepData.cheatSheet.competitors, emoji: '⚔️' },
                    { title: 'Leadership', content: prepData.cheatSheet.leadership, emoji: '👤' },
                    { title: 'Interview Process', content: prepData.cheatSheet.interviewProcessOverview, emoji: '🗓️' }
                  ].filter(s => s.content).map((section, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h3 className="text-base font-semibold text-slate-800 mb-2">{section.emoji} {section.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* === QUESTIONS TAB === */}
              {activeTab === 'questions' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2">12 role-specific questions with answer strategies. Click any question to expand.</p>
                  {(prepData.interviewQuestions || []).map((q, i) => {
                    const isExpanded = expandedQuestions[i];
                    const star = q.starFramework;
                    return (
                      <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                        <button
                          onClick={() => setExpandedQuestions(prev => ({ ...prev, [i]: !prev[i] }))}
                          className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-slate-800 text-sm flex-1">{i + 1}. {q.question}</h4>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor(q.category)}`}>{q.category}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                                  <p className="text-xs font-bold text-indigo-700 uppercase mb-1">How to Answer</p>
                                  <p className="text-sm text-slate-700">{q.tips}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                  <p className="text-xs font-bold text-blue-700 uppercase mb-1">What They're Really Assessing</p>
                                  <p className="text-sm text-slate-700">{q.whatTheyAssess}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                  <p className="text-xs font-bold text-red-700 uppercase mb-1">Common Mistake</p>
                                  <p className="text-sm text-slate-700">{q.commonMistake}</p>
                                </div>
                                {star?.situation && (
                                  <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                                    <p className="text-xs font-bold text-violet-700 uppercase mb-2">⭐ STAR Framework Example</p>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-bold text-violet-700">S — Situation:</span> <span className="text-slate-700">{star.situation}</span></p>
                                      <p><span className="font-bold text-violet-700">T — Task:</span> <span className="text-slate-700">{star.task}</span></p>
                                      <p><span className="font-bold text-violet-700">A — Action:</span> <span className="text-slate-700">{star.action}</span></p>
                                      <p><span className="font-bold text-violet-700">R — Result:</span> <span className="text-slate-700">{star.result}</span></p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* === TECHNICAL TOPICS TAB === */}
              {activeTab === 'technical' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {(prepData.technicalTopics || []).map((t, i) => (
                    <div key={i} className="p-4 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800">{t.topic}</h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          t.importance === 'critical' ? 'bg-red-100 text-red-700' :
                          t.importance === 'important' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{t.importance}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{t.reviewGuide}</p>
                      {t.howItComesUp && (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-xs text-indigo-700"><strong>💡 How it comes up:</strong> {t.howItComesUp}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Weakness Examples */}
                  {prepData.weaknessExamples?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        "What Is Your Greatest Weakness?" — Sample Answers
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">Use the formula: Weakness + Context + Improvement Measures (from Indeed's guide)</p>
                      <div className="space-y-3">
                        {prepData.weaknessExamples.map((w, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                            <p className="text-sm font-bold text-slate-800 mb-1">Weakness: "{w.weakness}"</p>
                            <div className="p-3 rounded-lg bg-white border border-amber-100 mb-2">
                              <p className="text-sm text-slate-700 italic">"{w.sampleAnswer}"</p>
                            </div>
                            <p className="text-xs text-amber-700">✓ {w.whyItWorks}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* === KEY OPENERS TAB === */}
              {activeTab === 'openers' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Tell Me About Yourself */}
                  {prepData.tellMeAboutYourself && (
                    <div className="rounded-2xl border-2 border-teal-200 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200">
                        <h3 className="text-base font-bold text-slate-800">🎤 "Tell Me About Yourself"</h3>
                        <p className="text-xs text-teal-700 mt-1">The most important 60-90 seconds of your interview. Use the Past → Present → Future framework.</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
                          <p className="text-xs font-bold text-teal-700 uppercase mb-1">Framework</p>
                          <p className="text-sm text-slate-700">{prepData.tellMeAboutYourself.framework}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase">Sample Answer</p>
                            <button
                              onClick={() => copyToClipboard(prepData.tellMeAboutYourself.sampleAnswer, 'tma')}
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                            >
                              {copiedText === 'tma' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedText === 'tma' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed italic">"{prepData.tellMeAboutYourself.sampleAnswer}"</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Why Do You Want to Work Here */}
                  {prepData.whyWorkHere && (
                    <div className="rounded-2xl border-2 border-indigo-200 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-200">
                        <h3 className="text-base font-bold text-slate-800">🏢 "Why Do You Want to Work Here?"</h3>
                        <p className="text-xs text-indigo-700 mt-1">Show you've done your homework. Reference specific things about {companyName}.</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                          <p className="text-xs font-bold text-indigo-700 uppercase mb-1">Framework</p>
                          <p className="text-sm text-slate-700">{prepData.whyWorkHere.framework}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase">Sample Answer</p>
                            <button
                              onClick={() => copyToClipboard(prepData.whyWorkHere.sampleAnswer, 'wwh')}
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                            >
                              {copiedText === 'wwh' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedText === 'wwh' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed italic">"{prepData.whyWorkHere.sampleAnswer}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* === CANDIDATE QUESTIONS TAB === */}
              {activeTab === 'candidate' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2">Smart questions show you're serious about {companyName}. Ask 3-4 of these.</p>
                  {(prepData.candidateQuestions || []).map((q, i) => (
                    <div key={i} className="p-4 bg-white rounded-xl border border-slate-200">
                      <h4 className="font-semibold text-slate-800 text-sm mb-2">{i + 1}. "{q.question}"</h4>
                      <p className="text-xs text-indigo-600"><strong>Why ask:</strong> {q.rationale}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* === FORMAT & TIPS TAB === */}
              {activeTab === 'format' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Interview Stages */}
                  {prepData.interviewFormat?.stages?.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 mb-3">📋 Expected Interview Stages</h3>
                      <div className="space-y-2">
                        {prepData.interviewFormat.stages.map((s, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">{idx + 1}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-800 text-sm">{s.stage}</p>
                                <span className="text-xs text-slate-500">~{s.duration}</span>
                              </div>
                              <p className="text-xs text-slate-500 mb-1">With: {s.who}</p>
                              <p className="text-xs text-indigo-600">{s.tips}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Do's and Don'ts */}
                  {prepData.dosAndDonts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <h4 className="font-bold text-emerald-800 mb-3">✅ Do's</h4>
                        <div className="space-y-2">
                          {(prepData.dosAndDonts.dos || []).map((d, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-slate-700">{d}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                        <h4 className="font-bold text-red-800 mb-3">❌ Don'ts</h4>
                        <div className="space-y-2">
                          {(prepData.dosAndDonts.donts || []).map((d, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-slate-700">{d}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* === FOLLOW-UP TAB === */}
              {activeTab === 'followup' && prepData.followUpPlan && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">📧 Thank-You Email Template</h3>
                    <p className="text-xs text-slate-500 mb-3">Send within 24 hours of your interview.</p>
                    <div className="p-3 rounded-lg bg-white border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Template</span>
                        <button
                          onClick={() => copyToClipboard(prepData.followUpPlan.thankYouTemplate, 'thankyou')}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          {copiedText === 'thankyou' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedText === 'thankyou' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{prepData.followUpPlan.thankYouTemplate}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">⏰ Follow-Up Timeline</h3>
                    <p className="text-sm text-slate-700">{prepData.followUpPlan.followUpTimeline}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">📞 Follow-Up Script</h3>
                    <div className="p-3 rounded-lg bg-white border border-violet-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Script</span>
                        <button
                          onClick={() => copyToClipboard(prepData.followUpPlan.followUpScript, 'followup')}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          {copiedText === 'followup' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedText === 'followup' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-line">{prepData.followUpPlan.followUpScript}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">⏳ While You Wait</h3>
                    <p className="text-sm text-slate-700">{prepData.followUpPlan.whileWaiting}</p>
                  </div>
                </motion.div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {prepData && !isLoading && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">Based on Indeed's interview research (Dec 2025)</p>
            <div className="flex gap-2">
              <Button onClick={exportAsMarkdown} variant="outline" className="gap-2">
                <FileText className="w-4 h-4" /> Export Markdown
              </Button>
              <Button onClick={exportAsPDF} className="gap-2 bg-slate-800 hover:bg-slate-700 text-white">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}