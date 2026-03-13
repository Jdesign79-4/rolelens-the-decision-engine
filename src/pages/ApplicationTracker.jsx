import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, FileText } from 'lucide-react';
import ApplicationKanban from '@/components/application-tracker/ApplicationKanban';
import ApplicationTimeline from '@/components/application-tracker/ApplicationTimeline';
import ApplicationCalendar from '@/components/application-tracker/ApplicationCalendar';
import ApplicationStats from '@/components/application-tracker/ApplicationStats';
import EmailTemplateGenerator from '@/components/application-tracker/EmailTemplateGenerator';
import AddApplicationModal from '@/components/application-tracker/AddApplicationModal';
import ApplicationFilters from '@/components/application-tracker/ApplicationFilters';
import { Link } from 'react-router-dom';

export default function ApplicationTracker() {
  const [activeView, setActiveView] = useState('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailGen, setShowEmailGen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filters, setFilters] = useState({ stage: 'all', priority: 'all', tags: [], sortBy: 'stage_updated_at' });

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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 card-raised" style={{ borderRadius: 0, borderBottom: '1px solid var(--sf2)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/RoleLens" className="card-subtle w-9 h-9 flex items-center justify-center rounded-full">
                <div className="w-3 h-3 rounded-full" style={{ background: 'var(--sk)' }} />
              </Link>
              <div>
                <h1 className="font-serif-zen text-xl font-semibold" style={{ color: 'var(--t1)' }}>My Applications</h1>
                <p className="text-xs" style={{ color: 'var(--t3)' }}>Track your journey with grace</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEmailGen(true)}
                className="card-subtle px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 zen-transition"
                style={{ color: 'var(--t2)' }}>
                <FileText className="w-4 h-4" />
                Email Templates
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 zen-transition"
                style={{ background: 'var(--sk)', boxShadow: 'var(--ns)' }}>
                <Plus className="w-4 h-4" />
                Add Application
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList className="rounded-xl" style={{ background: 'var(--sf)' }}>
                <TabsTrigger value="kanban" className="rounded-lg text-xs">Board</TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-lg text-xs">Timeline</TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-lg text-xs">Calendar</TabsTrigger>
                <TabsTrigger value="stats" className="rounded-lg text-xs">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <ApplicationFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeView === 'kanban' && <ApplicationKanban applications={filteredApplications} onRefetch={refetch} onSelectApp={setSelectedApp} />}
        {activeView === 'timeline' && <ApplicationTimeline applications={filteredApplications} />}
        {activeView === 'calendar' && <ApplicationCalendar applications={filteredApplications} onRefetch={refetch} />}
        {activeView === 'stats' && <ApplicationStats applications={applications} />}
      </div>

      {showAddModal && <AddApplicationModal onClose={() => setShowAddModal(false)} onSuccess={() => { refetch(); setShowAddModal(false); }} />}
      {showEmailGen && <EmailTemplateGenerator application={selectedApp} onClose={() => setShowEmailGen(false)} />}
    </div>
  );
}