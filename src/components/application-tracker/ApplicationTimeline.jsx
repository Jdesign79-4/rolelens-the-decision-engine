import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Calendar, FileText, Mail, Phone } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const getActivityIcon = (action) => {
  const icons = {
    stage_changed: CheckCircle2,
    applied: FileText,
    interview_scheduled: Calendar,
    email_sent: Mail,
    phone_screen: Phone,
    saved: Clock
  };
  return icons[action] || Clock;
};

const getActivityColor = (action) => {
  const colors = {
    stage_changed: 'bg-blue-100 text-blue-600',
    applied: 'bg-green-100 text-green-600',
    interview_scheduled: 'bg-purple-100 text-purple-600',
    email_sent: 'bg-amber-100 text-amber-600',
    phone_screen: 'bg-indigo-100 text-indigo-600',
    saved: 'bg-slate-100 text-slate-600'
  };
  return colors[action] || 'bg-slate-100 text-slate-600';
};

export default function ApplicationTimeline({ applications }) {
  // Aggregate all timeline events from all applications
  const allEvents = applications.flatMap(app => 
    (app.timeline || []).map(event => ({
      ...event,
      company: app.company_name,
      jobTitle: app.job_title,
      logo: app.company_logo,
      appId: app.id
    }))
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Activity Timeline</h2>
        
        {allEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activities yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allEvents.map((event, idx) => {
              const Icon = getActivityIcon(event.action);
              const colorClass = getActivityColor(event.action);
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {idx < allEvents.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 my-1" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {event.logo && (
                          <img src={event.logo} alt="" className="w-6 h-6 rounded" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {event.company}
                          </p>
                          <p className="text-xs text-slate-500">{event.jobTitle}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(parseISO(event.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{event.details}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}