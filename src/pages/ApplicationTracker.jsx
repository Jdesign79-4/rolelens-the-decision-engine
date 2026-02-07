import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Calendar, FileText, Filter } from 'lucide-react';
import ApplicationKanban from '@/components/application-tracker/ApplicationKanban';
import ApplicationTimeline from '@/components/application-tracker/ApplicationTimeline';
import ApplicationCalendar from '@/components/application-tracker/ApplicationCalendar';
import ApplicationStats from '@/components/application-tracker/ApplicationStats';
import EmailTemplateGenerator from '@/components/application-tracker/EmailTemplateGenerator';
import AddApplicationModal from '@/components/application-tracker/AddApplicationModal';
import ApplicationFilters from '@/components/application-tracker/ApplicationFilters';

export default function ApplicationTracker() {
  const [activeView, setActiveView] = useState('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailGen, setShowEmailGen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filters, setFilters] = useState({
    stage: 'all',
    priority: 'all',
    tags: [],
    sortBy: 'stage_updated_at'
  });

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.JobApplication.list('-stage_updated_at'),
    initialData: []
  });

  const filteredApplications = applications.filter(app => {
    if (filters.stage !== 'all' && app.stage !== filters.stage) return false;
    if (filters.priority !== 'all' && app.priority !== filters.priority) return false;
    if (filters.tags.length > 0 && !filters.tags.some(tag => app.tags?.includes(tag))) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Application Tracker</h1>
              <p className="text-sm text-slate-500">Manage and track your job applications</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowEmailGen(true)}
                variant="outline"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Email Templates
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Application
              </Button>
            </div>
          </div>

          {/* Tabs and Filters */}
          <div className="flex items-center justify-between">
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList>
                <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="stats">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <ApplicationFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeView === 'kanban' && (
          <ApplicationKanban 
            applications={filteredApplications} 
            onRefetch={refetch}
            onSelectApp={setSelectedApp}
          />
        )}
        {activeView === 'timeline' && (
          <ApplicationTimeline applications={filteredApplications} />
        )}
        {activeView === 'calendar' && (
          <ApplicationCalendar applications={filteredApplications} onRefetch={refetch} />
        )}
        {activeView === 'stats' && (
          <ApplicationStats applications={applications} />
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            refetch();
            setShowAddModal(false);
          }}
        />
      )}
      
      {showEmailGen && (
        <EmailTemplateGenerator
          application={selectedApp}
          onClose={() => setShowEmailGen(false)}
        />
      )}
    </div>
  );
}