import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { motion } from 'framer-motion';
import { format, isSameDay, parseISO } from 'date-fns';
import { Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ApplicationCalendar({ applications, onRefetch }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get all interview dates
  const interviewDates = applications.flatMap(app =>
    (app.interview_dates || []).map(interview => ({
      ...interview,
      company: app.company_name,
      jobTitle: app.job_title,
      logo: app.company_logo
    }))
  );

  // Get interviews for selected date
  const selectedDateInterviews = interviewDates.filter(interview =>
    isSameDay(parseISO(interview.date), selectedDate)
  );

  // Dates that have interviews
  const datesWithInterviews = interviewDates.map(i => parseISO(i.date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Interview Schedule</h2>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
          modifiers={{
            interview: datesWithInterviews
          }}
          modifiersStyles={{
            interview: {
              fontWeight: 'bold',
              backgroundColor: '#e0e7ff',
              color: '#4f46e5'
            }
          }}
        />
        <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
          <p className="text-xs text-indigo-700">
            📅 Dates with scheduled interviews are highlighted
          </p>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {format(selectedDate, 'MMMM d, yyyy')}
        </h2>

        {selectedDateInterviews.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No interviews scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDateInterviews.map((interview, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <div className="flex items-start gap-3">
                  {interview.logo && (
                    <img src={interview.logo} alt="" className="w-12 h-12 rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{interview.company}</h3>
                    <p className="text-sm text-slate-600 mb-2">{interview.jobTitle}</p>
                    
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{format(parseISO(interview.date), 'h:mm a')}</span>
                      </div>
                      
                      {interview.type && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="w-4 h-4" />
                          <span>{interview.type}</span>
                        </div>
                      )}

                      {interview.notes && (
                        <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded">
                          {interview.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}