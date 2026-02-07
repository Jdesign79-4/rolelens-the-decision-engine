import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import ApplicationCard from './ApplicationCard';

const STAGES = [
  { id: 'saved', label: 'Saved', color: 'bg-slate-100', badge: 'bg-slate-500' },
  { id: 'applied', label: 'Applied', color: 'bg-blue-100', badge: 'bg-blue-500' },
  { id: 'phone_screen', label: 'Phone Screen', color: 'bg-purple-100', badge: 'bg-purple-500' },
  { id: 'interview', label: 'Interview', color: 'bg-amber-100', badge: 'bg-amber-500' },
  { id: 'offer', label: 'Offer', color: 'bg-emerald-100', badge: 'bg-emerald-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100', badge: 'bg-red-500' },
  { id: 'archived', label: 'Archived', color: 'bg-gray-100', badge: 'bg-gray-500' }
];

export default function ApplicationKanban({ applications, onRefetch, onSelectApp }) {
  const queryClient = useQueryClient();

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }) => {
      const timeline = applications.find(app => app.id === id)?.timeline || [];
      timeline.push({
        timestamp: new Date().toISOString(),
        action: 'stage_changed',
        details: `Moved to ${STAGES.find(s => s.id === stage)?.label}`
      });

      return base44.entities.JobApplication.update(id, {
        stage,
        stage_updated_at: new Date().toISOString(),
        timeline
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStage = destination.droppableId;

    updateStageMutation.mutate({ id: draggableId, stage: newStage });
  };

  const getApplicationsByStage = (stageId) => {
    return applications.filter(app => app.stage === stageId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-7 gap-4">
        {STAGES.map((stage) => {
          const stageApps = getApplicationsByStage(stage.id);
          
          return (
            <div key={stage.id} className="flex flex-col">
              <div className={`${stage.color} rounded-t-xl p-3 border-b-2 border-slate-200`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{stage.label}</h3>
                  <span className={`${stage.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
                    {stageApps.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 min-h-[400px] rounded-b-xl border-2 border-t-0 transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'border-indigo-400 bg-indigo-50' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {stageApps.map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ApplicationCard
                              application={app}
                              isDragging={snapshot.isDragging}
                              onRefetch={onRefetch}
                              onSelect={onSelectApp}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {stageApps.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No applications
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}