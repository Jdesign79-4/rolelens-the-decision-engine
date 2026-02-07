import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TEMPLATE_TYPES = [
  { id: 'cover_letter', label: 'Cover Letter', icon: '📄' },
  { id: 'follow_up', label: 'Follow-up Email', icon: '📧' },
  { id: 'thank_you', label: 'Thank You Note', icon: '🙏' },
  { id: 'acceptance', label: 'Offer Acceptance', icon: '🎉' },
  { id: 'decline', label: 'Polite Decline', icon: '🤝' }
];

export default function EmailTemplateGenerator({ application, onClose }) {
  const [templateType, setTemplateType] = useState('cover_letter');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customContext, setCustomContext] = useState('');

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional ${TEMPLATE_TYPES.find(t => t.id === templateType)?.label} email.

${application ? `
Company: ${application.company_name}
Role: ${application.job_title}
${application.contact_person ? `Hiring Manager: ${application.contact_person}` : ''}
` : ''}

${customContext ? `Additional Context: ${customContext}` : ''}

Generate a well-written, professional email that:
- Is personalized and authentic
- Uses appropriate tone and formality
- Is concise but comprehensive
- Includes proper greeting and closing
- Highlights relevant skills and enthusiasm (for cover letters)
- Shows gratitude and professionalism (for thank you notes)
- Is respectful and positive (for declines)

Return ONLY the email text, no explanations.`,
        add_context_from_internet: false
      });

      setGeneratedEmail(result);
    } catch (error) {
      toast.error('Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast.success('Email copied to clipboard');
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
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Email Template Generator</h2>
            <p className="text-sm text-slate-500 mt-1">AI-powered professional email templates</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Template Type Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Email Type</label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Context */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Additional Context (Optional)
            </label>
            <Textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Add any specific details you want to include..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateEmail}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>

          {/* Generated Email */}
          {generatedEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Generated Email</label>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap text-sm text-slate-700">
                {generatedEmail}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}