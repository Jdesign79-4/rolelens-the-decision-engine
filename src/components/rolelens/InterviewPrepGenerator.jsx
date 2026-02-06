import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, X, Download, FileText, ClipboardList, Lightbulb, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InterviewPrepGenerator({ job, onClose }) {
  const [prepData, setPrepData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [error, setError] = useState(null);

  useEffect(() => {
    generatePrepKit();
  }, [job]);

  const generatePrepKit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive interview preparation kit for this job opportunity:

Company: ${job.meta.company}
Position: ${job.meta.title}
Location: ${job.meta.location}

Please generate:
1. 10 likely interview questions specific to this role (mix of behavioral, technical, and situational)
2. STAR-method answer frameworks for the behavioral questions
3. Key technical topics to review based on the job requirements
4. 5-7 smart questions the candidate should ask the interviewer (tailored to this company and role)
5. A comprehensive cheat sheet with:
   - Company's mission and values
   - Recent news/company developments
   - Key responsibilities for this role
   - Company culture insights
   - Growth opportunities

Make it actionable and specific to ${job.meta.company}'s ${job.meta.title} role.`,
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
                  category: { type: "string", enum: ["behavioral", "technical", "situational"] },
                  tips: { type: "string" }
                }
              },
              description: "10 likely interview questions"
            },
            starFrameworks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionIndex: { type: "number" },
                  situation: { type: "string" },
                  task: { type: "string" },
                  action: { type: "string" },
                  result: { type: "string" }
                }
              },
              description: "STAR method frameworks for behavioral questions"
            },
            technicalTopics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  importance: { type: "string", enum: ["critical", "important", "nice-to-have"] },
                  reviewGuide: { type: "string" }
                }
              },
              description: "Technical topics to review"
            },
            candidateQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  rationale: { type: "string" }
                }
              },
              description: "5-7 questions for the candidate to ask"
            },
            cheatSheet: {
              type: "object",
              properties: {
                companyMission: { type: "string" },
                recentNews: { type: "string" },
                keyResponsibilities: { type: "string" },
                companyCulture: { type: "string" },
                growthOpportunities: { type: "string" }
              }
            }
          }
        }
      });

      setPrepData(result);
    } catch (err) {
      console.error('Failed to generate prep kit:', err);
      setError('Failed to generate interview prep. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAsMarkdown = () => {
    if (!prepData) return;

    let markdown = `# Interview Prep Kit\n`;
    markdown += `## ${job.meta.company} - ${job.meta.title}\n\n`;

    markdown += `### Cheat Sheet\n\n`;
    markdown += `**Company Mission:** ${prepData.cheatSheet.companyMission}\n\n`;
    markdown += `**Recent News:** ${prepData.cheatSheet.recentNews}\n\n`;
    markdown += `**Key Responsibilities:** ${prepData.cheatSheet.keyResponsibilities}\n\n`;
    markdown += `**Company Culture:** ${prepData.cheatSheet.companyCulture}\n\n`;
    markdown += `**Growth Opportunities:** ${prepData.cheatSheet.growthOpportunities}\n\n`;

    markdown += `### Interview Questions\n\n`;
    prepData.interviewQuestions.forEach((q, i) => {
      markdown += `${i + 1}. **${q.question}** (${q.category})\n`;
      markdown += `   *Tip: ${q.tips}*\n\n`;
    });

    markdown += `### STAR Method Frameworks\n\n`;
    prepData.starFrameworks.forEach((f) => {
      markdown += `**Question ${f.questionIndex + 1}:**\n`;
      markdown += `- Situation: ${f.situation}\n`;
      markdown += `- Task: ${f.task}\n`;
      markdown += `- Action: ${f.action}\n`;
      markdown += `- Result: ${f.result}\n\n`;
    });

    markdown += `### Technical Topics to Review\n\n`;
    prepData.technicalTopics.forEach((t) => {
      markdown += `- **${t.topic}** (${t.importance}): ${t.reviewGuide}\n`;
    });

    markdown += `### Questions to Ask the Interviewer\n\n`;
    prepData.candidateQuestions.forEach((q, i) => {
      markdown += `${i + 1}. ${q.question}\n`;
      markdown += `   *Why: ${q.rationale}*\n\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown));
    element.setAttribute('download', `${job.meta.company}_interview_prep.md`);
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

    pdf.save(`${job.meta.company}_interview_prep.pdf`);
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
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Interview Prep Kit</h2>
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
                <Lightbulb className="absolute inset-0 m-auto w-5 h-5 text-slate-600" />
              </div>
              <p className="mt-4 text-slate-600 font-medium">Generating your interview prep kit...</p>
              <p className="text-sm text-slate-500 mt-1">This may take a moment</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : prepData ? (
            <div id="prep-content" className="p-6 space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200">
                {[
                  { id: 'cheatsheet', label: 'Cheat Sheet', icon: BookOpen },
                  { id: 'questions', label: 'Interview Q&A', icon: ClipboardList },
                  { id: 'technical', label: 'Tech Topics', icon: FileText },
                  { id: 'candidate', label: 'Your Questions', icon: MessageSquare }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-slate-800 text-slate-800'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Cheat Sheet */}
              {activeTab === 'cheatsheet' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Mission & Values</h3>
                    <p className="text-slate-600">{prepData.cheatSheet.companyMission}</p>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Recent News</h3>
                    <p className="text-slate-600">{prepData.cheatSheet.recentNews}</p>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Key Responsibilities</h3>
                    <p className="text-slate-600">{prepData.cheatSheet.keyResponsibilities}</p>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Company Culture</h3>
                    <p className="text-slate-600">{prepData.cheatSheet.companyCulture}</p>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Growth Opportunities</h3>
                    <p className="text-slate-600">{prepData.cheatSheet.growthOpportunities}</p>
                  </div>
                </motion.div>
              )}

              {/* Interview Questions */}
              {activeTab === 'questions' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {prepData.interviewQuestions.map((q, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-slate-800">{i + 1}. {q.question}</h4>
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                          backgroundColor: q.category === 'behavioral' ? '#FEE2E2' : q.category === 'technical' ? '#DBEAFE' : '#FEF3C7',
                          color: q.category === 'behavioral' ? '#991B1B' : q.category === 'technical' ? '#1E40AF' : '#92400E'
                        }}>
                          {q.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600"><strong>💡 Tip:</strong> {q.tips}</p>
                      {prepData.starFrameworks.find(f => f.questionIndex === i) && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs font-medium text-slate-700 mb-2">STAR Framework:</p>
                          <div className="text-xs text-slate-600 space-y-1">
                            <p><strong>S:</strong> {prepData.starFrameworks.find(f => f.questionIndex === i).situation}</p>
                            <p><strong>T:</strong> {prepData.starFrameworks.find(f => f.questionIndex === i).task}</p>
                            <p><strong>A:</strong> {prepData.starFrameworks.find(f => f.questionIndex === i).action}</p>
                            <p><strong>R:</strong> {prepData.starFrameworks.find(f => f.questionIndex === i).result}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Technical Topics */}
              {activeTab === 'technical' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {prepData.technicalTopics.map((t, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800">{t.topic}</h4>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          t.importance === 'critical' ? 'bg-red-100 text-red-700' :
                          t.importance === 'important' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {t.importance}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{t.reviewGuide}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Candidate Questions */}
              {activeTab === 'candidate' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {prepData.candidateQuestions.map((q, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">{i + 1}. {q.question}</h4>
                      <p className="text-sm text-slate-600"><strong>Why ask:</strong> {q.rationale}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {prepData && !isLoading && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">Ready to ace the interview?</p>
            <div className="flex gap-2">
              <Button
                onClick={exportAsMarkdown}
                variant="outline"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Export Markdown
              </Button>
              <Button
                onClick={exportAsPDF}
                className="gap-2 bg-slate-800 hover:bg-slate-700 text-white"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}