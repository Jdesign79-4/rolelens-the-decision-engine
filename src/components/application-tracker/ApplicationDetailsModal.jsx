import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Paperclip, Upload, Plus, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ApplicationDetailsModal({ application, onClose, onRefetch }) {
  const [notes, setNotes] = useState(application.notes || '');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.JobApplication.update(application.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application updated');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const attachments = application.attachments || [];
      attachments.push({
        name: file.name,
        url: file_url,
        type: file.type
      });
      updateMutation.mutate({ attachments });
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const saveNotes = () => {
    updateMutation.mutate({ notes });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <img 
              src={application.company_logo} 
              alt="" 
              className="w-16 h-16 rounded-xl"
            />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{application.company_name}</h2>
              <p className="text-slate-600">{application.job_title}</p>
              <p className="text-sm text-slate-500">{application.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Basic Info */}
          {application.job_url && (
            <a 
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="w-4 h-4" />
              View Job Posting
            </a>
          )}

          {/* Timeline */}
          {application.timeline && application.timeline.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Activity Timeline</h3>
              <div className="space-y-2">
                {application.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{event.details}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Attachments</h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button size="sm" variant="outline" disabled={isUploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </label>
            </div>
            {application.attachments && application.attachments.length > 0 ? (
              <div className="space-y-2">
                {application.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{file.name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No attachments yet</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={5}
              className="resize-none"
            />
            <Button
              onClick={saveNotes}
              className="mt-2"
              size="sm"
            >
              Save Notes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}