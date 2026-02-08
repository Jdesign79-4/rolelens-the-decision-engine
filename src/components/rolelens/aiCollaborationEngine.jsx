/**
 * AI Collaboration Opportunity Scoring Engine
 * Calculates how AI impacts a role: Augmentation vs Transformation vs Adaptation
 */

// Known AI programs by company
const KNOWN_AI_PROGRAMS = {
  'salesforce': {
    program: 'AgentForce',
    targetRoles: ['sales', 'sdr', 'customer service', 'support', 'account'],
    strategy: 'REPLACEMENT',
    details: 'AgentForce AI agents handle sales development and customer service autonomously',
    riskIncrease: 25
  },
  'klarna': {
    program: 'AI Customer Service',
    targetRoles: ['customer service', 'support'],
    strategy: 'REPLACEMENT',
    details: 'AI chatbot handling 2/3 of customer service chats, equivalent to 700 FTE',
    riskIncrease: 30
  },
  'microsoft': {
    program: 'Microsoft 365 Copilot',
    targetRoles: ['content', 'analyst', 'coordinator'],
    strategy: 'AUGMENTATION',
    details: 'AI assistant integrated into Office suite for productivity enhancement',
    riskIncrease: -10
  }
};

// Score calculation
export function calculateAICollaborationScore(roleAnalysis, companyStrategy) {
  if (!roleAnalysis) return { score: 50, level: 'Unknown', category: 'TRANSFORMATION' };

  let score = 50;

  // Human judgment required (0-100) — most important factor
  const humanJudgment = roleAnalysis.human_judgment_required || 50;
  score += (humanJudgment - 50) * 0.4; // ±20 points

  // Routine percentage (0-100) — high routine = lower score
  const routine = roleAnalysis.routine_percentage || 50;
  score -= (routine - 50) * 0.3; // ±15 points

  // Human advantage tasks count
  const humanAdvCount = roleAnalysis.human_advantage?.length || 0;
  const aiHandlesCount = roleAnalysis.ai_handles?.length || 0;
  if (humanAdvCount > aiHandlesCount) score += 8;
  else if (aiHandlesCount > humanAdvCount + 2) score -= 8;

  // Company strategy modifier
  if (companyStrategy) {
    if (companyStrategy.strategy === 'REPLACEMENT') score -= 12;
    else if (companyStrategy.strategy === 'AUGMENTATION') score += 8;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    level: getScoreLevel(score),
    category: getCategory(score)
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

// Generate adaptation path based on score and analysis
export function generateAdaptationPath(score, roleAnalysis) {
  const category = getCategory(score);
  const strategies = [];

  if (category === 'AUGMENTATION') {
    strategies.push({
      action: 'Master AI Tools for Your Role',
      priority: 'HIGH',
      timeline: '1-3 months',
      details: 'Learn the AI tools specific to your field to become 2-5x more productive',
      why: 'Early adopters get promoted faster'
    });
    strategies.push({
      action: 'Double Down on Strategic Skills',
      priority: 'MEDIUM',
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
      timeline: '1-3 months',
      details: 'Focus on the 10% of work AI can\'t do — that\'s 90% of the value',
      why: 'Companies are learning AI-only approaches fail'
    });
    strategies.push({
      action: 'Learn AI Tool Management',
      priority: 'HIGH',
      timeline: '3-6 months',
      details: 'Become the person who configures, monitors, and fixes AI systems',
      why: 'Someone needs to manage the AI — that person is valuable'
    });
    strategies.push({
      action: 'Develop Adjacent Skills',
      priority: 'MEDIUM',
      timeline: '6-12 months',
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

  return {
    difficulty: score >= 75 ? 'Easy' : score >= 50 ? 'Moderate' : 'Challenging',
    timeline: score >= 75 ? '3-6 months' : score >= 50 ? '6-12 months' : '12-24 months',
    urgency: score >= 75 ? 'Low' : score >= 50 ? 'Moderate' : 'High',
    strategies
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

// Generate bottom line
export function generateBottomLine(score, category) {
  if (category === 'AUGMENTATION') {
    return 'This is your opportunity to become dramatically more productive. Learn the AI tools. Focus on strategic/creative work. Advance faster than peers who resist the change.';
  } else if (category === 'TRANSFORMATION') {
    return 'The role is changing, but humans remain essential. Upskill to handle complex work AI can\'t touch. Position yourself as the "AI + Human Specialist" who solves what automation breaks.';
  } else {
    return 'Major career evolution recommended. Don\'t wait for the change to happen TO you. Proactively develop skills in areas where humans have clear advantages.';
  }
}