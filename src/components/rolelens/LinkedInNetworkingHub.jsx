import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, Linkedin, Copy, CheckCircle2, MessageSquare, Users, Megaphone, Sparkles, ChevronDown, ChevronUp, UserPlus, Hash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LinkedInNetworkingHub({ job, networkingSuggestions }) {
  const [profileUrl, setProfileUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [personalizedData, setPersonalizedData] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [expandedSections, setExpandedSections] = useState(['search']);

  const companyName = job?.meta?.company || '';
  const jobTitle = job?.meta?.title || 'roles at this company';

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const analyzeAndPersonalize = async () => {
    if (!profileUrl.trim()) return;
    setIsAnalyzing(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert LinkedIn career coach and networking strategist.

A job seeker wants to network their way into a role at a specific company. Analyze their LinkedIn profile and generate hyper-personalized networking assets.

JOB SEEKER'S LINKEDIN PROFILE URL: ${profileUrl}
TARGET COMPANY: ${companyName}
TARGET ROLE: ${jobTitle}

IMPORTANT: Visit the LinkedIn profile URL above and extract key information about the person: their current title, industry, skills, experience level, education, and any shared connections or interests with people at ${companyName}.

Generate the following:

1. CONNECTION REQUEST MESSAGES (3 variations for different target personas):
   Each message must be under 300 characters (LinkedIn limit for connection requests).
   - One for a HIRING MANAGER or team lead in the relevant department
   - One for a PEER (someone in a similar role at the company)
   - One for a RECRUITER at the company
   Each should reference something specific from the user's background that creates a genuine connection point. DO NOT be generic. Reference specific skills, experiences, or mutual interests.

2. FOLLOW-UP MESSAGES (3 variations, one for each persona above):
   These are sent AFTER the connection is accepted. 200-400 words each.
   - Should feel natural, not transactional
   - Include a specific question that invites conversation
   - Reference the target role without being pushy
   - Mention something specific about the company that shows genuine research

3. LINKEDIN GROUPS TO JOIN (5 specific groups):
   Find REAL LinkedIn groups related to the company's industry, the role's function, and the user's expertise.
   For each group provide: name, description of why it's relevant, and a strategy for engaging (what to post/comment on).

4. CONTENT ENGAGEMENT STRATEGY:
   - 5 specific types of posts to engage with on LinkedIn to get noticed by people at ${companyName}
   - 3 original post ideas the user could publish to demonstrate expertise relevant to this role
   - 2-3 hashtags commonly used by employees at ${companyName} or in the relevant industry

5. PROFILE OPTIMIZATION TIPS (3-5 specific suggestions):
   Based on what you can see from their profile, suggest specific changes to their headline, about section, or experience descriptions that would make them more attractive for this specific role.

Be specific. Reference the user's actual background. No generic advice.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          profileSummary: {
            type: "object",
            properties: {
              name: { type: "string" },
              currentTitle: { type: "string" },
              keyStrengths: { type: "array", items: { type: "string" } },
              connectionPoints: { type: "array", items: { type: "string" } }
            }
          },
          connectionMessages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                targetPersona: { type: "string" },
                message: { type: "string" },
                whyItWorks: { type: "string" }
              }
            }
          },
          followUpMessages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                targetPersona: { type: "string" },
                message: { type: "string" },
                keyTechnique: { type: "string" }
              }
            }
          },
          groups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                relevance: { type: "string" },
                engagementStrategy: { type: "string" },
                searchUrl: { type: "string" }
              }
            }
          },
          contentStrategy: {
            type: "object",
            properties: {
              postsToEngageWith: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    why: { type: "string" },
                    exampleAction: { type: "string" }
                  }
                }
              },
              originalPostIdeas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topic: { type: "string" },
                    hook: { type: "string" },
                    angle: { type: "string" }
                  }
                }
              },
              hashtags: { type: "array", items: { type: "string" } }
            }
          },
          profileTips: {
            type: "array",
            items: {
              type: "object",
              properties: {
                section: { type: "string" },
                currentIssue: { type: "string" },
                suggestion: { type: "string" }
              }
            }
          }
        }
      }
    });

    setPersonalizedData(result);
    setIsAnalyzing(false);
    setExpandedSections(['profile', 'messages', 'groups', 'content', 'tips']);
  };

  const searchQueries = networkingSuggestions?.searchQueries || [];
  const searchUrls = networkingSuggestions?.searchUrls || [];
  const targetRoles = networkingSuggestions?.targetRoles || [];

  return (
    <div className="space-y-4">
      {/* LinkedIn Search Section */}
      <SectionCard
        title="Find People to Connect With"
        icon={<Users className="w-4 h-4" />}
        isExpanded={expandedSections.includes('search')}
        onToggle={() => toggleSection('search')}
      >
        <p className="text-sm text-slate-600 mb-3">{networkingSuggestions?.strategy}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {targetRoles.map((role, idx) => (
            <span key={idx} className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              {role}
            </span>
          ))}
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Search on LinkedIn:</p>
        {searchQueries.map((query, idx) => {
          const linkedinUrl = searchUrls[idx] || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
          return (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg mb-2 group border border-slate-100">
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium flex-1 min-w-0"
              >
                <Linkedin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{query}</span>
                <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">↗ Open</span>
              </a>
              <button
                onClick={() => copyToClipboard(query, `search-${idx}`)}
                className="p-1 hover:bg-slate-100 rounded transition-colors ml-2 flex-shrink-0"
              >
                {copiedText === `search-${idx}` ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          );
        })}
      </SectionCard>

      {/* Personalization Input */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-indigo-200">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h4 className="font-bold text-slate-800">AI-Powered Personalized Networking</h4>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Paste your LinkedIn profile URL below and we'll analyze your background to generate personalized connection messages, engagement strategies, and profile optimization tips for targeting <strong>{companyName}</strong>.
        </p>
        <div className="flex gap-2">
          <Input
            value={profileUrl}
            onChange={e => setProfileUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/your-profile"
            className="flex-1 bg-white"
            disabled={isAnalyzing}
          />
          <Button
            onClick={analyzeAndPersonalize}
            disabled={isAnalyzing || !profileUrl.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAnalyzing ? 'Analyzing...' : 'Personalize'}
          </Button>
        </div>
        {isAnalyzing && (
          <div className="mt-3 p-3 rounded-lg bg-indigo-100/50 border border-indigo-200">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
              <p className="text-xs text-indigo-700">Analyzing your profile, researching {companyName}, and crafting personalized strategies...</p>
            </div>
          </div>
        )}
      </div>

      {/* Personalized Results */}
      {personalizedData && (
        <AnimatePresence>
          {/* Profile Summary */}
          {personalizedData.profileSummary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SectionCard
                title={`Profile Analysis: ${personalizedData.profileSummary.name || 'Your Profile'}`}
                icon={<UserPlus className="w-4 h-4" />}
                isExpanded={expandedSections.includes('profile')}
                onToggle={() => toggleSection('profile')}
              >
                {personalizedData.profileSummary.currentTitle && (
                  <p className="text-sm text-slate-600 mb-2">Current: <strong>{personalizedData.profileSummary.currentTitle}</strong></p>
                )}
                {personalizedData.profileSummary.keyStrengths?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Key Strengths for This Role:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {personalizedData.profileSummary.keyStrengths.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {personalizedData.profileSummary.connectionPoints?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Connection Points with {companyName}:</p>
                    <ul className="space-y-1">
                      {personalizedData.profileSummary.connectionPoints.map((cp, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5">→</span> {cp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}

          {/* Connection & Follow-Up Messages */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SectionCard
              title="Personalized Messages"
              icon={<MessageSquare className="w-4 h-4" />}
              isExpanded={expandedSections.includes('messages')}
              onToggle={() => toggleSection('messages')}
            >
              <div className="space-y-4">
                {(personalizedData.connectionMessages || []).map((msg, idx) => {
                  const followUp = personalizedData.followUpMessages?.[idx];
                  return (
                    <MessageCard
                      key={idx}
                      targetPersona={msg.targetPersona}
                      connectionMessage={msg.message}
                      whyItWorks={msg.whyItWorks}
                      followUpMessage={followUp?.message}
                      followUpTechnique={followUp?.keyTechnique}
                      copyToClipboard={copyToClipboard}
                      copiedText={copiedText}
                      index={idx}
                    />
                  );
                })}
              </div>
            </SectionCard>
          </motion.div>

          {/* Groups */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SectionCard
              title="LinkedIn Groups to Join"
              icon={<Users className="w-4 h-4" />}
              isExpanded={expandedSections.includes('groups')}
              onToggle={() => toggleSection('groups')}
            >
              <div className="space-y-3">
                {(personalizedData.groups || []).map((group, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <a
                          href={group.searchUrl || `https://www.linkedin.com/search/results/groups/?keywords=${encodeURIComponent(group.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-700 hover:text-blue-900 text-sm flex items-center gap-1.5"
                        >
                          <Hash className="w-3.5 h-3.5" />
                          {group.name}
                          <span className="text-xs text-blue-400">↗</span>
                        </a>
                        <p className="text-xs text-slate-500 mt-1">{group.relevance}</p>
                      </div>
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                      <p className="text-xs text-indigo-700"><strong>Engagement strategy:</strong> {group.engagementStrategy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>

          {/* Content Strategy */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <SectionCard
              title="Content Engagement Strategy"
              icon={<Megaphone className="w-4 h-4" />}
              isExpanded={expandedSections.includes('content')}
              onToggle={() => toggleSection('content')}
            >
              {/* Posts to engage with */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Posts to Engage With:</p>
                <div className="space-y-2">
                  {(personalizedData.contentStrategy?.postsToEngageWith || []).map((post, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <p className="text-sm font-semibold text-slate-800">{post.type}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{post.why}</p>
                      <p className="text-xs text-indigo-600 mt-1.5 font-medium">💡 Action: {post.exampleAction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Original post ideas */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Original Posts You Should Publish:</p>
                <div className="space-y-2">
                  {(personalizedData.contentStrategy?.originalPostIdeas || []).map((idea, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                      <p className="text-sm font-semibold text-slate-800">{idea.topic}</p>
                      <p className="text-xs text-emerald-700 mt-1"><strong>Hook:</strong> "{idea.hook}"</p>
                      <p className="text-xs text-slate-600 mt-1">{idea.angle}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              {personalizedData.contentStrategy?.hashtags?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Hashtags to Use:</p>
                  <div className="flex flex-wrap gap-2">
                    {personalizedData.contentStrategy.hashtags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => copyToClipboard(tag, `hashtag-${idx}`)}
                        className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        {copiedText === `hashtag-${idx}` ? '✓ Copied' : tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Profile Tips */}
          {personalizedData.profileTips?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <SectionCard
                title="Profile Optimization Tips"
                icon={<UserPlus className="w-4 h-4" />}
                isExpanded={expandedSections.includes('tips')}
                onToggle={() => toggleSection('tips')}
              >
                <div className="space-y-3">
                  {personalizedData.profileTips.map((tip, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                      <p className="text-xs font-bold text-amber-800 uppercase mb-1">{tip.section}</p>
                      {tip.currentIssue && (
                        <p className="text-sm text-slate-600 mb-1.5"><strong>Issue:</strong> {tip.currentIssue}</p>
                      )}
                      <p className="text-sm text-slate-800"><strong>Suggestion:</strong> {tip.suggestion}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="text-center text-xs text-slate-400 pt-2">
        Networking suggestions are AI-generated • Always personalize before sending • Verify group names on LinkedIn
      </div>
    </div>
  );
}

function SectionCard({ title, icon, isExpanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          {icon} {title}
        </h4>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageCard({ targetPersona, connectionMessage, whyItWorks, followUpMessage, followUpTechnique, copyToClipboard, copiedText, index }) {
  const [showFollowUp, setShowFollowUp] = useState(false);

  const personaIcons = {
    0: '👤',
    1: '🤝',
    2: '📋'
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-slate-800">{personaIcons[index] || '👤'} {targetPersona}</p>
          <span className="text-xs text-slate-400">{connectionMessage?.length || 0}/300 chars</span>
        </div>

        {/* Connection request */}
        <div className="p-3 rounded-lg bg-white border border-blue-200 mb-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-slate-700 leading-relaxed flex-1">{connectionMessage}</p>
            <button
              onClick={() => copyToClipboard(connectionMessage, `conn-${index}`)}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
            >
              {copiedText === `conn-${index}` ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-blue-600 italic">💡 {whyItWorks}</p>
      </div>

      {/* Follow-up toggle */}
      {followUpMessage && (
        <>
          <button
            onClick={() => setShowFollowUp(!showFollowUp)}
            className="w-full px-4 py-2.5 bg-indigo-50 border-t border-indigo-100 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center justify-between"
          >
            <span>📨 Follow-Up Message (after they accept)</span>
            {showFollowUp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <AnimatePresence>
            {showFollowUp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line flex-1">{followUpMessage}</p>
                    <button
                      onClick={() => copyToClipboard(followUpMessage, `followup-${index}`)}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                    >
                      {copiedText === `followup-${index}` ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  {followUpTechnique && (
                    <p className="text-xs text-indigo-600 mt-2 italic">🎯 Technique: {followUpTechnique}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}