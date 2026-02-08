/**
 * AI Collaboration Opportunity Scoring Engine
 * Calculates how AI impacts a role: Augmentation vs Transformation vs Adaptation
 */

// Known AI programs by company — expanded with impact severity and timelines
const KNOWN_AI_PROGRAMS = {
  'salesforce': {
    program: 'AgentForce',
    targetRoles: ['sales', 'sdr', 'customer service', 'support', 'account'],
    strategy: 'REPLACEMENT',
    details: 'AgentForce AI agents handle sales development and customer service autonomously',
    riskIncrease: 25,
    severity: 'HIGH',
    impactTimeline: '6-12 months',
    headcountImpact: '4,000+ employees laid off in 2024 coinciding with rollout',
    sourceDate: '2024-09',
    mitigations: ['Move to enterprise/complex sales', 'Become AI tool manager', 'Specialize in relationship-driven accounts']
  },
  'klarna': {
    program: 'AI Customer Service',
    targetRoles: ['customer service', 'support'],
    strategy: 'REPLACEMENT',
    details: 'AI chatbot handling 2/3 of customer service chats, equivalent to 700 FTE',
    riskIncrease: 30,
    severity: 'CRITICAL',
    impactTimeline: '3-6 months',
    headcountImpact: 'AI doing work of 700 customer service agents',
    sourceDate: '2024-02',
    mitigations: ['Transition to Customer Success', 'Specialize in escalation handling', 'Learn AI system oversight']
  },
  'microsoft': {
    program: 'Microsoft 365 Copilot',
    targetRoles: ['content', 'analyst', 'coordinator'],
    strategy: 'AUGMENTATION',
    details: 'AI assistant integrated into Office suite for productivity enhancement',
    riskIncrease: -10,
    severity: 'LOW',
    impactTimeline: '12-24 months',
    headcountImpact: 'Positioned as productivity tool, not replacement',
    sourceDate: '2023-03',
    mitigations: ['Master Copilot features early', 'Focus on strategic work AI assists with']
  },
  'google': {
    program: 'Gemini AI Integration',
    targetRoles: ['content', 'analyst', 'marketing', 'support'],
    strategy: 'MIXED',
    details: 'Gemini AI integrated across Workspace and Search; some ad sales roles reduced',
    riskIncrease: 10,
    severity: 'MODERATE',
    impactTimeline: '12-18 months',
    headcountImpact: 'Selective headcount reductions in ads and support, growth in AI roles',
    sourceDate: '2024-01',
    mitigations: ['Develop AI-native skills', 'Move toward ML/AI engineering', 'Build cross-functional expertise']
  },
  'meta': {
    program: 'Meta AI Efficiency',
    targetRoles: ['recruiter', 'hr', 'coordinator', 'content moderator'],
    strategy: 'REPLACEMENT',
    details: 'Year of Efficiency layoffs + AI content moderation replacing human reviewers',
    riskIncrease: 20,
    severity: 'HIGH',
    impactTimeline: '6-12 months',
    headcountImpact: '21,000+ laid off in 2023-2024 efficiency push',
    sourceDate: '2023-03',
    mitigations: ['Pivot to AI ethics/policy roles', 'Develop technical skills', 'Move to product/engineering functions']
  },
  'amazon': {
    program: 'Amazon AI Automation',
    targetRoles: ['warehouse', 'logistics', 'customer service', 'content', 'hr'],
    strategy: 'REPLACEMENT',
    details: 'Aggressive warehouse robotics + AI customer service + Rufus shopping assistant',
    riskIncrease: 20,
    severity: 'HIGH',
    impactTimeline: '6-18 months',
    headcountImpact: '27,000+ laid off in 2023; ongoing robotics deployment',
    sourceDate: '2023-01',
    mitigations: ['Upskill to robotics maintenance/oversight', 'Move to AWS cloud roles', 'Develop operations analytics skills']
  }
};

// Score calculation — deeply integrates company AI evidence and known programs
export function calculateAICollaborationScore(roleAnalysis, companyStrategy) {
  if (!roleAnalysis) return { score: 50, level: 'Unknown', category: 'TRANSFORMATION', scoreBreakdown: {} };

  let score = 50;
  const breakdown = {};

  // 1. Human judgment required (0-100) — most important factor
  const humanJudgment = roleAnalysis.human_judgment_required || 50;
  const judgmentDelta = (humanJudgment - 50) * 0.4; // ±20 points
  score += judgmentDelta;
  breakdown.humanJudgment = { value: humanJudgment, delta: Math.round(judgmentDelta) };

  // 2. Routine percentage (0-100) — high routine = lower score
  const routine = roleAnalysis.routine_percentage || 50;
  const routineDelta = -(routine - 50) * 0.3; // ±15 points
  score += routineDelta;
  breakdown.routineWork = { value: routine, delta: Math.round(routineDelta) };

  // 3. Human advantage tasks count
  const humanAdvCount = roleAnalysis.human_advantage?.length || 0;
  const aiHandlesCount = roleAnalysis.ai_handles?.length || 0;
  let taskDelta = 0;
  if (humanAdvCount > aiHandlesCount) taskDelta = 8;
  else if (aiHandlesCount > humanAdvCount + 2) taskDelta = -8;
  score += taskDelta;
  breakdown.taskBalance = { humanAdv: humanAdvCount, aiHandles: aiHandlesCount, delta: taskDelta };

  // 4. Company strategy modifier — base
  let strategyDelta = 0;
  if (companyStrategy) {
    if (companyStrategy.strategy === 'REPLACEMENT') strategyDelta = -12;
    else if (companyStrategy.strategy === 'AUGMENTATION') strategyDelta = 8;
    else if (companyStrategy.strategy === 'MIXED') strategyDelta = -4;
  }
  score += strategyDelta;
  breakdown.companyStrategy = { strategy: companyStrategy?.strategy, delta: strategyDelta };

  // 5. Known AI programs — deep impact scoring
  let programDelta = 0;
  const knownPrograms = companyStrategy?.knownPrograms || [];
  if (knownPrograms.length > 0) {
    for (const prog of knownPrograms) {
      // Apply the effective risk increase (already accounts for role match)
      const riskPenalty = -prog.effectiveRiskIncrease;
      programDelta += riskPenalty;

      // Additional severity multiplier for CRITICAL/HIGH programs with role match
      if (prog.roleMatch && prog.severity === 'CRITICAL') {
        programDelta -= 10; // Extra penalty for direct critical impact
      } else if (prog.roleMatch && prog.severity === 'HIGH') {
        programDelta -= 5; // Extra penalty for direct high impact
      }
    }
    score += programDelta;
  }
  breakdown.knownPrograms = { count: knownPrograms.length, delta: programDelta, hasDirectMatch: knownPrograms.some(p => p.roleMatch) };

  // 6. LLM evidence reinforcement — if LLM independently confirms replacement strategy
  let evidenceDelta = 0;
  if (companyStrategy?.evidence) {
    const evidenceLower = companyStrategy.evidence.toLowerCase();
    if (evidenceLower.includes('replac') || evidenceLower.includes('automat') || evidenceLower.includes('layoff') || evidenceLower.includes('eliminat')) {
      evidenceDelta = -6;
    } else if (evidenceLower.includes('augment') || evidenceLower.includes('assist') || evidenceLower.includes('productiv') || evidenceLower.includes('empower')) {
      evidenceDelta = 4;
    }
    // If LLM evidence contradicts known programs, slight correction
    if (knownPrograms.length > 0 && knownPrograms[0].strategy === 'REPLACEMENT' && evidenceDelta > 0) {
      evidenceDelta = 0; // Don't let positive LLM spin override hard evidence
    }
  }
  score += evidenceDelta;
  breakdown.evidenceSignal = { delta: evidenceDelta };

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    level: getScoreLevel(score),
    category: getCategory(score),
    scoreBreakdown: breakdown
  };
}

function getScoreLevel(score) {
  if (score >= 85) return 'Very High Opportunity';
  if (score >= 75) return 'High Opportunity';
  if (score >= 60) return 'Good Opportunity';
  if (score >= 50) return 'Moderate - Evolving';
  if (score >= 35) return 'Significant Change Ahead';
  return 'Major Adaptation Needed';
}

function getCategory(score) {
  if (score >= 75) return 'AUGMENTATION';
  if (score >= 50) return 'TRANSFORMATION';
  return 'ADAPTATION';
}

export function getScoreColor(score) {
  if (score >= 75) return 'emerald';
  if (score >= 50) return 'amber';
  return 'orange';
}

export function getCategoryInfo(category) {
  switch (category) {
    case 'AUGMENTATION':
      return {
        label: 'AI Augmentation',
        emoji: '🚀',
        description: 'AI makes you better at your job — handles grunt work so you focus on high-value tasks',
        color: 'emerald'
      };
    case 'TRANSFORMATION':
      return {
        label: 'AI Transformation',
        emoji: '⚡',
        description: 'Your role is evolving — routine tasks automated, complex human work remains essential',
        color: 'amber'
      };
    case 'ADAPTATION':
      return {
        label: 'Significant Adaptation',
        emoji: '🔄',
        description: 'Major changes ahead — proactive upskilling and potential pivot recommended',
        color: 'orange'
      };
    default:
      return { label: 'Unknown', emoji: '❓', description: '', color: 'slate' };
  }
}

// Check if company has known AI replacement programs
export function checkKnownPrograms(companyName, jobTitle) {
  const companyLower = (companyName || '').toLowerCase();
  const titleLower = (jobTitle || '').toLowerCase();
  const matches = [];

  for (const [company, program] of Object.entries(KNOWN_AI_PROGRAMS)) {
    if (companyLower.includes(company)) {
      const roleMatch = program.targetRoles.some(role => titleLower.includes(role));
      matches.push({
        ...program,
        roleMatch,
        effectiveRiskIncrease: roleMatch ? program.riskIncrease : Math.round(program.riskIncrease * 0.3)
      });
    }
  }

  return matches;
}

// Generate adaptation path — deeply influenced by known programs and company strategy
export function generateAdaptationPath(score, roleAnalysis, companyStrategy) {
  const category = getCategory(score);
  const strategies = [];
  const knownPrograms = companyStrategy?.knownPrograms || [];
  const hasDirectThreat = knownPrograms.some(p => p.roleMatch && (p.severity === 'CRITICAL' || p.severity === 'HIGH'));
  const hasAnyReplacement = companyStrategy?.strategy === 'REPLACEMENT';

  // Urgency escalation based on known programs
  let urgencyOverride = null;
  let timelineOverride = null;
  let difficultyOverride = null;

  if (hasDirectThreat) {
    // Known program directly targets this role — escalate everything
    urgencyOverride = 'Critical';
    difficultyOverride = category === 'AUGMENTATION' ? 'Moderate' : 'Challenging';
    const fastestProgram = knownPrograms.filter(p => p.roleMatch).sort((a, b) => {
      const order = { 'CRITICAL': 0, 'HIGH': 1, 'MODERATE': 2, 'LOW': 3 };
      return (order[a.severity] || 3) - (order[b.severity] || 3);
    })[0];
    timelineOverride = fastestProgram?.impactTimeline || '6-12 months';
  } else if (hasAnyReplacement) {
    // Company has replacement strategy but not directly targeting this role
    if (category !== 'ADAPTATION') {
      urgencyOverride = 'Moderate-High';
    }
  }

  // Base strategies by category
  if (category === 'AUGMENTATION') {
    strategies.push({
      action: 'Master AI Tools for Your Role',
      priority: hasDirectThreat ? 'CRITICAL' : 'HIGH',
      timeline: '1-3 months',
      details: 'Learn the AI tools specific to your field to become 2-5x more productive',
      why: hasDirectThreat ? 'Company is actively deploying AI in your area — urgency is real' : 'Early adopters get promoted faster'
    });
    strategies.push({
      action: 'Double Down on Strategic Skills',
      priority: hasDirectThreat ? 'HIGH' : 'MEDIUM',
      timeline: '3-6 months',
      details: `Focus on ${(roleAnalysis?.skills_appreciating || ['leadership', 'strategy']).slice(0, 2).join(' and ')}`,
      why: 'These skills become MORE valuable as AI handles routine work'
    });
    strategies.push({
      action: 'Position as AI+Human Expert',
      priority: 'LOW',
      timeline: '6-12 months',
      details: 'Become the person who bridges AI capabilities with human judgment',
      why: 'Companies need people who understand both sides'
    });
  } else if (category === 'TRANSFORMATION') {
    strategies.push({
      action: 'Upskill to Handle Complex Cases',
      priority: 'CRITICAL',
      timeline: hasDirectThreat ? 'Start now' : '1-3 months',
      details: 'Focus on the 10% of work AI can\'t do — that\'s 90% of the value',
      why: hasDirectThreat ? 'Active AI program targeting your role type — act immediately' : 'Companies are learning AI-only approaches fail'
    });
    strategies.push({
      action: 'Learn AI Tool Management',
      priority: hasDirectThreat ? 'CRITICAL' : 'HIGH',
      timeline: '1-3 months',
      details: 'Become the person who configures, monitors, and fixes the AI systems replacing routine work',
      why: 'Someone needs to manage the AI — that person is valuable and hard to replace'
    });
    strategies.push({
      action: 'Develop Adjacent Skills',
      priority: 'HIGH',
      timeline: '3-9 months',
      details: `Build expertise in ${(roleAnalysis?.skills_appreciating || ['complex problem-solving', 'relationship building']).slice(0, 2).join(' and ')}`,
      why: 'Broaden your value beyond automatable tasks'
    });
  } else {
    strategies.push({
      action: 'Begin Career Pivot Planning',
      priority: 'CRITICAL',
      timeline: 'Start now',
      details: 'Identify adjacent roles where human judgment is central',
      why: 'Proactive change beats reactive scrambling'
    });
    strategies.push({
      action: 'Develop Analysis & Strategic Skills',
      priority: 'CRITICAL',
      timeline: '1-6 months',
      details: `Learn ${(roleAnalysis?.skills_appreciating || ['data analysis', 'process improvement']).slice(0, 2).join(' and ')}`,
      why: 'These skills transfer to roles with better AI collaboration'
    });
    strategies.push({
      action: 'Transition to Higher-Value Role',
      priority: 'HIGH',
      timeline: '6-18 months',
      details: 'Move toward roles that analyze, create, or manage rather than execute routine tasks',
      why: 'The demand for human skills isn\'t going away — it\'s shifting'
    });
  }

  // Inject program-specific mitigation strategies when a direct threat is detected
  if (hasDirectThreat) {
    const directPrograms = knownPrograms.filter(p => p.roleMatch);
    for (const prog of directPrograms) {
      if (prog.mitigations && prog.mitigations.length > 0) {
        strategies.splice(1, 0, {
          action: `Counter ${prog.program}: ${prog.mitigations[0]}`,
          priority: 'CRITICAL',
          timeline: prog.impactTimeline || '3-6 months',
          details: prog.mitigations.slice(0, 3).join('; '),
          why: `${prog.program} directly targets this role type — ${prog.headcountImpact || 'significant workforce impact reported'}`,
          isProgramSpecific: true,
          programName: prog.program
        });
      }
    }
  }

  return {
    difficulty: difficultyOverride || (score >= 75 ? 'Easy' : score >= 50 ? 'Moderate' : 'Challenging'),
    timeline: timelineOverride || (score >= 75 ? '3-6 months' : score >= 50 ? '6-12 months' : '12-24 months'),
    urgency: urgencyOverride || (score >= 75 ? 'Low' : score >= 50 ? 'Moderate' : 'High'),
    strategies,
    hasDirectThreat,
    hasAnyReplacement
  };
}

// Generate opportunity message
export function generateOpportunityMessage(score, roleAnalysis) {
  const category = getCategory(score);
  const aiHandles = roleAnalysis?.ai_handles || [];
  const humanAdv = roleAnalysis?.human_advantage || [];

  if (category === 'AUGMENTATION') {
    return `AI is making this role BETTER, not obsolete. Instead of spending time on ${aiHandles.slice(0, 2).join(' and ') || 'routine tasks'}, you can focus on ${humanAdv.slice(0, 2).join(' and ') || 'high-value strategic work'} — the work that actually matters.\n\nYou're not competing with AI. You're competing with others in your role who use AI better than you.`;
  } else if (category === 'TRANSFORMATION') {
    return `This role is evolving significantly. The routine ${aiHandles.slice(0, 2).join(', ') || 'tasks'} are being automated. BUT companies are learning that AI alone creates problems — they need human ${humanAdv.slice(0, 2).join(' and ') || 'judgment and creativity'}.\n\nThe new version of this role: Handle the cases that AI can't solve (which is most of the VALUE).`;
  } else {
    return `This role faces significant automation challenges. With high routine work and limited complex decision-making, AI can handle much of what this job currently does.\n\nThe GOOD NEWS: You have time to adapt. Focus on developing ${(roleAnalysis?.skills_appreciating || ['analytical thinking', 'strategic planning']).slice(0, 3).join(', ')} and consider adjacent roles where human judgment is more central.`;
  }
}

// Generate bottom line — incorporates company program context
export function generateBottomLine(score, category, companyStrategy) {
  const knownPrograms = companyStrategy?.knownPrograms || [];
  const hasDirectThreat = knownPrograms.some(p => p.roleMatch && (p.severity === 'CRITICAL' || p.severity === 'HIGH'));
  const threatProgram = knownPrograms.find(p => p.roleMatch);

  let base = '';
  if (category === 'AUGMENTATION') {
    base = 'This is your opportunity to become dramatically more productive. Learn the AI tools. Focus on strategic/creative work. Advance faster than peers who resist the change.';
  } else if (category === 'TRANSFORMATION') {
    base = 'The role is changing, but humans remain essential. Upskill to handle complex work AI can\'t touch. Position yourself as the "AI + Human Specialist" who solves what automation breaks.';
  } else {
    base = 'Major career evolution recommended. Don\'t wait for the change to happen TO you. Proactively develop skills in areas where humans have clear advantages.';
  }

  // Append program-specific warning
  if (hasDirectThreat && threatProgram) {
    base += `\n\n⚠️ Important: ${threatProgram.program} at this company directly targets roles like yours. ${threatProgram.headcountImpact || 'Significant workforce impact has been reported.'}. Start your adaptation plan immediately.`;
  } else if (companyStrategy?.strategy === 'REPLACEMENT' && !hasDirectThreat) {
    base += '\n\nNote: This company has an aggressive AI automation approach. While your specific role may not be immediately targeted, stay vigilant and proactively develop hard-to-automate skills.';
  }

  return base;
}