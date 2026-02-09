import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  FileSearch, 
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function RecentActivityList({ evaluations = [], incidents = [], audits = [] }) {
  const activities = [
    ...evaluations.slice(0, 3).map(e => ({
      type: 'evaluation',
      title: `Evaluation: ${e.agent_name}`,
      subtitle: `Score: ${e.final_score?.toFixed(1)}%`,
      date: e.created_date,
      status: e.status,
      icon: ClipboardCheck,
      color: 'indigo'
    })),
    ...incidents.slice(0, 3).map(i => ({
      type: 'incident',
      title: i.title,
      subtitle: i.category?.replace(/_/g, ' '),
      date: i.created_date,
      status: i.status,
      severity: i.severity,
      icon: AlertTriangle,
      color: 'rose'
    })),
    ...audits.slice(0, 3).map(a => ({
      type: 'audit',
      title: a.title,
      subtitle: a.audit_type,
      date: a.created_date,
      status: a.status,
      icon: FileSearch,
      color: 'emerald'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const getStatusBadge = (activity) => {
    const statusConfig = {
      draft: { class: 'bg-slate-100 text-slate-700', label: 'Draft' },
      submitted: { class: 'bg-blue-100 text-blue-700', label: 'Submitted' },
      approved: { class: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
      open: { class: 'bg-amber-100 text-amber-700', label: 'Open' },
      in_progress: { class: 'bg-blue-100 text-blue-700', label: 'In Progress' },
      resolved: { class: 'bg-emerald-100 text-emerald-700', label: 'Resolved' },
      scheduled: { class: 'bg-slate-100 text-slate-700', label: 'Scheduled' },
      completed: { class: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
      overdue: { class: 'bg-rose-100 text-rose-700', label: 'Overdue' }
    };
    const config = statusConfig[activity.status] || statusConfig.draft;
    return <Badge className={`${config.class} text-xs font-medium`}>{config.label}</Badge>;
  };

  const getSeverityDot = (severity) => {
    const colors = {
      critical: 'bg-rose-500',
      high: 'bg-orange-500',
      medium: 'bg-amber-500',
      low: 'bg-emerald-500'
    };
    return colors[severity] || 'bg-slate-400';
  };

  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };

  return (
    <Card className="shadow-sm border-2 border-sky-400 bg-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 hover:bg-slate-700 transition-colors">
                <div className={`p-2 rounded-xl ${colorClasses[activity.color]}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                    {activity.severity && (
                      <span className={`w-2 h-2 rounded-full ${getSeverityDot(activity.severity)}`} />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 capitalize">{activity.subtitle}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(activity)}
                  <span className="text-xs text-slate-400">
                    {activity.date ? format(new Date(activity.date), 'MMM d') : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}