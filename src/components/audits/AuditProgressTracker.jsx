import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

export default function AuditProgressTracker({ audit }) {
  const stages = [
    { id: 'scheduled', label: 'Scheduled', status: 'scheduled' },
    { id: 'in_progress', label: 'In Progress', status: 'in_progress' },
    { id: 'completed', label: 'Completed', status: 'completed' }
  ];

  const currentStageIndex = stages.findIndex(s => s.status === audit.status);
  const progressPercentage = ((currentStageIndex + 1) / stages.length) * 100;

  const getStageIcon = (index) => {
    if (index < currentStageIndex) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    } else if (index === currentStageIndex) {
      return <Clock className="w-5 h-5 text-sky-400" />;
    }
    return <Circle className="w-5 h-5 text-slate-500" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-sky-100 text-sky-700';
      case 'overdue': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const checklistProgress = audit.checklist?.length > 0
    ? (audit.checklist.filter(item => item.completed).length / audit.checklist.length) * 100
    : 0;

  return (
    <Card className="border-2 border-sky-400 bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-300">Audit Progress</CardTitle>
          <Badge className={getStatusColor(audit.status)}>{audit.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Overall Progress</span>
            <span className="text-slate-300 font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-3">
              {getStageIcon(index)}
              <div className="flex-1">
                <p className={`font-medium ${index <= currentStageIndex ? 'text-slate-300' : 'text-slate-500'}`}>
                  {stage.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Checklist Progress */}
        {audit.checklist && audit.checklist.length > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Checklist Completion</span>
              <span className="text-slate-300 font-medium">
                {audit.checklist.filter(item => item.completed).length} / {audit.checklist.length}
              </span>
            </div>
            <Progress value={checklistProgress} className="h-2" />
          </div>
        )}

        {/* Key Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-400">Assigned To</p>
            <p className="text-sm text-slate-300 font-medium">{audit.assigned_to || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Due Date</p>
            <p className="text-sm text-slate-300 font-medium">
              {audit.due_date ? new Date(audit.due_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}