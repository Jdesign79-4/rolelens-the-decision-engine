import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, ExternalLink, Trash2, Eye, Calendar, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import ApplicationDetailsModal from './ApplicationDetailsModal';

export default function ApplicationCard({ application, isDragging, onRefetch, onSelect }) {
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobApplication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const daysInStage = application.stage_updated_at
    ? formatDistanceToNow(new Date(application.stage_updated_at), { addSuffix: false })
    : 'New';

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low: 'bg-slate-100 text-slate-600 border-slate-300'
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-xl border-2 border-slate-200 p-3 cursor-grab active:cursor-grabbing transition-all ${
          isDragging ? 'shadow-2xl ring-2 ring-indigo-400' : 'hover:shadow-md'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img 
              src={application.company_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(application.company_name)}&background=random&size=40`}
              alt="" 
              className="w-8 h-8 rounded-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="font-semibold text-slate-800 text-sm truncate">{application.company_name}</h4>
                {application.is_public && application.ticker_symbol && (
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded">
                    {application.ticker_symbol}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{application.job_title}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetails(true)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {application.job_url && (
                <DropdownMenuItem onClick={() => window.open(application.job_url, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Posting
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => deleteMutation.mutate(application.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Match Score */}
        {application.match_score && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Match</span>
              <span className="font-semibold text-slate-700">{application.match_score}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                style={{ width: `${application.match_score}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">In stage:</span>
            <span className="font-medium text-slate-700">{daysInStage}</span>
          </div>
          
          {application.priority && (
            <div className={`px-2 py-1 rounded-md border text-center font-medium ${priorityColors[application.priority]}`}>
              {application.priority.toUpperCase()}
            </div>
          )}

          {application.follow_up_date && (
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              <Calendar className="w-3 h-3" />
              <span>Follow-up due</span>
            </div>
          )}

          {application.attachments && application.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-slate-600">
              <Paperclip className="w-3 h-3" />
              <span>{application.attachments.length} files</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {application.tags && application.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {application.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                {tag}
              </span>
            ))}
            {application.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                +{application.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </motion.div>

      {showDetails && (
        <ApplicationDetailsModal
          application={application}
          onClose={() => setShowDetails(false)}
          onRefetch={onRefetch}
        />
      )}
    </>
  );
}